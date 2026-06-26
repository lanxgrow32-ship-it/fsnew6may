'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function approveTopUp(transactionId: string) {
    // 1. Fetch transaction and current user balance
    const { data: tx, error: fetchError } = await supabaseAdmin
        .from('wallet_transactions')
        .select('*, profiles(wallet_balance)')
        .eq('id', transactionId)
        .single();
    
    if (fetchError || !tx) return { error: 'Transaction not found.' };
    if (tx.status !== 'pending') return { error: 'Transaction is already processed.' };

    const amount = parseFloat(tx.amount);
    const bonus = amount * 0.05; // 5% Bonus as per requirements
    const totalToAdd = amount + bonus;

    // 2. Update Transaction with completion and bonus data
    // NOTE: This requires the 'bonus_amount' column added via SQL
    const { error: updateTxError } = await supabaseAdmin
        .from('wallet_transactions')
        .update({ 
            status: 'completed',
            bonus_amount: bonus,
            processed_at: new Date().toISOString()
        })
        .eq('id', transactionId);
    
    if (updateTxError) return { error: updateTxError.message };

    // 3. Update User Wallet Balance
    const newBalance = (tx.profiles.wallet_balance || 0) + totalToAdd;
    const { error: balanceError } = await supabaseAdmin
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', tx.user_id);

    if (balanceError) {
        console.error('Critical Error: Transaction approved but balance update failed.', balanceError);
        return { error: 'Transaction marked completed, but balance update failed. Please update manually.' };
    }

    revalidatePath('/admin/wallet-requests');
    revalidatePath('/welcome');
    return { success: true };
}

export async function rejectTopUp(transactionId: string) {
    const { error } = await supabaseAdmin
        .from('wallet_transactions')
        .update({ 
            status: 'failed', 
            processed_at: new Date().toISOString() 
        })
        .eq('id', transactionId);
    
    if (error) return { error: error.message };
    revalidatePath('/admin/wallet-requests');
    return { success: true };
}
