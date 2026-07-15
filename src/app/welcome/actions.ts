
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { runSupportAi } from '@/ai/flows/support-agent-flow';
import { getAutoClassification, getBalanceFromPlanName, generateStockmintUsername } from '@/lib/plan-utils';

/**
 * Fetches active tournament events for the user browser.
 */
export async function getCompetitionEvents() {
    const { data } = await supabaseAdmin
        .from('competition_events')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: true });
    return data || [];
}

/**
 * Express Wallet Purchase Protocol (v4.0 Hardened)
 */
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

  // 1. Deduct Liquidity
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

  // 2. Provision Account Record
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

  if (accountError || !account) return { error: 'Account creation failed in DB.' };

  // 3. Stockmint Hub Sync (v4.0 Protocol)
  const stockmintApiKey = process.env.STOCKMINT_API_KEY;
  const initialBalance = getBalanceFromPlanName(plan.title);
  let stockmintUsername = profile.email;

  if (stockmintApiKey && initialBalance > 0) {
      try {
          const { count } = await supabaseAdmin
            .from('user_accounts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('credentials_provided', true);

          stockmintUsername = generateStockmintUsername(profile.email, count || 0);

          const payload = { 
              fullName: profile.full_name, 
              email: stockmintUsername, 
              password: stockmintUsername,
              initialBalance, 
              accountClassification: classification, 
              accountModel: isPTP ? 'passthenpay' : 'normal'
          };

          const res = await fetch('https://stockmint.io/api/users/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
              body: JSON.stringify(payload),
          });

          if (res.ok) {
              await supabaseAdmin.from('user_accounts').update({ 
                  credentials_provided: true, 
                  trading_username: stockmintUsername, 
                  trading_password: stockmintUsername, 
                  status: 'active' 
              }).eq('id', account.id);
          }
      } catch (e) { 
          console.error('[Wallet Purchase] StockMint Network/Sync Error:', e); 
      }
  }

  // 4. Automation Trigger
  const purchaseWebhook = process.env.MAKE_PURCHASE_WEBHOOK_URL;
  if (purchaseWebhook) {
      fetch(purchaseWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              email: profile.email,
              full_name: profile.full_name,
              plan_name: plan.title,
              username: stockmintUsername,
              password: stockmintUsername,
              needsKyc: !isKycVerified && !isPTP
          })
      }).catch(e => console.error(e));
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
  revalidatePath('/admin/account-requests');
  return { success: true, transaction_id: utr, amount: amount };
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
  revalidatePath('/admin/wallet-requests');
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
    } catch (error) { console.error(`[Neural Protocol] Dispatcher CRITICAL FAILURE:`, error); }
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
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;

    if (stockmintApiKey) {
        try {
            await fetch('https://stockmint.io/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                body: JSON.stringify({ 
                    fullName: profile.full_name, 
                    email: stockmintUsername, 
                    password: stockmintUsername, 
                    initialBalance: 100000, 
                    accountClassification: 'evaluation', 
                    accountModel: 'normal' 
                }),
            });
        } catch (e) { console.error('Comp Sync Error:', e); }
    }

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
