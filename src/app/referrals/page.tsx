
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ReferralsClient } from './referrals-client';

export const dynamic = 'force-dynamic';

export default async function ReferralsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch comprehensive data for the referral system
    // 1. Profile (Code/Balance)
    // 2. Success History (Commission events)
    // 3. Payout History (Withdrawal requests)
    // 4. Commission Settings
    // 5. My Network (Everyone who used the code to sign up)
    const [profileRes, referralsRes, payoutsRes, paymentDetailsRes, networkRes] = await Promise.all([
        supabase.from('profiles').select('referral_code, referral_balance, payout_upi_id, payout_qr_code_url, full_name, email, id').eq('id', user.id).single(),
        supabase.from('referrals').select('*, profiles!referrals_referred_id_fkey(full_name)').eq('referrer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('payout_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('payment_details').select('referral_commission_percentage').eq('id', 1).single(),
        supabase.from('profiles').select('full_name, created_at').eq('referred_by', user.id).order('created_at', { ascending: false })
    ]);

    if (!profileRes.data) {
        redirect('/login');
    }

    return (
        <ReferralsClient 
            initialProfile={profileRes.data}
            initialReferrals={referralsRes.data || []}
            initialPayoutRequests={payoutsRes.data || []}
            initialNetwork={networkRes.data || []}
            commissionPercentage={paymentDetailsRes.data?.referral_commission_percentage || 10}
        />
    );
}
