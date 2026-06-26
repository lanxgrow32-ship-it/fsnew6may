'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Helper to upload images for support chat
 */
async function uploadSupportImage(file: File, conversationId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `support-${conversationId}-${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabaseAdmin.storage
    .from('support-attachments')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading support image:', error);
    throw new Error('Failed to upload image.');
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('support-attachments')
    .getPublicUrl(data.path);
    
  return urlData.publicUrl;
}

/**
 * Handles manual account purchase requests (Direct UPI/QR)
 */
export async function requestManualAccount(userId: string, planName: string, amount: number, utr: string) {
  if (!userId || !planName || !amount || !utr) {
    return { error: 'Invalid request details.' };
  }

  const { error } = await supabaseAdmin
    .from('user_accounts')
    .insert({
      user_id: userId,
      plan_name: planName,
      status: 'pending',
      is_approved: false,
      final_amount_paid: amount,
      transaction_id: utr,
      account_model: planName.toLowerCase().includes('ptp') ? 'passthrupay' : 'normal'
    });

  if (error) {
    console.error("Manual Request Error:", error);
    return { error: error.message };
  }

  revalidatePath('/welcome');
  revalidatePath('/admin/account-requests');
  return { success: true };
}

/**
 * Handles wallet top-up requests
 */
export async function topUpWallet(userId: string, amount: number, utr: string) {
  if (!userId || isNaN(amount) || amount <= 0 || !utr) {
    return { error: 'Invalid top-up details.' };
  }

  const { error } = await supabaseAdmin
    .from('wallet_transactions')
    .insert({
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

/**
 * Handles internal account purchases using wallet balance
 */
export async function purchaseWithWallet(userId: string, plan: any) {
  if (!userId || !plan) return { error: 'Missing details.' };

  // 1. Fetch Current Balance
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('wallet_balance')
    .eq('id', userId)
    .single();
  
  if (!profile) return { error: 'Profile not found.' };
  
  const price = parseFloat(plan.price.replace(/,/g, ''));
  if (profile.wallet_balance < price) {
      return { error: 'Insufficient wallet balance. Please top up your wallet.' };
  }

  // 2. Deduct Balance
  const newBalance = profile.wallet_balance - price;
  const { error: balanceError } = await supabaseAdmin
    .from('profiles')
    .update({ wallet_balance: newBalance })
    .eq('id', userId);
  
  if (balanceError) return { error: balanceError.message };

  // 3. Create Transaction Record
  await supabaseAdmin.from('wallet_transactions').insert({
    user_id: userId,
    amount: -price,
    type: 'purchase',
    status: 'completed',
    description: `Purchase of ${plan.title}`
  });

  // 4. Create User Account
  const { error: accountError } = await supabaseAdmin.from('user_accounts').insert({
    user_id: userId,
    plan_name: plan.title,
    status: 'pending',
    is_approved: true, // Internal purchases are pre-verified
    account_model: plan.title.toLowerCase().includes('ptp') ? 'passthrupay' : 'normal',
    final_amount_paid: price,
    transaction_id: 'WALLET_PURCHASE'
  });

  if (accountError) {
      // Refund on failure
      await supabaseAdmin.from('profiles').update({ wallet_balance: profile.wallet_balance }).eq('id', userId);
      return { error: 'Failed to create account record.' };
  }

  revalidatePath('/welcome');
  return { success: true };
}

/**
 * Support Actions
 */
export async function createSupportConversation(userId: string, subject: string, firstMessage?: string) {
    const { data: conversation, error } = await supabaseAdmin
        .from('support_conversations')
        .insert({ user_id: userId, subject, unread_count_admin: 1 })
        .select()
        .single();
    
    if (error) return { error: error.message };

    if (firstMessage) {
        await supabaseAdmin.from('support_messages').insert({
            conversation_id: conversation.id,
            sender_id: userId,
            sender_role: 'user',
            message: firstMessage
        });
    }

    revalidatePath('/welcome');
    revalidatePath('/support-agent/chat');
    return { data: conversation };
}

export async function sendSupportMessage(convId: string, senderId: string, role: 'admin' | 'user', message: string, imageFile?: File) {
    if (!convId || !senderId || (!message.trim() && !imageFile)) {
        return { error: 'Invalid message data.' };
    }

    let imageUrl: string | undefined;
    if (imageFile) {
        try {
            imageUrl = await uploadSupportImage(imageFile, convId);
        } catch (e: any) {
            return { error: e.message };
        }
    }

    const { error } = await supabaseAdmin
        .from('support_messages')
        .insert({
            conversation_id: convId,
            sender_id: senderId,
            sender_role: role,
            message: message.trim(),
            image_url: imageUrl
        });
    
    if (!error) {
        const { data: conv } = await supabaseAdmin
            .from('support_conversations')
            .select('unread_count_user, unread_count_admin')
            .eq('id', convId)
            .single();

        const updateData: any = { 
            last_message_at: new Date().toISOString() 
        };

        if (role === 'admin') {
            updateData.unread_count_user = (conv?.unread_count_user || 0) + 1;
        } else {
            updateData.unread_count_admin = (conv?.unread_count_admin || 0) + 1;
        }

        await supabaseAdmin.from('support_conversations')
            .update(updateData)
            .eq('id', convId);
    }
    
    revalidatePath('/welcome');
    revalidatePath('/support-agent/chat');
    return { error: error?.message };
}

export async function markSupportRead(convId: string, role: 'admin' | 'user') {
    const field = role === 'admin' ? 'unread_count_admin' : 'unread_count_user';
    await supabaseAdmin.from('support_conversations')
        .update({ [field]: 0 })
        .eq('id', convId);
    
    revalidatePath('/welcome');
    revalidatePath('/support-agent/chat');
    return { success: true };
}

/**
 * Competition Actions
 */
export async function purchaseTournamentEntry(userId: string, eventId: string) {
    const { data: event } = await supabaseAdmin.from('competition_events').select('*').eq('id', eventId).single();
    const { data: profile } = await supabaseAdmin.from('profiles').select('wallet_balance').eq('id', userId).single();

    if (!event || !profile) return { error: 'Data not found' };

    if (!event.is_free) {
        if (profile.wallet_balance < event.entry_fee) return { error: 'Insufficient wallet balance' };
        
        await supabaseAdmin.from('profiles').update({ wallet_balance: profile.wallet_balance - event.entry_fee }).eq('id', userId);
        
        await supabaseAdmin.from('wallet_transactions').insert({
            user_id: userId,
            amount: -event.entry_fee,
            type: 'purchase',
            status: 'completed',
            description: `Entry for ${event.week_label}`
        });
    }

    const { error } = await supabaseAdmin.from('competition_registrations').insert({
        user_id: userId,
        event_id: eventId,
        transaction_id: event.is_free ? 'FREE_JOIN' : 'WALLET_JOIN',
        is_approved: true
    });

    if (error) return { error: error.message };
    revalidatePath('/welcome');
    return { success: true };
}

export async function getCompetitionEvents() {
    const { data } = await supabaseAdmin
        .from('competition_events')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: true });
    return data || [];
}
