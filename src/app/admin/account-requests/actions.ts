
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

function getAutoClassification(planName: string): string {
    const name = planName.toLowerCase();
    if (name.includes('ptp') || name.includes('passthenpay') || name.includes('pass then pay')) {
        return 'passthenpay';
    }
    if (name.includes('instant')) return 'instant_live';
    if (name.includes('1-step')) return 'one_step_phase_1';
    if (name.includes('2-step')) return 'two_step_phase_1';
    return 'evaluation';
}

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
    return 0;
}

export async function approveAccount(accountId: string) {
    const { data: account, error: fetchError } = await supabaseAdmin.from('user_accounts').select('*, profiles(*)').eq('id', accountId).single();
    if (fetchError || !account) return { error: 'Account request not found.' };

    const profile = account.profiles;
    const isPTP = account.account_model === 'passthrupay';
    const isKycDone = profile.kyc_status === 'verified';
    const classification = getAutoClassification(account.plan_name);

    const { error: approveError } = await supabaseAdmin.from('user_accounts').update({ 
        is_approved: true, status: isKycDone || isPTP ? 'active' : 'pending', account_classification: classification
    }).eq('id', accountId);
    
    if (approveError) return { error: approveError.message };

    let stockmintUsername = profile.email; // Fallback
    
    if (isKycDone || isPTP) {
        const { count } = await supabaseAdmin.from('user_accounts').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('credentials_provided', true);
        const versionSuffix = count && count > 0 ? `-ac${count + 1}` : '';
        const [baseEmail, domain] = profile.email.split('@');
        stockmintUsername = `${baseEmail}${versionSuffix}@${domain}`;
        const initialBalance = getBalanceFromPlanName(account.plan_name);

        const stockmintApiKey = process.env.STOCKMINT_API_KEY;
        if (stockmintApiKey && initialBalance > 0) {
            try {
                const res = await fetch('https://stockmint.io/api/users/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                    body: JSON.stringify({ 
                        fullName: profile.full_name, email: stockmintUsername, password: stockmintUsername,
                        initialBalance, accountClassification: classification, accountModel: isPTP ? 'passthenpay' : 'normal'
                    }),
                });

                if (res.ok) {
                    await supabaseAdmin.from('user_accounts').update({
                        credentials_provided: true, trading_username: stockmintUsername, trading_password: stockmintUsername, status: 'active'
                    }).eq('id', accountId);
                }
            } catch (e) { console.error('StockMint API failed:', e); }
        }
    }

    // TRIGGER V3: Intelligent Purchase Handler
    const webhookUrl = process.env.MAKE_PURCHASE_WEBHOOK_URL;
    if (webhookUrl) {
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: profile.email,
                full_name: profile.full_name,
                plan_name: account.plan_name,
                username: stockmintUsername,
                password: stockmintUsername,
                needsKyc: !isKycDone && !isPTP
            })
        }).catch(e => console.error(e));
    }

    revalidatePath('/admin/account-requests');
    revalidatePath('/welcome');
    return { success: true };
}

export async function deleteAccountRequest(accountId: string) {
    const { error } = await supabaseAdmin.from('user_accounts').update({ status: 'rejected' }).eq('id', accountId);
    if (error) return { error: error.message };
    revalidatePath('/admin/account-requests');
    return { success: true };
}
