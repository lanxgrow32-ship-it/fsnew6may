'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getAutoClassification, getBalanceFromPlanName, generateStockmintUsername } from '@/lib/plan-utils';

/**
 * Approves an individual account request from the Activation Ledger.
 * Includes unified logic for Stockmint provisioning and Referral Credits.
 * Captures detailed errors if sync fails.
 */
export async function approveAccount(accountId: string) {
    const { data: account, error: fetchError } = await supabaseAdmin
        .from('user_accounts')
        .select('*, profiles(*)')
        .eq('id', accountId)
        .single();
    
    if (fetchError || !account) return { error: 'Account request not found.' };

    const profile = account.profiles;
    const isPTP = account.account_model === 'passthrupay' || account.plan_name.toLowerCase().includes('ptp');
    const isKycDone = profile.kyc_status === 'verified';
    const classification = getAutoClassification(account.plan_name);

    // Ensure profile is complete before attempting Stockmint sync
    if ((isKycDone || isPTP) && (!profile.full_name || !profile.mobile_number)) {
        const missing = !profile.full_name ? 'Name' : 'Mobile Number';
        const errMsg = `ABORTED: Missing Trader ${missing} in profile.`;
        await supabaseAdmin.from('user_accounts').update({ activation_error: errMsg }).eq('id', accountId);
        return { error: errMsg };
    }

    // 1. Update Account Status
    const { error: approveError } = await supabaseAdmin.from('user_accounts').update({ 
        is_approved: true, 
        status: isKycDone || isPTP ? 'active' : 'pending', 
        account_classification: classification
    }).eq('id', accountId);
    
    if (approveError) return { error: approveError.message };

    // 2. REFERRAL ENGINE (v5.0): Credit referrer ONLY if first real purchase
    if (profile.referred_by && !profile.referral_commission_paid && !account.is_trial && account.final_amount_paid > 0) {
        const { data: settings } = await supabaseAdmin.from('payment_details').select('referral_commission_percentage').eq('id', 1).single();
        const commPercent = settings?.referral_commission_percentage || 10;
        const commissionAmount = Math.floor((account.final_amount_paid * commPercent) / 100);

        if (commissionAmount > 0) {
            const { data: referrer } = await supabaseAdmin.from('profiles').select('referral_balance').eq('id', profile.referred_by).single();
            const newBalance = (referrer?.referral_balance || 0) + commissionAmount;
            
            await supabaseAdmin.from('profiles').update({ referral_balance: newBalance }).eq('id', profile.referred_by);
            await supabaseAdmin.from('profiles').update({ referral_commission_paid: true }).eq('id', profile.id);

            await supabaseAdmin.from('referrals').insert({
                referrer_id: profile.referred_by,
                referred_id: profile.id,
                commission_amount: commissionAmount,
                plan_name: account.plan_name
            });
        }
    }

    let stockmintUsername = profile.email; 
    
    if (isKycDone || isPTP) {
        const { count } = await supabaseAdmin
            .from('user_accounts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .eq('credentials_provided', true);
            
        stockmintUsername = generateStockmintUsername(profile.email, count || 0);
        const initialBalance = getBalanceFromPlanName(account.plan_name);
        const stockmintApiKey = process.env.STOCKMINT_API_KEY;
        
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
                        credentials_provided: true, 
                        trading_username: stockmintUsername, 
                        trading_password: stockmintUsername, 
                        status: 'active',
                        activation_error: null // Clear previous errors
                    }).eq('id', accountId);
                } else {
                    const errorBody = await res.text();
                    await supabaseAdmin.from('user_accounts').update({ 
                        activation_error: `Stockmint rejected request (${res.status}): ${errorBody}` 
                    }).eq('id', accountId);
                }
            } catch (e: any) { 
                await supabaseAdmin.from('user_accounts').update({ 
                    activation_error: `Network crash during sync: ${e.message}` 
                }).eq('id', accountId);
            }
        }
    }

    // Webhook Automation
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
    revalidatePath('/admin/activation-hub');
    revalidatePath('/welcome');
    return { success: true };
}

export async function deleteAccountRequest(accountId: string) {
    const { error } = await supabaseAdmin.from('user_accounts').update({ status: 'rejected' }).eq('id', accountId);
    if (error) return { error: error.message };
    revalidatePath('/admin/account-requests');
    return { success: true };
}
