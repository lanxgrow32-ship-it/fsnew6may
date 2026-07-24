'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { runSupportAi } from '@/ai/flows/support-agent-flow';
import { getAutoClassification, getBalanceFromPlanName, generateStockmintUsername, calculateTrialExpiry } from '@/lib/plan-utils';
import { generateLgPaySignature } from '@/lib/lg-pay';
import { generateWatchPaySignature } from '@/lib/watchpay';
import { randomBytes } from 'crypto';
import { headers } from 'next/headers';

/**
 * Updates basic profile details, required for Google signups.
 */
export async function updateProfileDetails(userId: string, fullName: string, mobile: string) {
    if (!userId || !fullName || !mobile) return { error: 'Incomplete details provided.' };

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
            full_name: fullName, 
            mobile_number: mobile 
        })
        .eq('id', userId);
    
    if (error) return { error: error.message };
    
    revalidatePath('/welcome');
    return { success: true };
}

/**
 * Hardened utility for fetching from Stockmint Hub.
 * Prevents "unexpected response" errors by using timeout and try/catch.
 * Logs errors to the database if accountId is provided.
 */
async function fetchFromHub(endpoint: string, method: string, body?: any, accountId?: string) {
    const apiKey = process.env.STOCKMINT_API_KEY;
    if (!apiKey) return { error: 'API Key Missing' };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); 

        const res = await fetch(`https://stockmint.io/api/${endpoint}`, {
            method,
            headers: { 
                'Content-Type': 'application/json', 
                'X-API-Key': apiKey 
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!res.ok) {
            const errText = await res.text();
            console.error(`[Stockmint Hub] Error ${res.status}:`, errText);
            
            if (accountId) {
                await supabaseAdmin.from('user_accounts').update({ 
                    activation_error: `API ${res.status}: ${errText}` 
                }).eq('id', accountId);
            }

            return { error: `HTTP ${res.status}`, status: res.status };
        }

        const data = await res.json();
        
        // Clear errors on success
        if (accountId) {
            await supabaseAdmin.from('user_accounts').update({ activation_error: null }).eq('id', accountId);
        }

        return data;
    } catch (e: any) {
        const msg = e.name === 'AbortError' ? 'Connection Timeout' : `Network: ${e.message}`;
        console.error(`[Stockmint Hub] Connection Failed:`, msg);
        
        if (accountId) {
            await supabaseAdmin.from('user_accounts').update({ activation_error: msg }).eq('id', accountId);
        }

        return { error: msg };
    }
}

export async function getCompetitionEvents() {
    try {
        const { data } = await supabaseAdmin
            .from('competition_events')
            .select('*')
            .eq('is_active', true)
            .order('start_date', { ascending: true });
        return data || [];
    } catch (e) {
        return [];
    }
}

export async function purchaseWithWallet(userId: string, plan: any) {
  if (!userId || !plan) return { error: 'Missing details.' };
  
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) return { error: 'Profile not found.' };
  
  const price = typeof plan.price === 'string' ? parseFloat(plan.price.replace(/,/g, '')) : plan.price;
  
  if (profile.wallet_balance < price) {
    return { error: 'Insufficient wallet balance.' };
  }

  await supabaseAdmin.from('profiles').update({ 
      wallet_balance: profile.wallet_balance - price 
  }).eq('id', userId);

  const txId = `WALLET_${Date.now()}_${userId.substring(0, 4)}`;
  await supabaseAdmin.from('wallet_transactions').insert({ 
      user_id: userId, 
      amount: -price, 
      type: 'purchase', 
      status: 'completed', 
      gateway_transaction_id: txId,
      description: `Purchase of ${plan.title}` 
  });

  const isPTP = plan.title.toLowerCase().includes('ptp') || plan.title.toLowerCase().includes('passthenpay');
  const classification = getAutoClassification(plan.title);
  const isKycVerified = profile.kyc_status === 'verified';

  if (profile.referred_by && !profile.referral_commission_paid && price > 0) {
      const { data: settings } = await supabaseAdmin.from('payment_details').select('referral_commission_percentage').eq('id', 1).single();
      const commPercent = settings?.referral_commission_percentage || 10;
      const commissionAmount = Math.floor((price * commPercent) / 100);

      if (commissionAmount > 0) {
          const { data: referrer } = await supabaseAdmin.from('profiles').select('referral_balance').eq('id', profile.referred_by).single();
          const newBalance = (referrer?.referral_balance || 0) + commissionAmount;
          
          await supabaseAdmin.from('profiles').update({ referral_balance: newBalance }).eq('id', profile.referred_by);
          await supabaseAdmin.from('profiles').update({ referral_commission_paid: true }).eq('id', userId);

          await supabaseAdmin.from('referrals').insert({
              referrer_id: profile.referred_by,
              referred_id: userId,
              commission_amount: commissionAmount,
              plan_name: plan.title
          });
      }
  }

  const { data: account, error: accountError } = await supabaseAdmin.from('user_accounts').insert({
    user_id: userId, 
    plan_name: plan.title, 
    status: isPTP || isKycVerified ? 'active' : 'pending', 
    is_approved: true,
    account_model: isPTP ? 'passthrupay' : 'normal', 
    account_classification: classification,
    final_amount_paid: price, 
    transaction_id: txId
  }).select().single();

  if (accountError || !account) return { error: 'Account creation failed.' };

  const initialBalance = getBalanceFromPlanName(plan.title);
  if (initialBalance > 0) {
      const { count } = await supabaseAdmin
        .from('user_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('credentials_provided', true);

      const stockmintUsername = generateStockmintUsername(profile.email, count || 0);
      await fetchFromHub('users/create', 'POST', {
          fullName: profile.full_name, 
          email: stockmintUsername, 
          password: stockmintUsername,
          initialBalance, 
          accountClassification: classification, 
          accountModel: isPTP ? 'passthenpay' : 'normal'
      }, account.id);
  }

  revalidatePath('/welcome');
  return { success: true, transaction_id: txId, amount: price };
}

export async function validateCoupon(code: string) {
    if (!code) return { error: 'Please enter a code.' };
    try {
        const { data: coupon, error } = await supabaseAdmin.from('coupons').select('*').eq('code', code.toUpperCase()).single();
        if (error || !coupon) return { error: 'Invalid or expired coupon code.' };
        return { success: true, discount_value: coupon.discount_value };
    } catch (e) {
        return { error: 'Validation service error' };
    }
}

export async function requestManualAccount(userId: string, planName: string, amount: number, utr: string) {
  if (!userId || !planName || !amount || !utr) return { error: 'Invalid request details.' };
  const classification = getAutoClassification(planName);
  
  const { error } = await supabaseAdmin.from('user_accounts').insert({
      user_id: userId, 
      plan_name: planName, 
      status: 'pending', 
      is_approved: false, 
      final_amount_paid: amount,
      transaction_id: utr, 
      account_model: planName.toLowerCase().includes('ptp') || planName.toLowerCase().includes('passthenpay') ? 'passthrupay' : 'normal',
      account_classification: classification
  });

  if (error) return { error: error.message };
  
  revalidatePath('/welcome');
  return { success: true, transaction_id: utr, amount: amount };
}

/**
 * Initiates an automated payment session with LG-Pay or WatchPay.
 * Redirects user to the secure gateway.
 */
export async function initiateGatewayPayment(userId: string, plan: any, gateway: string) {
    const supabase = await createClient();
    const { data: settings } = await supabaseAdmin.from('payment_details').select('*').eq('id', 1).single();
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();

    if (!settings || !profile) return { error: 'Payment configuration error. Contact admin.' };

    let activeGateway = gateway;
    if (gateway === 'automated') {
        const mode = settings.automated_gateway_mode || 'both';
        if (mode === 'lgpay') activeGateway = 'lgpay';
        else if (mode === 'watchpay') activeGateway = 'watchpay';
        else activeGateway = Math.random() > 0.5 ? 'lgpay' : 'watchpay';
    }

    const amount = typeof plan.price === 'string' ? parseFloat(plan.price.replace(/,/g, '')) : plan.price;
    const order_sn = `FS_${Date.now()}_${randomBytes(3).toString('hex')}`;

    // Handshake: Store order state on profile for webhook verification
    await supabaseAdmin.from('profiles').update({
        order_sn: order_sn,
        plan_purchased: plan.title,
        final_amount_paid: amount
    }).eq('id', userId);

    if (activeGateway === 'lgpay') {
        const lgPayAppId = 'YD4957';
        const lgPayKey = '3zJXYxvfIY2S1gOHl3Ctunq6xx9apBX1';
        const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/lg-pay-webhook`;
        
        const moneyInCents = Math.round(amount * 100);
        const ipHeader = (await headers()).get('x-forwarded-for') ?? '127.0.0.1';
        const ip = ipHeader.split(',')[0].trim();

        const params: Record<string, string> = {
            app_id: lgPayAppId,
            trade_type: "INRUPI",
            order_sn: order_sn,
            money: String(moneyInCents),
            notify_url: notifyUrl,
            ip: ip,
            remark: `Activation: ${plan.title}`,
        };

        const sign = generateLgPaySignature(params, lgPayKey);

        try {
            const res = await fetch('https://www.lg-pay.com/api/order/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ ...params, sign }),
            });
            const result = await res.json();
            if (result.status === 1 && result.data?.pay_url) {
                return { redirectUrl: result.data.pay_url };
            }
            return { error: `Gateway rejected: ${result.msg || 'Unknown reason'}` };
        } catch (e) { return { error: 'Connection to LG-Pay failed. Try manual method.' }; }
    } 
    
    if (activeGateway === 'watchpay') {
        const merchantId = settings.watchpay_merchant_id;
        const apiKey = settings.watchpay_api_key;
        if (!merchantId || !apiKey) return { error: 'WatchPay credentials not configured.' };

        const params = {
            merchantId: merchantId,
            merchantOrder: order_sn,
            amount: amount.toFixed(2),
            currency: 'INR',
            productName: plan.title,
            callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/watchpay-webhook`,
            returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/purchase-success?id=${order_sn}&amount=${amount}&plan=${encodeURIComponent(plan.title)}&method=automated`,
        };

        const sign = generateWatchPaySignature(params, apiKey);

        try {
            const res = await fetch('https://api.watchpay.net/v1/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...params, sign }),
            });
            const result = await res.json();
            if (result.status === 'success' && result.data?.paymentUrl) {
                return { redirectUrl: result.data.paymentUrl };
            }
            return { error: `WatchPay error: ${result.message}` };
        } catch (e) { return { error: 'WatchPay connection failed.' }; }
    }

    return { error: 'Invalid gateway selection.' };
}

export async function topUpWallet(userId: string, amount: number, utr: string) {
  if (!userId || isNaN(amount) || amount < 10000 || !utr) {
    return { error: 'Minimum wallet deposit is ₹10,000.' };
  }
  const { error } = await supabaseAdmin.from('wallet_transactions').insert({
      user_id: userId, 
      amount: amount, 
      type: 'deposit', 
      gateway_transaction_id: utr,
      status: 'pending', 
      description: 'Wallet Top-up Request'
  });
  if (error) return { error: error.message };
  revalidatePath('/welcome');
  return { success: true };
}

export async function createSupportConversation(userId: string, subject: string, firstMessage?: string) {
    const { data: conversation, error } = await supabaseAdmin.from('support_conversations').insert({ 
        user_id: userId, 
        subject, 
        unread_count_admin: 1, 
        assigned_role: 'ai',
        last_message_at: new Date().toISOString(),
        last_message_preview: firstMessage || 'New session'
    }).select().single();
    
    if (error) return { error: error.message };
    if (firstMessage) {
        await supabaseAdmin.from('support_messages').insert({ 
            conversation_id: conversation.id, 
            sender_id: userId, 
            sender_role: 'user', 
            message: firstMessage 
        });
        await triggerAiResponse(conversation.id, userId, firstMessage);
    }
    revalidatePath('/welcome');
    revalidatePath('/live-chat');
    return { data: conversation };
}

export async function deleteSupportConversation(convId: string) {
    const { error } = await supabaseAdmin.from('support_conversations').delete().eq('id', convId);
    if (error) return { error: error.message };
    revalidatePath('/welcome');
    revalidatePath('/live-chat');
    return { success: true };
}

export async function sendSupportMessage(convId: string, senderId: string, role: 'admin' | 'user', message: string, imageFile?: File) {
    if (!convId || !senderId || (!message.trim() && !imageFile)) return { error: 'Invalid message.' };
    
    const { error: insertError } = await supabaseAdmin.from('support_messages').insert({ 
      conversation_id: convId, 
      sender_id: senderId, 
      sender_role: role, 
      message: message.trim()
    });
    
    if (insertError) return { error: insertError.message };
    
    const { data: conv } = await supabaseAdmin.from('support_conversations').select('unread_count_admin, unread_count_user, user_id').eq('id', convId).single();
    const metaUpdate: any = { last_message_at: new Date().toISOString(), last_message_preview: message.trim() };
    
    if (role === 'admin') metaUpdate.unread_count_user = (conv?.unread_count_user || 0) + 1;
    else metaUpdate.unread_count_admin = (conv?.unread_count_admin || 0) + 1;
    
    await supabaseAdmin.from('support_conversations').update(metaUpdate).eq('id', convId);
    
    if (role === 'user') {
        await triggerAiResponse(convId, senderId, message.trim());
    }
    
    revalidatePath('/welcome');
    revalidatePath('/live-chat');
    return { error: null };
}

async function triggerAiResponse(convId: string, userId: string, message: string) {
    try {
        const { data: settings } = await supabaseAdmin.from('payment_details').select('is_ai_support_enabled').eq('id', 1).single();
        const { data: conv } = await supabaseAdmin.from('support_conversations').select('*, profiles(*)').eq('id', convId).single();
        
        if (!settings?.is_ai_support_enabled || conv?.assigned_role !== 'ai') return;
        
        const { data: history } = await supabaseAdmin
            .from('support_messages')
            .select('sender_role, message')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: false })
            .limit(10);
            
        const chatHistory = (history || []).reverse().map(h => ({ 
            role: h.sender_role as 'user' | 'admin', 
            message: h.message 
        }));
        
        const aiResponse = await runSupportAi({ 
            conversationId: convId, 
            userEmail: conv.profiles.email, 
            userName: conv.profiles.full_name, 
            userMessage: message, 
            chatHistory: chatHistory 
        });
        
        if (!aiResponse) return;
        
        await supabaseAdmin.from('support_messages').insert({ 
            conversation_id: conv.id, 
            sender_id: conv.user_id, 
            sender_role: 'admin', 
            message: aiResponse 
        });
        
        const { data: freshConv } = await supabaseAdmin.from('support_conversations').select('unread_count_user').eq('id', convId).single();
        
        await supabaseAdmin.from('support_conversations').update({ 
            last_message_at: new Date().toISOString(), 
            last_message_preview: aiResponse, 
            unread_count_user: (freshConv?.unread_count_user || 0) + 1 
        }).eq('id', convId);
    } catch (error) { console.error(`[AI Support] Assistant Error:`, error); }
}

export async function markSupportRead(convId: string, role: 'admin' | 'user') {
    const field = role === 'admin' ? 'unread_count_admin' : 'unread_count_user';
    await supabaseAdmin.from('support_conversations').update({ [field]: 0 }).eq('id', convId);
    revalidatePath('/welcome');
    revalidatePath('/live-chat');
    return { success: true };
}

export async function purchaseTournamentEntry(userId: string, eventId: string) {
    const { data: event } = await supabaseAdmin.from('competition_events').select('*').eq('id', eventId).single();
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
    
    if (!event || !profile) return { error: 'Data error' };
    
    const txId = `COMP_${Date.now()}_${userId.substring(0, 4)}`;

    if (!event.is_free) {
        if (profile.wallet_balance < event.entry_fee) return { error: 'Insufficient funds.' };
        await supabaseAdmin.from('profiles').update({ wallet_balance: profile.wallet_balance - event.entry_fee }).eq('id', userId);
        await supabaseAdmin.from('wallet_transactions').insert({ 
            user_id: userId, 
            amount: -event.entry_fee, 
            type: 'purchase', 
            status: 'completed', 
            gateway_transaction_id: txId,
            description: `Entry for ${event.week_label}` 
        });
    }

    const { count } = await supabaseAdmin
        .from('competition_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

    const stockmintUsername = generateStockmintUsername(profile.email, (count || 0) + 100);
    await fetchFromHub('users/create', 'POST', {
        fullName: profile.full_name, 
        email: stockmintUsername, 
        password: stockmintUsername, 
        initialBalance: 100000, 
        accountClassification: 'evaluation', 
        accountModel: 'normal' 
    });

    const { error } = await supabaseAdmin.from('competition_registrations').insert({ 
        user_id: userId, 
        event_id: eventId, 
        transaction_id: event.is_free ? 'FREE_JOIN' : txId, 
        is_approved: true, 
        stockmint_username: stockmintUsername, 
        stockmint_password: stockmintUsername 
    });

    if (error) return { error: error.message };
    
    revalidatePath('/welcome');
    return { success: true, transaction_id: event.is_free ? 'FREE' : txId, amount: event.is_free ? 0 : event.entry_fee };
}

export async function startFreeTrial(userId: string) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
    if (!profile) return { error: 'Trader not found.' };

    const { count } = await supabaseAdmin
        .from('user_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_trial', true);
    
    if (count && count > 0) return { error: 'You have already used your free trial.' };

    const now = new Date();
    const expiry = calculateTrialExpiry(now);

    const { count: totalAccs } = await supabaseAdmin.from('user_accounts').select('id', { count: 'exact', head: true }).eq('user_id', userId);
    const stockmintUsername = generateStockmintUsername(profile.email, (totalAccs || 0) + 500);

    const hubRes = await fetchFromHub('users/create', 'POST', {
        fullName: profile.full_name, 
        email: stockmintUsername, 
        password: stockmintUsername,
        initialBalance: 500000, 
        accountClassification: 'evaluation', 
        accountModel: 'normal'
    });

    const { data: account, error } = await supabaseAdmin.from('user_accounts').insert({
        user_id: userId,
        plan_name: '5L Broker Trial (48h)',
        status: 'active',
        is_approved: true,
        is_trial: true,
        expires_at: expiry.toISOString(),
        credentials_provided: true,
        trading_username: stockmintUsername,
        trading_password: stockmintUsername,
        account_classification: 'evaluation'
    }).select().single();

    if (error) return { error: error.message };

    revalidatePath('/welcome');
    return { success: true, accountId: account.id };
}

export async function checkAndCleanTrial(accountId: string) {
    try {
        const { data: acc } = await supabaseAdmin.from('user_accounts').select('*').eq('id', accountId).single();
        if (!acc || !acc.is_trial || acc.status === 'deleted') return { expired: false };

        const now = new Date();
        const expiry = new Date(acc.expires_at);

        if (now > expiry) {
            if (acc.trading_username && acc.trading_username !== 'EXPIRED') {
                await fetchFromHub('users/delete', 'POST', { email: acc.trading_username });
            }

            await supabaseAdmin.from('user_accounts').update({ 
                status: 'deleted',
                trading_username: 'EXPIRED',
                trading_password: 'EXPIRED'
            }).eq('id', accountId);

            return { expired: true };
        }
    } catch (e) {
        console.error("Cleanup individual trial failure:", e);
    }
    return { expired: false };
}

export async function cleanupAllTrials(userId: string) {
    try {
        const { data: trials } = await supabaseAdmin
            .from('user_accounts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_trial', true)
            .neq('status', 'deleted');
        
        if (!trials || trials.length === 0) return;

        const now = new Date();

        for (const trial of trials) {
            const expiry = new Date(trial.expires_at);
            if (now > expiry) {
                if (trial.trading_username && trial.trading_username !== 'EXPIRED') {
                    await fetchFromHub('users/delete', 'POST', { email: trial.trading_username });
                }

                await supabaseAdmin.from('user_accounts').update({ 
                    status: 'deleted',
                    trading_username: 'EXPIRED',
                    trading_password: 'EXPIRED'
                }).eq('id', trial.id);
            }
        }
    } catch (e) {
        console.error("Cleanup all trials failure:", e);
    }
}
