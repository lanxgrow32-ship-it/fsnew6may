
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Fetches internal wallet metrics for auditing.
 * Separates deposits, bonuses, and spending.
 */
export async function getWalletReportData() {
    // Join with profiles to get the user's name for the ledger
    const { data: txs, error } = await supabaseAdmin
        .from('wallet_transactions')
        .select('*, profiles(full_name)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
    
    if (error) return null;

    let totalDeposited = 0;
    let totalSpent = 0;
    let totalBonuses = 0;

    txs.forEach(t => {
        if (t.type === 'deposit') {
            totalDeposited += parseFloat(t.amount);
            if (t.bonus_amount) totalBonuses += parseFloat(t.bonus_amount);
        } else if (t.type === 'purchase') {
            // Purchases are negative amounts in the DB
            totalSpent += Math.abs(parseFloat(t.amount));
        }
    });

    return {
        totalDeposited,
        totalSpent,
        totalBonuses,
        netCirculation: totalDeposited + totalBonuses - totalSpent,
        recentActivity: txs.slice(0, 50)
    };
}
