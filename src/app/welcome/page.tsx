
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WelcomeClient } from './welcome-client';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function WelcomePage() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) redirect('/login');

    const userId = session.user.id;

    // Fetch comprehensive data for the unified view
    const [profileRes, accountsRes, walletRes, paymentSettingsRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
        supabaseAdmin.from('user_accounts').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabaseAdmin.from('wallet_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabaseAdmin.from('payment_details').select('*').eq('id', 1).single()
    ]);

    if (!profileRes.data) {
        return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">Profile initialization error.</div>;
    }

    return (
        <WelcomeClient 
            profile={profileRes.data} 
            accounts={accountsRes.data || []} 
            walletTransactions={walletRes.data || []}
            paymentSettings={paymentSettingsRes.data}
        />
    );
}

// These are shared layout components that other pages use
export const Logo = () => (
    <div className="bg-slate-900 h-10 w-10 flex items-center justify-center rounded-lg text-2xl font-bold border border-white/10 shadow-inner shadow-black/50">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 7L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 7L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    </div>
);
