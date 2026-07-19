
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { AccountDashboardClient } from './account-dashboard-client';
import { checkAndCleanTrial } from '../../actions';

export const dynamic = 'force-dynamic';

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

export default async function AccountDashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) redirect('/login');

    // 1. TRIAL CLEANUP: Check if trial is expired before showing data
    await checkAndCleanTrial(id);

    // 2. Fetch account with profile joined
    const { data: account } = await supabase
        .from('user_accounts')
        .select('*, profiles(*)')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

    if (!account) notFound();

    // 3. Prevent access to expired trials
    if (account.status === 'deleted' && account.is_trial) {
        redirect('/welcome');
    }

    const profile = account.profiles;
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;
    
    // Initial stats state
    let stats = { 
        balance: 0, 
        totalPnl: 0, 
        winRate: 0, 
        activeTradingDays: 0, 
        accountClassification: account.account_classification 
    };

    // Server-side fetch from StockMint Hub
    if (stockmintApiKey && account.trading_username && account.trading_username !== 'EXPIRED') {
        try {
            const res = await fetch(`https://stockmint.io/api/users/stats?email=${account.trading_username}`, {
                headers: { 'X-API-Key': stockmintApiKey },
                next: { revalidate: 0 } 
            });
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    stats = { ...stats, ...json.data };
                    
                    // --- AUTO-PROMOTION SYNC (100% Automation Handshake) ---
                    // If Stockmint has automatically promoted the user, update our DB
                    if (json.data.accountClassification && json.data.accountClassification !== account.account_classification) {
                        console.log(`[Promotion Sync] Stockmint promoted ${account.trading_username} to ${json.data.accountClassification}. Updating local DB.`);
                        await supabaseAdmin.from('user_accounts').update({ 
                            account_classification: json.data.accountClassification 
                        }).eq('id', id);
                    }
                }
            }
        } catch (e) { 
            console.error('Terminal Stats Fetch Error:', e); 
        }
    }

    const initialBalance = getBalanceFromPlanName(account.plan_name);

    return (
        <AccountDashboardClient 
            account={account} 
            profile={profile} 
            stats={stats} 
            initialBalance={initialBalance}
        />
    );
}
