
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updatePayoutStatus(requestId: number, status: 'completed' | 'rejected' | 'pending') {

    const { data: request, error: fetchError } = await supabaseAdmin
        .from('payout_requests')
        .select('*')
        .eq('id', requestId)
        .single();
        
    if (fetchError || !request) {
        return { error: 'Payout request not found.' };
    }
    
    // Prevent reverting status if it wasn't rejected. User should not get their money back if payout was completed.
    // If it was rejected, we revert the transaction.
    if (status === 'pending' && request.status === 'rejected') {
         // Use an RPC function to safely update the referrer's balance
        const { error: rpcError } = await supabaseAdmin.rpc('add_to_balance', {
            user_id: request.user_id,
            amount_to_add: request.amount
        });
        if (rpcError) {
            console.error("CRITICAL: Failed to refund user balance on payout rejection revert.", rpcError);
            return { error: 'Failed to refund user balance. Please do it manually.' };
        }
    }


    const { error } = await supabaseAdmin
        .from('payout_requests')
        .update({ status: status, processed_at: new Date().toISOString() })
        .eq('id', requestId);
    
    if (error) {
        console.error('Error updating payout status:', error);
        return { error: `Failed to update status: ${error.message}` };
    }

    revalidatePath('/admin/payouts');
    return { success: true };
}
