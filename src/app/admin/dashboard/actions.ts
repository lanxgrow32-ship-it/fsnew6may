
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { getAutoClassification, getBalanceFromPlanName } from '@/lib/plan-utils';

export async function createAdmin(prevState: any, formData: FormData) {
  const fullName = formData.get('full_name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!fullName || !email || !password) {
    return { error: 'All fields are required.', success: false };
  }
  
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'admin' },
  });

  if (error) return { error: `Failed to create admin: ${error.message}`, success: false };
  revalidatePath('/admin/dashboard');
  return { success: true, error: null };
}

export async function deleteUser(userId: string) {
    if (!userId) return { error: 'User ID is required.' };
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return { error: `Failed to delete user: ${error.message}` };
    revalidatePath('/admin/dashboard');
    return { success: true };
}

export async function deleteMultipleUsers(userIds: string[]) {
  if (!userIds || userIds.length === 0) return { error: 'No user IDs provided.' };
  const deletePromises = userIds.map(id => supabaseAdmin.auth.admin.deleteUser(id));
  await Promise.allSettled(deletePromises);
  revalidatePath('/admin/dashboard');
  return { success: true };
}

/**
 * Legacy approve function, updated to respect the referral lock.
 */
export async function approveUserPayment(userId: string) {
    if (!userId) return { error: 'User ID is required.' };

    const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (fetchError || !profile) return { error: 'User profile not found.' };
    if (profile.is_approved && profile.referral_commission_paid) return { success: true, message: 'User is already processed.' };

    const classification = getAutoClassification(profile.plan_purchased || '');
    const isPTP = profile.account_model === 'passthrupay' || (profile.plan_purchased?.toLowerCase().includes('ptp'));
    const isKycVerified = profile.kyc_status === 'verified';

    // 1. Update Profile
    await supabaseAdmin.from('profiles').update({ 
        is_approved: true,
        account_classification: classification
    }).eq('id', userId);

    // 2. REFERRAL PROTOCOL: Credit referrer ONLY if never paid before (v5.0 Hardened)
    if (profile.referred_by && !profile.referral_commission_paid && profile.final_amount_paid > 0) {
        const { data: settings } = await supabaseAdmin.from('payment_details').select('referral_commission_percentage').eq('id', 1).single();
        const commPercent = settings?.referral_commission_percentage || 10;
        const commissionAmount = Math.floor((profile.final_amount_paid * commPercent) / 100);

        if (commissionAmount > 0) {
            const { data: referrer } = await supabaseAdmin.from('profiles').select('referral_balance').eq('id', profile.referred_by).single();
            const newBalance = (referrer?.referral_balance || 0) + commissionAmount;

            // Credit balance and set lock flag
            await supabaseAdmin.from('profiles').update({ referral_balance: newBalance }).eq('id', profile.referred_by);
            await supabaseAdmin.from('profiles').update({ referral_commission_paid: true }).eq('id', userId);

            await supabaseAdmin.from('referrals').insert({
                referrer_id: profile.referred_by,
                referred_id: userId,
                commission_amount: commissionAmount,
                plan_name: profile.plan_purchased || 'Evaluation Plan'
            });
            console.log(`[Referral Engine] Handled legacy credit of ₹${commissionAmount} to ${profile.referred_by}`);
        }
    }
    
    // 3. Sync first account in user_accounts
    const { data: firstAccount } = await supabaseAdmin
        .from('user_accounts')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

    if (firstAccount) {
        await supabaseAdmin.from('user_accounts')
            .update({ 
                is_approved: true,
                account_classification: classification,
                status: isKycVerified || isPTP ? 'active' : 'pending'
            })
            .eq('id', firstAccount.id);
    }

    // Automations (Email Webhooks)
    const paymentWebhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (paymentWebhookUrl) {
        const payload = {
            user_name: profile.full_name,
            email: profile.email,
            order_sn: profile.order_sn || profile.transaction_id || 'N/A',
            plan_purchased: profile.plan_purchased,
            account_size: getBalanceFromPlanName(profile.plan_purchased || '').toLocaleString('en-IN'),
            final_amount_paid: profile.final_amount_paid,
            payment_method: 'Manual/Direct',
            datetime: format(new Date(profile.created_at), 'dd-MM-yyyy HH:mm:ss'),
        };
        fetch(paymentWebhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(e => console.error(e));
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/welcome');
    revalidatePath('/referrals');
    return { success: true };
}
