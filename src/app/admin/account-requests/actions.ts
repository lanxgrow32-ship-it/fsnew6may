'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

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

export async function approveAccount(accountId: string) {
    const { data: account, error: fetchError } = await supabaseAdmin
        .from('user_accounts')
        .select('*, profiles(*)')
        .eq('id', accountId)
        .single();
    
    if (fetchError || !account) return { error: 'Account request not found.' };

    const profile = account.profiles;
    const isPTP = account.account_model === 'passthrupay';
    const isKycDone = profile.kyc_status === 'verified';

    // 1. Mark as approved
    const { error: approveError } = await supabaseAdmin
        .from('user_accounts')
        .update({ is_approved: true, status: isKycDone ? 'active' : 'pending' })
        .eq('id', accountId);
    
    if (approveError) return { error: approveError.message };

    // 2. If KYC is verified, create StockMint account immediately
    if (isKycDone) {
        const { count } = await supabaseAdmin.from('user_accounts').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('credentials_provided', true);
        const versionSuffix = count && count > 0 ? `-ac${count + 1}` : '';
        const baseEmail = profile.email.split('@')[0];
        const domain = profile.email.split('@')[1];
        const stockmintUsername = `${baseEmail}${versionSuffix}@${domain}`;
        const initialBalance = getBalanceFromPlanName(account.plan_name);

        const stockmintApiKey = process.env.STOCKMINT_API_KEY;
        if (stockmintApiKey && initialBalance > 0) {
            try {
                const payload: any = { 
                    fullName: profile.full_name,
                    email: stockmintUsername,
                    password: stockmintUsername,
                    initialBalance
                };
                if (isPTP) payload.accountModel = 'passthenpay';

                await fetch('https://stockmint.io/api/users/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                    body: JSON.stringify(payload),
                });

                // Update account row with credentials
                await supabaseAdmin.from('user_accounts').update({
                    credentials_provided: true,
                    trading_username: stockmintUsername,
                    trading_password: stockmintUsername,
                    status: 'active'
                }).eq('id', accountId);

            } catch (e) { console.error('StockMint API failed:', e); }
        }
    }

    revalidatePath('/admin/account-requests');
    revalidatePath('/welcome');
    return { success: true };
}

export async function deleteAccountRequest(accountId: string) {
    const { error } = await supabaseAdmin.from('user_accounts').delete().eq('id', accountId);
    if (error) return { error: error.message };
    revalidatePath('/admin/account-requests');
    return { success: true };
}
