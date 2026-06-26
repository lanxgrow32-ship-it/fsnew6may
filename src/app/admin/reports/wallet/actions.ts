
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export async function getWalletReportData() {
    const { data: txs, error } = await supabaseAdmin
        .from('wallet_transactions')
        .select('*')
        .eq('status', 'completed');
    
    if (error) return null;

    let totalDeposited = 0;
    let totalSpent = 0;
    let totalBonuses = 0;

    txs.forEach(t => {
        if (t.type === 'deposit') {
            totalDeposited += parseFloat(t.amount);
            if (t.bonus_amount) totalBonuses += parseFloat(t.bonus_amount);
        } else if (t.type === 'purchase') {
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
