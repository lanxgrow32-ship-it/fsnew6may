
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

// Helper to determine starting classification
function getAutoClassification(planName: string): string {
    const name = planName.toLowerCase();
    if (name.includes('instant')) return 'instant_live';
    if (name.includes('1-step')) return 'one_step_phase_1';
    if (name.includes('2-step')) return 'two_step_phase_1';
    return 'evaluation';
}

// Helper function to get account size text from plan name
function getAccountSizeText(planName: string): string {
    if (!planName) return 'N/A';
    const lowerPlanName = planName.toLowerCase();

    if (lowerPlanName.includes('1l') || lowerPlanName.includes('1,00,000')) return '1,00,000';
    if (lowerPlanName.includes('2l') || lowerPlanName.includes('2,00,000')) return '2,00,000';
    if (lowerPlanName.includes('5l') || lowerPlanName.includes('5,00,000')) return '5,00,000';
    if (lowerPlanName.includes('10l') || lowerPlanName.includes('10,00,000')) return '10,00,000';
    if (lowerPlanName.includes('25l') || lowerPlanName.includes('25,00,000')) return '25,00,000';
    if (lowerPlanName.includes('50l') || lowerPlanName.includes('50,00_000')) return '50,00,000';
    
    const plainNumberMatch = lowerPlanName.match(/^[\d,._]+/);
    if (plainNumberMatch) {
        return parseFloat(plainNumberMatch[0].replace(/[,_]/g, '')).toLocaleString('en-IN', {useGrouping: false});
    }

    return 'N/A';
}

// Helper function to parse plan name into account balance
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
    if (plainNumberMatch) {
        return parseFloat(plainNumberMatch[0].replace(/[,_]/g, ''));
    }

    return 0;
}


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
  const results = await Promise.allSettled(deletePromises);
  revalidatePath('/admin/dashboard');
  return { success: true };
}

export async function approveUserPayment(userId: string) {
    if (!userId) return { error: 'User ID is required.' };

    const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (fetchError || !profile) return { error: 'User profile not found.' };
    if (profile.is_approved) return { success: true, message: 'User is already approved.' };

    const classification = getAutoClassification(profile.plan_purchased || '');
    const isPTP = profile.account_model === 'passthrupay';
    const isKycVerified = profile.kyc_status === 'verified';

    // 1. Update Profile
    await supabaseAdmin.from('profiles').update({ 
        is_approved: true,
        account_classification: classification
    }).eq('id', userId);
    
    // 2. Sync first account in user_accounts
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
            account_size: getAccountSizeText(profile.plan_purchased),
            final_amount_paid: profile.final_amount_paid,
            payment_method: 'Manual/Direct',
            datetime: format(new Date(profile.created_at), 'dd-MM-yyyy HH:mm:ss'),
        };
        fetch(paymentWebhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(e => console.error(e));
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/welcome');
    return { success: true };
}
