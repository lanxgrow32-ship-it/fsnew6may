'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { runSupportAi } from '@/ai/flows/support-agent-flow';
import { getAutoClassification, getBalanceFromPlanName, generateStockmintUsername, calculateTrialExpiry, getMarketType } from '@/lib/plan-utils';
import { randomBytes } from 'crypto';
import { differenceInSeconds, addDays } from 'date-fns';
import { generateWatchPaySignature } from '@/lib/watchpay';

/**
 * Global Session Cleanup Protocol (v11.0)
 * Handles Grace Periods, Free Trials, and the new 7-Day "Pro" accounts.
 */
export async function cleanupGracePeriods() {
    try {
        const now = new Date().toISOString();
        
        // 1. KYC Grace Period Check
        const { data: expiredGrace } = await supabaseAdmin
            .from('user_accounts')
            .select('*, profiles(kyc_status)')
            .eq('is_blocked', false)
            .lte('grace_period_expiry', now);
        
        if (expiredGrace && expiredGrace.length > 0) {
            const apiKey = process.env.STOCKMINT_API_KEY;
            for (const acc of expiredGrace) {
                if (acc.profiles.kyc_status !== 'verified') {
                    if (apiKey && acc.trading_username) {
                        await fetch('https://stockmint.io/api/users/update-status', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                            body: JSON.stringify({ email: acc.trading_username, status: 'blocked', reason: 'KYC_PENDING' })
                        });
                    }
                    await supabaseAdmin.from('user_accounts').update({ is_blocked: true }).eq('id', acc.id);
                }
            }
        }

        // 2. 7-Day PRO & TRIAL EXPRIY SWEEP (v11.0)
        const { data: expiredSessions } = await supabaseAdmin
            .from('user_accounts')
            .select('*')
            .neq('status', 'deleted')
            .lte('expires_at', now);
        
        if (expiredSessions && expiredSessions.length > 0) {
            const apiKey = process.env.STOCKMINT_API_KEY;
            for (const acc of expiredSessions) {
                if (apiKey && acc.trading_username && acc.trading_username !== 'EXPIRED') {
                    await fetch('https://stockmint.io/api/users/delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                        body: JSON.stringify({ email: acc.trading_username })
                    });
                }
                await supabaseAdmin.from('user_accounts').update({ 
                    status: 'deleted', 
                    trading_username: 'EXPIRED', 
                    trading_password: 'EXPIRED' 
                }).eq('id', acc.id);
            }
        }

        revalidatePath('/welcome');
    } catch (e) { console.error("[Compliance Protocol] Execution Failure:", e); }
}

/**
 * Validates a single account's status before dashboard access.
 */
export async function checkAndCleanTrial(accountId: string) {
    const { data: acc } = await supabaseAdmin.from('user_accounts').select('*').eq('id', accountId).single();
    if (!acc || acc.status === 'deleted' || !acc.expires_at) return;

    if (new Date() > new Date(acc.expires_at)) {
        const apiKey = process.env.STOCKMINT_API_KEY;
        if (apiKey && acc.trading_username && acc.trading_username !== 'EXPIRED') {
            await fetch('https://stockmint.io/api/users/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                body: JSON.stringify({ email: acc.trading_username })
            }).catch(console.error);
        }
        await supabaseAdmin.from('user_accounts').update({ 
            status: 'deleted', 
            trading_username: 'EXPIRED', 
            trading_password: 'EXPIRED' 
        }).eq('id', accountId);
    }
}

export async function unblockComplianceAccounts(userId: string) {
    const { data: blocked } = await supabaseAdmin
        .from('user_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_blocked', true);
    
    if (!blocked || blocked.length === 0) return;

    const apiKey = process.env.STOCKMINT_API_KEY;

    for (const acc of blocked) {
        if (apiKey && acc.trading_username) {
            await fetch('https://stockmint.io/api/users/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                body: JSON.stringify({ email: acc.trading_username, status: 'active', reason: 'KYC_COMPLETED' })
            }).catch(e => console.error("Hub Signal Failed:", e));
        }
        await supabaseAdmin.from('user_accounts').update({ is_blocked: false }).eq('id', acc.id);
    }
    revalidatePath('/welcome');
}

export async function updateProfileDetails(userId: string, fullName: string, mobile: string) {
    if (!userId || !fullName || !mobile) return { error: 'Incomplete details provided.' };
    const { error } = await supabaseAdmin.from('profiles').update({ full_name: fullName, mobile_number: mobile }).eq('id', userId);
    if (error) return { error: error.message };
    revalidatePath('/welcome');
    return { success: true };
}

async function fetchFromHub(endpoint: string, method: string, body?: any, accountId?: string) {
    const apiKey = process.env.STOCKMINT_API_KEY;
    if (!apiKey) return { error: 'API Key Missing' };
    try {
        const res = await fetch(`https://stockmint.io/api/${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const errText = await res.text();
            if (accountId) await supabaseAdmin.from('user_accounts').update({ activation_error: `API ${res.status}: ${errText}` }).eq('id', accountId);
            return { error: `HTTP ${res.status}`, status: res.status };
        }
        if (accountId) await supabaseAdmin.from('user_accounts').update({ activation_error: null }).eq('id', accountId);
        return await res.json();
    } catch (e: any) {
        if (accountId) await supabaseAdmin.from('user_accounts').update({ activation_error: e.message }).eq('id', accountId);
        return { error: e.message };
    }
}

export async function purchaseWithWallet(userId: string, plan: any) {
  if (!userId || !plan) return { error: 'Missing details.' };
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
  if (!profile) return { error: 'Profile not found.' };
  const price = typeof plan.price === 'string' ? parseFloat(plan.price.replace(/,/g, '')) : plan.price;
  if (profile.wallet_balance < price) return { error: 'Insufficient wallet balance.' };

  await supabaseAdmin.from('profiles').update({ wallet_balance: profile.wallet_balance - price }).eq('id', userId);
  const txId = `WALLET_${Date.now()}_${userId.substring(0, 4)}`;
  await supabaseAdmin.from('wallet_transactions').insert({ user_id: userId, amount: -price, type: 'purchase', status: 'completed', gateway_transaction_id: txId, description: `Purchase of ${plan.title}` });

  const classification = getAutoClassification(plan.title);
  const marketType = getMarketType(plan.title);
  const isKycVerified = profile.kyc_status === 'verified';
  const isPro = classification === 'instant_pro';

  const { count: existingCount } = await supabaseAdmin.from('user_accounts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('credentials_provided', true);

  const updateData: any = {
    user_id: userId, plan_name: plan.title, status: 'active', is_approved: true,
    account_classification: classification, market_type: marketType,
    final_amount_paid: price, transaction_id: txId,
    account_model: classification === 'passthenpay' ? 'passthrupay' : 'normal'
  };

  // PRO Validity (7 Days)
  if (isPro) {
      updateData.expires_at = addDays(new Date(), 7).toISOString();
  }

  // Grace Period for first funded standard account
  if (existingCount === 0 && !isKycVerified && classification !== 'passthenpay') {
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 48);
      updateData.grace_period_expiry = expiry.toISOString();
  }

  const { data: account, error: accountError } = await supabaseAdmin.from('user_accounts').insert(updateData).select().single();
  if (accountError || !account) return { error: 'Account creation failed.' };

  const initialBalance = getBalanceFromPlanName(plan.title);
  if (initialBalance > 0) {
      const stockmintUsername = generateStockmintUsername(profile.email, existingCount || 0);
      await fetchFromHub('users/create', 'POST', {
          fullName: profile.full_name, email: stockmintUsername, password: stockmintUsername,
          initialBalance, accountClassification: classification, marketType: marketType
      }, account.id);
      await supabaseAdmin.from('user_accounts').update({ credentials_provided: true, trading_username: stockmintUsername, trading_password: stockmintUsername }).eq('id', account.id);
  }

  revalidatePath('/welcome');
  return { success: true, transaction_id: txId, amount: price };
}

export async function validateCoupon(code: string) {
    if (!code) return { error: 'Please enter a code.' };
    const { data: coupon, error } = await supabaseAdmin.from('coupons').select('*').eq('code', code.toUpperCase()).single();
    if (error || !coupon) return { error: 'Invalid or expired coupon code.' };
    return { success: true, discount_value: coupon.discount_value };
}

export async function requestManualAccount(userId: string, planName: string, amountInr: number, utr: string) {
  if (!userId || !planName || !amountInr || !utr) return { error: 'Invalid request details.' };
  const classification = getAutoClassification(planName);
  const marketType = getMarketType(planName);
  
  const insertData: any = {
      user_id: userId, plan_name: planName, status: 'pending', is_approved: false, final_amount_paid: amountInr,
      transaction_id: utr, market_type: marketType, account_classification: classification,
      account_model: classification === 'passthenpay' ? 'passthrupay' : 'normal'
  };

  const { error } = await supabaseAdmin.from('user_accounts').insert(insertData);
  if (error) return { error: error.message };
  revalidatePath('/welcome');
  return { success: true, transaction_id: utr, amount: amountInr };
}

export async function initiateGatewayPayment(userId: string, plan: any, gateway: string) {
    const { data: settings } = await supabaseAdmin.from('payment_details').select('*').eq('id', 1).single();
    if (!settings) return { error: 'Config error.' };
    
    const finalAmount = typeof plan.price === 'string' ? parseFloat(plan.price.replace(/,/g, '')) : plan.price;
    const order_sn = `FS_${Date.now()}_${randomBytes(3).toString('hex')}`;

    if (plan.title === 'WALLET_TOPUP') {
        await supabaseAdmin.from('wallet_transactions').insert({ user_id: userId, amount: finalAmount, type: 'deposit', status: 'pending', gateway_transaction_id: order_sn });
    } else {
        const classification = getAutoClassification(plan.title);
        const marketType = getMarketType(plan.title);
        const insertData: any = {
            user_id: userId, plan_name: plan.title, status: 'pending', is_approved: false, final_amount_paid: finalAmount, 
            transaction_id: order_sn, market_type: marketType, account_classification: classification,
            account_model: classification === 'passthenpay' ? 'passthrupay' : 'normal'
        };
        await supabaseAdmin.from('user_accounts').insert(insertData);
    }

    if (gateway === 'watchpay' || gateway === 'automated') {
        const apiKey = settings.watchpay_api_key;
        const params = { merchantId: settings.watchpay_merchant_id, merchantOrder: order_sn, amount: finalAmount.toFixed(2), currency: 'INR', productName: plan.title, callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/watchpay-webhook`, returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/purchase-success?id=${order_sn}&amount=${finalAmount}&plan=${encodeURIComponent(plan.title)}&method=automated` };
        const sign = generateWatchPaySignature(params, apiKey!);
        try {
            const res = await fetch('https://api.watchpay.net/v1/payment/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...params, sign }) });
            const result = await res.json();
            if (result.status === 'success') return { redirectUrl: result.data.paymentUrl };
        } catch (e) { return { error: 'Gateway failed.' }; }
    }
    return { error: 'Gateway failed.' };
}

export async function topUpWallet(userId: string, amount: number, utr: string) {
  if (!userId || isNaN(amount) || amount < 10000 || !utr) return { error: 'Min ₹10,000.' };
  const { error } = await supabaseAdmin.from('wallet_transactions').insert({ user_id: userId, amount, type: 'deposit', gateway_transaction_id: utr, status: 'pending' });
  if (error) return { error: error.message };
  revalidatePath('/welcome');
  return { success: true };
}

export async function createSupportConversation(userId: string, subject: string, firstMessage?: string) {
    const { data: conversation } = await supabaseAdmin.from('support_conversations').insert({ user_id: userId, subject, unread_count_admin: 1, assigned_role: 'ai', last_message_at: new Date().toISOString() }).select().single();
    if (firstMessage && conversation) await supabaseAdmin.from('support_messages').insert({ conversation_id: conversation.id, sender_id: userId, sender_role: 'user', message: firstMessage });
    revalidatePath('/welcome');
    return { data: conversation };
}

export async function sendSupportMessage(convId: string, senderId: string, role: 'admin' | 'user', message: string, image?: File) {
    let imageUrl: string | undefined;
    
    if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `support-${convId}-${Date.now()}.${fileExt}`;
        const { data: uploadRes, error: uploadError } = await supabaseAdmin.storage.from('ticket-attachments').upload(fileName, image);
        if (!uploadError && uploadRes) {
            const { data: urlData } = supabaseAdmin.storage.from('ticket-attachments').getPublicUrl(uploadRes.path);
            imageUrl = urlData.publicUrl;
        }
    }

    await supabaseAdmin.from('support_messages').insert({ conversation_id: convId, sender_id: senderId, sender_role: role, message: message.trim(), image_url: imageUrl });
    
    const { data: conv } = await supabaseAdmin.from('support_conversations').select('unread_count_admin, unread_count_user').eq('id', convId).single();
    const update: any = { last_message_at: new Date().toISOString(), last_message_preview: message.trim() };
    if (role === 'admin') update.unread_count_user = (conv?.unread_count_user || 0) + 1;
    else update.unread_count_admin = (conv?.unread_count_admin || 0) + 1;
    
    await supabaseAdmin.from('support_conversations').update(update).eq('id', convId);
    
    // Neural Response Trigger
    if (role === 'user') {
        const { data: settings } = await supabaseAdmin.from('payment_details').select('is_ai_support_enabled').eq('id', 1).single();
        if (settings?.is_ai_support_enabled) {
            const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', senderId).single();
            const aiResponse = await runSupportAi({
                conversationId: convId,
                userEmail: profile!.email,
                userName: profile!.full_name || 'Trader',
                userMessage: message.trim()
            });
            if (aiResponse) {
                await supabaseAdmin.from('support_messages').insert({ conversation_id: convId, sender_id: 'AGENT_SYSTEM', sender_role: 'admin', message: aiResponse });
                await supabaseAdmin.from('support_conversations').update({ last_message_at: new Date().toISOString(), last_message_preview: aiResponse, unread_count_user: 1 }).eq('id', convId);
            }
        }
    }

    revalidatePath('/welcome');
    return { error: null };
}

export async function markSupportRead(convId: string, role: 'admin' | 'user') {
    const field = role === 'admin' ? 'unread_count_admin' : 'unread_count_user';
    await supabaseAdmin.from('support_conversations').update({ [field]: 0 }).eq('id', convId);
    revalidatePath('/welcome');
}

export async function purchaseTournamentEntry(userId: string, eventId: string) {
    const { data: event } = await supabaseAdmin.from('competition_events').select('*').eq('id', eventId).single();
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
    if (!event || !profile) return { error: 'Data error' };
    const txId = `COMP_${Date.now()}_${userId.substring(0, 4)}`;
    if (!event.is_free) {
        if (profile.wallet_balance < event.entry_fee) return { error: 'Insufficient funds.' };
        await supabaseAdmin.from('profiles').update({ wallet_balance: profile.wallet_balance - event.entry_fee }).eq('id', userId);
        await supabaseAdmin.from('wallet_transactions').insert({ user_id: userId, amount: -event.entry_fee, type: 'purchase', status: 'completed', gateway_transaction_id: txId, description: `Entry for ${event.week_label}` });
    }
    const { count } = await supabaseAdmin.from('competition_registrations').select('id', { count: 'exact', head: true }).eq('user_id', userId);
    const stockmintUsername = generateStockmintUsername(profile.email, (count || 0) + 100);
    await fetchFromHub('users/create', 'POST', { fullName: profile.full_name, email: stockmintUsername, password: stockmintUsername, initialBalance: 100000, accountClassification: 'evaluation', marketType: 'indian' });
    const { error } = await supabaseAdmin.from('competition_registrations').insert({ user_id: userId, event_id: eventId, transaction_id: event.is_free ? 'FREE_JOIN' : txId, is_approved: true, stockmint_username: stockmintUsername, stockmint_password: stockmintUsername });
    if (error) return { error: error.message };
    revalidatePath('/welcome');
    return { success: true };
}

export async function startFreeTrial(userId: string) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
    const { count } = await supabaseAdmin.from('user_accounts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_trial', true);
    if (count && count > 0) return { error: 'You have already used your free trial.' };
    const expiry = calculateTrialExpiry(new Date());
    const { count: totalAccs } = await supabaseAdmin.from('user_accounts').select('id', { count: 'exact', head: true }).eq('user_id', userId);
    const username = generateStockmintUsername(profile!.email, (totalAccs || 0) + 500);
    await fetchFromHub('users/create', 'POST', { fullName: profile!.full_name, email: username, password: username, initialBalance: 500000, accountClassification: 'evaluation', marketType: 'indian' });
    const { data: account, error } = await supabaseAdmin.from('user_accounts').insert({ user_id: userId, plan_name: '5L Broker Trial (48h)', status: 'active', is_approved: true, is_trial: true, expires_at: expiry.toISOString(), credentials_provided: true, trading_username: username, trading_password: username, account_classification: 'evaluation', market_type: 'indian' }).select().single();
    if (error) return { error: error.message };
    revalidatePath('/welcome');
    return { success: true };
}

export async function cleanupAllTrials(userId: string) {
    const { data: sessions } = await supabaseAdmin.from('user_accounts').select('*').eq('user_id', userId).neq('status', 'deleted').not('expires_at', 'is', null);
    if (!sessions) return;
    const now = new Date();
    for (const session of sessions) {
        if (now > new Date(session.expires_at)) {
            if (session.trading_username && session.trading_username !== 'EXPIRED') await fetchFromHub('users/delete', 'POST', { email: session.trading_username });
            await supabaseAdmin.from('user_accounts').update({ status: 'deleted', trading_username: 'EXPIRED', trading_password: 'EXPIRED' }).eq('id', session.id);
        }
    }
}

export async function processCryptoWalletTopUp(userId: string, amountInr: number, txHash: string) {
    try {
        const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
        if (!profile) return { error: 'Profile not found.' };

        // 1. Transaction Sanity Check
        const { data: existing } = await supabaseAdmin.from('wallet_transactions').select('id').eq('gateway_transaction_id', txHash.trim()).single();
        if (existing) return { error: 'This transaction has already been processed.' };

        // 2. Persistent Ledger Entry (In-Memory pending)
        const bonus = amountInr >= 10000 ? (amountInr * 0.05) : 0;
        const totalToAdd = amountInr + bonus;

        const { data: tx, error: txError } = await supabaseAdmin.from('wallet_transactions').insert({
            user_id: userId,
            amount: amountInr,
            bonus_amount: bonus,
            type: 'deposit',
            status: 'completed', // We mark as completed upon internal verification success
            gateway_transaction_id: txHash.trim(),
            description: 'Crypto Recharge (USDT)',
            processed_at: new Date().toISOString()
        }).select().single();

        if (txError) throw new Error('Ledger write failure');

        // 3. Update Liquidity Balance
        const newBalance = (profile.wallet_balance || 0) + totalToAdd;
        await supabaseAdmin.from('profiles').update({ wallet_balance: newBalance }).eq('id', userId);

        revalidatePath('/welcome');
        return { success: true, newBalance };

    } catch (e: any) {
        console.error("[Crypto Protocol] Error:", e);
        return { error: 'Internal verification protocol failure.' };
    }
}

export async function deleteSupportConversation(id: string) {
    const { error } = await supabaseAdmin.from('support_conversations').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/support-agent/chat');
    return { success: true };
}
