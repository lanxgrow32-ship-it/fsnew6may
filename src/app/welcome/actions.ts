'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// Helper function to parse plan name into account balance
function getBalanceFromPlanType(planType: string): number {
    switch (planType) {
        case 'weekly':
            return 100000; // 1L for weekly
        case 'monthly':
            return 500000; // 5L for monthly
        default:
            return 0;
    }
}

async function createStockMintAccount(fullName: string, email: string, initialBalance: number) {
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;
    if (!stockmintApiKey || initialBalance <= 0) {
        console.error('StockMint API key not set or initial balance is zero. Aborting account creation.');
        return { success: false, error: 'StockMint API key not configured or zero balance.' };
    }

    try {
        const response = await fetch('https://stockmint.io/api/users/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': stockmintApiKey,
            },
            body: JSON.stringify({
                fullName,
                email, // StockMint username will be the versioned email
                password: email, // StockMint password will also be the versioned email
                initialBalance,
            }),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Failed to create StockMint account. Status: ${response.status}. Body: ${errorBody}`);
            return { success: false, error: `StockMint API Error: ${errorBody}` };
        }
        return { success: true };
    } catch (apiError: any) {
        console.error('Failed to call StockMint user creation API:', apiError);
        return { success: false, error: `StockMint API call failed: ${apiError.message}` };
    }
}


export async function generateCompetitionCredentials(formData: FormData) {
    const mobileNumber = formData.get('mobile_number') as string;
    const entryId = Number(formData.get('entry_id'));
    
    if (!mobileNumber || !entryId) {
        return { error: 'Mobile number and entry ID are required.' };
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in.' };
    }
    
    // 1. Update profile with mobile number
    await supabaseAdmin.from('profiles').update({ mobile_number: mobileNumber }).eq('id', user.id);

    // 2. Get the competition entry and user's email
    const { data: entry, error: entryError } = await supabaseAdmin
        .from('competition_entries')
        .select(`*, profiles(email, full_name)`)
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();
    
    if (entryError || !entry || !entry.profiles) {
        return { error: 'Could not find the specified competition entry.' };
    }
    
    // 3. Count past entries to version the username
    const { data: pastEntries, error: countError } = await supabaseAdmin
        .from('competition_entries')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

    if (countError) {
         return { error: 'Failed to count past entries.' };
    }
    const weekCount = (pastEntries?.length || 0);

    const stockmintUsername = `${entry.profiles.email.split('@')[0]}-w${weekCount}@${entry.profiles.email.split('@')[1]}`;
    const stockmintPassword = stockmintUsername; // Keep it simple

    // 4. Create the StockMint account
    const stockmintResult = await createStockMintAccount(entry.profiles.full_name, stockmintUsername, entry.account_balance);
    if (!stockmintResult.success) {
        return { error: `Could not create your trading account: ${stockmintResult.error}` };
    }

    // 5. Update our competition_entries table with the new credentials
    const { error: updateError } = await supabaseAdmin
        .from('competition_entries')
        .update({
            stockmint_username: stockmintUsername,
            stockmint_password: stockmintPassword,
        })
        .eq('id', entryId);

    if (updateError) {
        return { error: 'Failed to save your new credentials. Please contact support.' };
    }

    revalidatePath('/welcome');
    return { success: true };
}
