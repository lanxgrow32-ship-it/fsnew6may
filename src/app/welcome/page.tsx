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
    const [profileRes, accountsRes, walletRes, paymentSettingsRes, compRes, supportRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
        supabaseAdmin.from('user_accounts').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabaseAdmin.from('wallet_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabaseAdmin.from('payment_details').select('*').eq('id', 1).single(),
        supabaseAdmin.from('competition_registrations').select('*, competition_events(*)').eq('user_id', userId).order('created_at', { ascending: false }),
        supabaseAdmin.from('support_conversations').select('*').eq('user_id', userId).order('last_message_at', { descending: true })
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
            competitions={compRes.data || []}
            supportConversations={supportRes.data || []}
        />
    );
}