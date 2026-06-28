
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function approveTopUp(transactionId: string) {
    const { data: tx, error: fetchError } = await supabaseAdmin.from('wallet_transactions').select('*, profiles(*)').eq('id', transactionId).single();
    if (fetchError || !tx) return { error: 'Transaction not found.' };
    if (tx.status !== 'pending') return { error: 'Transaction is already processed.' };

    const amount = parseFloat(tx.amount);
    const bonus = amount * 0.05; 
    const totalToAdd = amount + bonus;

    const { error: updateTxError } = await supabaseAdmin.from('wallet_transactions').update({ 
        status: 'completed', bonus_amount: bonus, processed_at: new Date().toISOString()
    }).eq('id', transactionId);
    
    if (updateTxError) return { error: updateTxError.message };

    const newBalance = (tx.profiles.wallet_balance || 0) + totalToAdd;
    const { error: balanceError } = await supabaseAdmin.from('profiles').update({ wallet_balance: newBalance }).eq('id', tx.user_id);

    if (balanceError) return { error: 'Balance update failed. Check manual logs.' };

    // Email Trigger: Wallet Top-up Success
    const webhookUrl = process.env.MAKE_WALLET_SUCCESS_WEBHOOK_URL;
    if (webhookUrl) {
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: tx.profiles.email,
                full_name: tx.profiles.full_name,
                deposited_amount: amount,
                bonus_amount: bonus,
                new_balance: newBalance
            })
        }).catch(e => console.error(e));
    }

    revalidatePath('/admin/wallet-requests');
    revalidatePath('/welcome');
    return { success: true };
}

export async function rejectTopUp(transactionId: string) {
    const { error } = await supabaseAdmin.from('wallet_transactions').update({ status: 'failed', processed_at: new Date().toISOString() }).eq('id', transactionId);
    if (error) return { error: error.message };
    revalidatePath('/admin/wallet-requests');
    return { success: true };
}
