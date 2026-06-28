
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Helper to determine starting classification and balance
 */
function getAutoClassification(planName: string): string {
    const name = planName.toLowerCase();
    if (name.includes('ptp') || name.includes('passthenpay') || name.includes('pass then pay')) {
        return 'passthenpay';
    }
    if (name.includes('instant')) return 'instant_live';
    if (name.includes('1-step')) return 'one_step_phase_1';
    if (name.includes('2-step')) return 'two_step_phase_1';
    return 'evaluation';
}

function getBalanceFromPlanName(planName: string): number {
    if (!planName) return 0;
    const name = planName.toLowerCase();
    const match = name.match(/([\d,.]+)\s*(k|l|lakh|cr|crore)/);
    if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2];
        if (unit === 'k') amount *= 1000;
        else if (unit === 'l' || unit === 'lakh') amount *= 100000;
        else if (unit === 'cr' || unit === 'crore') amount *= 10000000;
        return amount;
    }
    const plainNumberMatch = name.match(/^[\d,.]+/);
    if (plainNumberMatch) return parseFloat(plainNumberMatch[0].replace(/,/g, ''));
    return 0;
}

export async function validateCoupon(code: string) {
    if (!code) return { error: 'Please enter a code.' };
    const { data: coupon, error } = await supabaseAdmin.from('coupons').select('*').eq('code', code.toUpperCase()).single();
    if (error || !coupon) return { error: 'Invalid or expired coupon code.' };
    return { success: true, discount_value: coupon.discount_value };
}

async function uploadSupportImage(file: File, conversationId: string) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileExt = file.name.split('.').pop();
    const fileName = `support-${conversationId}-${Date.now()}.${fileExt}`;
    const { data, error } = await supabaseAdmin.storage.from('support-attachments').upload(fileName, buffer, { contentType: file.type, upsert: true });
    if (error) throw new Error('Storage rejection.');
    const { data: urlData } = supabaseAdmin.storage.from('support-attachments').getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e: any) { throw new Error('Failed to upload image.'); }
}

export async function requestManualAccount(userId: string, planName: string, amount: number, utr: string) {
  if (!userId || !planName || !amount || !utr) return { error: 'Invalid request details.' };
  const classification = getAutoClassification(planName);
  const { error } = await supabaseAdmin.from('user_accounts').insert({
      user_id: userId, plan_name: planName, status: 'pending', is_approved: false, final_amount_paid: amount,
      transaction_id: utr, account_model: planName.toLowerCase().includes('ptp') ? 'passthrupay' : 'normal',
      account_classification: classification
  });
  if (error) return { error: error.message };
  revalidatePath('/welcome');
  revalidatePath('/admin/account-requests');
  return { success: true };
}

export async function topUpWallet(userId: string, amount: number, utr: string) {
  if (!userId || isNaN(amount) || amount < 10000 || !utr) {
    return { error: 'Minimum wallet deposit is ₹10,000.' };
  }
  const { error } = await supabaseAdmin.from('wallet_transactions').insert({
      user_id: userId, amount: amount, type: 'deposit', gateway_transaction_id: utr,
      status: 'pending', description: 'Wallet Top-up Request'
  });
  if (error) return { error: error.message };
  revalidatePath('/welcome');
  revalidatePath('/admin/wallet-requests');
  return { success: true };
}

export async function purchaseWithWallet(userId: string, plan: any) {
  if (!userId || !plan) return { error: 'Missing details.' };
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
  if (!profile) return { error: 'Profile not found.' };
  
  const price = parseFloat(plan.price.replace(/,/g, ''));
  if (profile.wallet_balance < price) return { error: 'Insufficient wallet balance.' };

  await supabaseAdmin.from('profiles').update({ wallet_balance: profile.wallet_balance - price }).eq('id', userId);
  await supabaseAdmin.from('wallet_transactions').insert({ user_id: userId, amount: -price, type: 'purchase', status: 'completed', description: `Purchase of ${plan.title}` });

  const isPTP = plan.title.toLowerCase().includes('ptp');
  const classification = getAutoClassification(plan.title);
  const isKycVerified = profile.kyc_status === 'verified';

  const { data: account, error: accountError } = await supabaseAdmin.from('user_accounts').insert({
    user_id: userId, plan_name: plan.title, status: isPTP || isKycVerified ? 'active' : 'pending', is_approved: true,
    account_model: isPTP ? 'passthrupay' : 'normal', account_classification: classification,
    final_amount_paid: price, transaction_id: 'WALLET_PURCHASE'
  }).select().single();

  if (accountError || !account) return { error: 'Failed to create account.' };

  const stockmintApiKey = process.env.STOCKMINT_API_KEY;
  const initialBalance = getBalanceFromPlanName(plan.title);
  let stockmintUsername = profile.email;

  if (stockmintApiKey && initialBalance > 0) {
      try {
          const { count } = await supabaseAdmin.from('user_accounts').select('id', { count: 'exact' }).eq('user_id', userId).eq('credentials_provided', true);
          const versionSuffix = count && count > 0 ? `-ac${count + 1}` : '';
          const [baseEmail, domain] = profile.email.split('@');
          stockmintUsername = `${baseEmail}${versionSuffix}@${domain}`;

          const res = await fetch('https://stockmint.io/api/users/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
              body: JSON.stringify({ 
                  fullName: profile.full_name, email: stockmintUsername, password: stockmintUsername,
                  initialBalance, accountClassification: classification, accountModel: isPTP ? 'passthenpay' : 'normal'
              }),
          });

          if (res.ok) {
              await supabaseAdmin.from('user_accounts').update({ credentials_provided: true, trading_username: stockmintUsername, trading_password: stockmintUsername, status: 'active' }).eq('id', account.id);
          }
      } catch (e) { console.error('StockMint API Error:', e); }
  }

  // TRIGGER V3: Intelligent Purchase Handler
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
  return { success: true };
}

export async function createSupportConversation(userId: string, subject: string, firstMessage?: string) {
    const { data: conversation, error } = await supabaseAdmin.from('support_conversations').insert({ user_id: userId, subject, unread_count_admin: 1 }).select().single();
    if (error) return { error: error.message };
    if (firstMessage) await supabaseAdmin.from('support_messages').insert({ conversation_id: conversation.id, sender_id: userId, sender_role: 'user', message: firstMessage });
    revalidatePath('/welcome');
    revalidatePath('/support-agent/chat');
    return { data: conversation };
}

export async function sendSupportMessage(convId: string, senderId: string, role: 'admin' | 'user', message: string, imageFile?: File) {
    if (!convId || !senderId || (!message.trim() && !imageFile)) return { error: 'Invalid message.' };
    let imageUrl: string | undefined;
    if (imageFile) {
        try { imageUrl = await uploadSupportImage(imageFile, convId); } catch (e: any) { return { error: e.message }; }
    }
    const { error } = await supabaseAdmin.from('support_messages').insert({ conversation_id: convId, sender_id: senderId, sender_role: role, message: message.trim(), image_url: imageUrl });
    if (!error) {
        const { data: conv } = await supabaseAdmin.from('support_conversations').select('*').eq('id', convId).single();
        const updateData: any = { last_message_at: new Date().toISOString(), last_message_preview: message.trim() || (imageUrl ? '📷 Photo' : '') };
        if (role === 'admin') updateData.unread_count_user = (conv?.unread_count_user || 0) + 1;
        else updateData.unread_count_admin = (conv?.unread_count_admin || 0) + 1;
        await supabaseAdmin.from('support_conversations').update(updateData).eq('id', convId);
    }
    revalidatePath('/welcome');
    return { error: error?.message };
}

export async function markSupportRead(convId: string, role: 'admin' | 'user') {
    const field = role === 'admin' ? 'unread_count_admin' : 'unread_count_user';
    await supabaseAdmin.from('support_conversations').update({ [field]: 0 }).eq('id', convId);
    revalidatePath('/welcome');
    return { success: true };
}

export async function purchaseTournamentEntry(userId: string, eventId: string) {
    const { data: event } = await supabaseAdmin.from('competition_events').select('*').eq('id', eventId).single();
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
    if (!event || !profile) return { error: 'Data not found' };

    if (!event.is_free) {
        if (profile.wallet_balance < event.entry_fee) return { error: 'Insufficient cash.' };
        await supabaseAdmin.from('profiles').update({ wallet_balance: profile.wallet_balance - event.entry_fee }).eq('id', userId);
        await supabaseAdmin.from('wallet_transactions').insert({ user_id: userId, amount: -event.entry_fee, type: 'purchase', status: 'completed', description: `Entry for ${event.week_label}` });
    }

    const stockmintUsername = `${profile.email.split('@')[0]}-comp-${eventId.substring(0,4)}@${profile.email.split('@')[1]}`;
    const stockmintPassword = stockmintUsername;
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;

    if (stockmintApiKey) {
        try {
            await fetch('https://stockmint.io/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                body: JSON.stringify({ fullName: profile.full_name, email: stockmintUsername, password: stockmintPassword, initialBalance: 100000, accountClassification: 'evaluation', accountModel: 'normal' }),
            });
        } catch (e) { console.error('Competition API failed:', e); }
    }

    const { error } = await supabaseAdmin.from('competition_registrations').insert({ user_id: userId, event_id: eventId, transaction_id: event.is_free ? 'FREE_JOIN' : 'WALLET_JOIN', is_approved: true, stockmint_username: stockmintUsername, stockmint_password: stockmintPassword });
    
    if (!error) {
         // TRIGGER V3: Intelligent Purchase Handler (Competition specialized path)
         const purchaseWebhook = process.env.MAKE_PURCHASE_WEBHOOK_URL;
         if (purchaseWebhook) {
             fetch(purchaseWebhook, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     email: profile.email,
                     full_name: profile.full_name,
                     plan_name: `Tournament: ${event.week_label}`,
                     username: stockmintUsername,
                     password: stockmintUsername,
                     needsKyc: false // Competitions don't require KYC for credentials
                 })
             }).catch(e => console.error(e));
         }
    }
    
    if (error) return { error: error.message };
    revalidatePath('/welcome');
    return { success: true };
}

export async function getCompetitionEvents() {
    const { data } = await supabaseAdmin.from('competition_events').select('*').eq('is_active', true).neq('status', 'completed').order('start_date', { ascending: true });
    return data || [];
}
