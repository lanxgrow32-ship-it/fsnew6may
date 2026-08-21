
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getAutoClassification, getBalanceFromPlanName, generateStockmintUsername, getMarketType } from '@/lib/plan-utils';

/**
 * Approves an individual account request from the Activation Ledger.
 * UPDATED v9.0: Robust Retry Logic & Error Clearing.
 */
export async function approveAccount(accountId: string) {
    const { data: account, error: fetchError } = await supabaseAdmin
        .from('user_accounts')
        .select('*, profiles(*)').eq('id', accountId).single();
    
    if (fetchError || !account) return { error: 'Account request not found.' };

    const profile = account.profiles;
    const isPTP = account.account_model === 'passthrupay' || account.plan_name.toLowerCase().includes('ptp');
    const isKycDone = profile.kyc_status === 'verified';
    const classification = getAutoClassification(account.plan_name);
    const marketType = getMarketType(account.plan_name);

    // 1. Update Account Status (Approved Immediately)
    const updateData: any = { 
        is_approved: true, 
        status: 'active', 
        account_classification: classification,
        market_type: marketType
    };

    // 2. GRACE PERIOD PROTOCOL (First purchase only)
    const { count: existingCount } = await supabaseAdmin
        .from('user_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('credentials_provided', true);

    const isFirstAccount = (existingCount || 0) === 0;

    if (isFirstAccount && !isKycDone && !isPTP && !account.grace_period_expiry) {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 48);
        updateData.grace_period_expiry = expiry.toISOString();
    }

    const { error: approveError } = await supabaseAdmin.from('user_accounts').update(updateData).eq('id', accountId);
    if (approveError) return { error: approveError.message };

    // 3. REFERRAL ENGINE (Safety checked by profile flag)
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
                referrer_id: profile.referred_by, referred_id: profile.id, commission_amount: commissionAmount, plan_name: account.plan_name
            });
        }
    }

    // 4. STOCKMINT HUB AUTO-PROVISIONING (v3.0 Segmented)
    const initialBalance = getBalanceFromPlanName(account.plan_name);
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;
    const stockmintUsername = generateStockmintUsername(profile.email, existingCount || 0);
    
    if (stockmintApiKey && initialBalance > 0) {
        try {
            console.log(`[Hub Sync] Initiating handshake for ${stockmintUsername} (Plan: ${account.plan_name})`);
            
            const payload = { 
                fullName: profile.full_name || profile.email.split('@')[0], 
                email: stockmintUsername, 
                password: stockmintUsername,
                initialBalance, 
                accountClassification: classification, 
                accountModel: isPTP ? 'passthenpay' : 'normal',
                marketType: marketType 
            };

            const res = await fetch('https://stockmint.io/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                // SUCCESS: Clear error and save credentials
                await supabaseAdmin.from('user_accounts').update({
                    credentials_provided: true, 
                    trading_username: stockmintUsername, 
                    trading_password: stockmintUsername, 
                    status: 'active',
                    activation_error: null // CLEAR PREVIOUS ERRORS
                }).eq('id', accountId);
            } else {
                const errorBody = await res.text();
                console.error(`[Hub Sync] Stockmint Rejected Request: ${res.status} - ${errorBody}`);
                await supabaseAdmin.from('user_accounts').update({ 
                    activation_error: `Stockmint Error (${res.status}): ${errorBody || 'Unknown API rejection'}` 
                }).eq('id', accountId);
            }
        } catch (e: any) { 
            console.error(`[Hub Sync] Connectivity failure: ${e.message}`);
            await supabaseAdmin.from('user_accounts').update({ 
                activation_error: `Hub Connectivity Failure: ${e.message}` 
            }).eq('id', accountId);
        }
    } else {
        if (!stockmintApiKey) console.warn("[Hub Sync] Warning: STOCKMINT_API_KEY is not configured.");
        if (initialBalance <= 0) console.warn(`[Hub Sync] Warning: Could not parse balance for plan "${account.plan_name}".`);
    }

    // Webhook Automation
    const webhookUrl = process.env.MAKE_PURCHASE_WEBHOOK_URL;
    if (webhookUrl) {
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: profile.email,
                full_name: profile.full_name || profile.email.split('@')[0],
                plan_name: account.plan_name,
                username: stockmintUsername,
                password: stockmintUsername,
                needsKyc: !isKycDone && !isPTP && isFirstAccount
            })
        }).catch(e => console.error("[Automation] Webhook trigger failed:", e));
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
