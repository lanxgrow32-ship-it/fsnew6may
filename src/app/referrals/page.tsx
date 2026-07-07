
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ReferralsClient } from './referrals-client';

export const dynamic = 'force-dynamic';

export default async function ReferralsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch initial data on the server for faster loading and reliable auth
    const [profileRes, referralsRes, payoutsRes, paymentDetailsRes] = await Promise.all([
        supabase.from('profiles').select('referral_code, referral_balance, payout_upi_id, payout_qr_code_url, full_name, email, id').eq('id', user.id).single(),
        supabase.from('referrals').select('*, profiles!referrals_referred_id_fkey(full_name)').eq('referrer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('payout_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('payment_details').select('referral_commission_percentage').eq('id', 1).single()
    ]);

    if (!profileRes.data) {
        redirect('/login');
    }

    return (
        <ReferralsClient 
            initialProfile={profileRes.data}
            initialReferrals={referralsRes.data || []}
            initialPayoutRequests={payoutsRes.data || []}
            commissionPercentage={paymentDetailsRes.data?.referral_commission_percentage || 10}
        />
    );
}
