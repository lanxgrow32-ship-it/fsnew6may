
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { AccountDashboardClient } from './account-dashboard-client';

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
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) redirect('/login');

    // Fetch account with profile joined
    const { data: account } = await supabase
        .from('user_accounts')
        .select('*, profiles(*)')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

    if (!account) notFound();

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
    if (stockmintApiKey && account.trading_username) {
        try {
            const res = await fetch(`https://stockmint.io/api/users/stats?email=${account.trading_username}`, {
                headers: { 'X-API-Key': stockmintApiKey },
                next: { revalidate: 0 } // No cache for live terminal stats
            });
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    // Safe merge stats to prevent property access errors
                    stats = { ...stats, ...json.data };
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
