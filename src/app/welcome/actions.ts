
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Handles wallet top-up requests
 */
export async function topUpWallet(formData: FormData) {
  const userId = formData.get('user_id') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const utr = formData.get('utr') as string;

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
  
  if (balanceError) return { error: 'Balance deduction failed.' };

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
    is_approved: false, // Evaluation needs to be set up by admin
    account_model: plan.title.toLowerCase().includes('passthenpay') ? 'passthrupay' : 'normal',
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
