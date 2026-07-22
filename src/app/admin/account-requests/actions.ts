'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getAutoClassification, getBalanceFromPlanName, generateStockmintUsername } from '@/lib/plan-utils';

/**
 * Approves an individual account request from the Activation Ledger.
 * Includes unified logic for Stockmint provisioning and Referral Credits.
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

    // 1. Update Account Status
    const { error: approveError } = await supabaseAdmin.from('user_accounts').update({ 
        is_approved: true, 
        status: isKycDone || isPTP ? 'active' : 'pending', 
        account_classification: classification
    }).eq('id', accountId);
    
    if (approveError) return { error: approveError.message };

    // 2. REFERRAL ENGINE (v5.0): Credit referrer if this is the user's first REAL purchase
    // We check the 'referral_commission_paid' flag on the profile to ensure one-time payment.
    if (profile.referred_by && !profile.referral_commission_paid && !account.is_trial && account.final_amount_paid > 0) {
        const { data: settings } = await supabaseAdmin.from('payment_details').select('referral_commission_percentage').eq('id', 1).single();
        const commPercent = settings?.referral_commission_percentage || 10;
        const commissionAmount = Math.floor((account.final_amount_paid * commPercent) / 100);

        if (commissionAmount > 0) {
            // Credit referrer
            const { data: referrer } = await supabaseAdmin.from('profiles').select('referral_balance').eq('id', profile.referred_by).single();
            const newBalance = (referrer?.referral_balance || 0) + commissionAmount;
            
            await supabaseAdmin.from('profiles').update({ referral_balance: newBalance }).eq('id', profile.referred_by);
            
            // Mark user as "Commission Paid" to prevent repeat payments
            await supabaseAdmin.from('profiles').update({ referral_commission_paid: true }).eq('id', profile.id);

            // Log for audit
            await supabaseAdmin.from('referrals').insert({
                referrer_id: profile.referred_by,
                referred_id: profile.id,
                commission_amount: commissionAmount,
                plan_name: account.plan_name
            });
            console.log(`[Referral Engine] Credited ₹${commissionAmount} to ${profile.referred_by} for first purchase of ${profile.id}`);
        }
    }

    let stockmintUsername = profile.email; 
    
    if (isKycDone || isPTP) {
        // Multi-Account logic: Count how many accounts ALREADY have credentials
        const { count } = await supabaseAdmin
            .from('user_accounts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .eq('credentials_provided', true);
            
        stockmintUsername = generateStockmintUsername(profile.email, count || 0);
        const initialBalance = getBalanceFromPlanName(account.plan_name);
        const stockmintApiKey = process.env.STOCKMINT_API_KEY;
        
        console.log(`[Stockmint Sync] Target: ${stockmintUsername}. Balance: ${initialBalance}, Classification: ${classification}`);

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
                        status: 'active'
                    }).eq('id', accountId);
                    console.log(`[Stockmint Sync] SUCCESS for ${stockmintUsername}`);
                } else {
                    const errorBody = await res.text();
                    console.error(`[Stockmint Sync] REJECTED: ${res.status}. Body: ${errorBody}`);
                }
            } catch (e) { 
                console.error('[Stockmint Sync] NETWORK ERROR:', e); 
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
    revalidatePath('/welcome');
    revalidatePath('/referrals');
    return { success: true };
}

export async function deleteAccountRequest(accountId: string) {
    const { error } = await supabaseAdmin.from('user_accounts').update({ status: 'rejected' }).eq('id', accountId);
    if (error) return { error: error.message };
    revalidatePath('/admin/account-requests');
    return { success: true };
}