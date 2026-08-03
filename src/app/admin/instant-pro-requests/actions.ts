
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getAutoClassification, getBalanceFromPlanName, generateStockmintUsername, getMarketType } from '@/lib/plan-utils';
import { addDays } from 'date-fns';

export async function approveProAccount(accountId: string) {
    const { data: account, error: fetchError } = await supabaseAdmin
        .from('user_accounts')
        .select('*, profiles(*)').eq('id', accountId).single();
    
    if (fetchError || !account) return { error: 'Request not found.' };

    const profile = account.profiles;
    const classification = 'instant_pro';
    const marketType = getMarketType(account.plan_name);

    // 1. Activation with 7-Day Expiry (v11.0)
    const updateData: any = { 
        is_approved: true, 
        status: 'active', 
        account_classification: classification,
        market_type: marketType,
        expires_at: addDays(new Date(), 7).toISOString()
    };

    const { error: approveError } = await supabaseAdmin.from('user_accounts').update(updateData).eq('id', accountId);
    if (approveError) return { error: approveError.message };

    // 2. Provision on Hub
    const initialBalance = getBalanceFromPlanName(account.plan_name);
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;
    
    const { count } = await supabaseAdmin
        .from('user_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('credentials_provided', true);

    const stockmintUsername = generateStockmintUsername(profile.email, count || 0);
    
    if (stockmintApiKey && initialBalance > 0) {
        try {
            const payload = { 
                fullName: profile.full_name, 
                email: stockmintUsername, 
                password: stockmintUsername,
                initialBalance, 
                accountClassification: classification, 
                accountModel: 'normal',
                marketType: marketType
            };

            await fetch('https://stockmint.io/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                body: JSON.stringify(payload),
            });

            await supabaseAdmin.from('user_accounts').update({
                credentials_provided: true, trading_username: stockmintUsername, trading_password: stockmintUsername
            }).eq('id', accountId);
        } catch (e: any) { console.error("Hub Sync Failed:", e); }
    }

    revalidatePath('/admin/instant-pro-requests');
    revalidatePath('/welcome');
    return { success: true };
}

export async function rejectProAccount(accountId: string) {
    const { error } = await supabaseAdmin.from('user_accounts').update({ status: 'rejected' }).eq('id', accountId);
    if (error) return { error: error.message };
    revalidatePath('/admin/instant-pro-requests');
    return { success: true };
}
