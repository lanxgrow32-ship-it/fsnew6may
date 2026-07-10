
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getAutoClassification, getBalanceFromPlanName } from '@/lib/plan-utils';

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
        stockmintUsername = `${baseEmail}${versionSuffix}@${domain}`.toLowerCase().trim();
        const initialBalance = getBalanceFromPlanName(account.plan_name);

        const stockmintApiKey = process.env.STOCKMINT_API_KEY;
        
        console.log(`[Stockmint Sync] Attempting creation for: ${stockmintUsername}. Balance: ${initialBalance}, Class: ${classification}`);

        if (stockmintApiKey && initialBalance > 0) {
            try {
                const payload = { 
                    fullName: profile.full_name, 
                    email: stockmintUsername, 
                    password: stockmintUsername,
                    initialBalance, 
                    accountClassification: classification, 
                    accountModel: isPTP ? 'passthenpay' : 'normal'
                };

                const res = await fetch('https://stockmint.io/api/users/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    await supabaseAdmin.from('user_accounts').update({
                        credentials_provided: true, trading_username: stockmintUsername, trading_password: stockmintUsername, status: 'active'
                    }).eq('id', accountId);
                    console.log(`[Stockmint Sync] SUCCESS for ${stockmintUsername}`);
                } else {
                    const errorBody = await res.text();
                    console.error(`[Stockmint Sync] API REJECTED: ${res.status}. Body: ${errorBody}`);
                }
            } catch (e) { 
                console.error('[Stockmint Sync] CRITICAL FETCH ERROR:', e); 
            }
        } else {
            console.warn(`[Stockmint Sync] SKIPPED. Key Missing: ${!stockmintApiKey}, Balance Invalid: ${initialBalance <= 0}`);
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
