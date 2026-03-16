
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

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
        return { success: false, error: 'Trading platform integration is not configured. Please contact support.' };
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
            return { success: false, error: `Trading Platform API Error: ${errorBody}` };
        }
        return { success: true };
    } catch (apiError: any) {
        console.error('Failed to call StockMint user creation API:', apiError);
        return { success: false, error: `Trading Platform API call failed: ${apiError.message}` };
    }
}


export async function generateCompetitionCredentials() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: 'You must be logged in.' };
        }

        if (!user.email) {
            return { error: 'Your user account does not have an email associated with it. Please contact support.' };
        }
        
        // Find the user's LATEST completed payment session
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('payment_sessions')
            .select('*')
            .eq('email', user.email)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (sessionError || !session) {
            return { error: 'No completed payment found for your account. Please complete your payment or contact support if you believe this is an error.' };
        }

        // Determine the current period identifier based on the plan type
        const now = new Date();
        const periodIdentifier = session.plan_type === 'monthly'
            ? format(now, 'yyyy-MM') // e.g., 2024-07
            : format(now, 'yyyy-II'); // e.g., 2024-30


        // Check if an entry has already been created for this payment's period
        const { data: existingEntry } = await supabaseAdmin
            .from('competition_entries')
            .select('id')
            .eq('user_id', user.id)
            .eq('week_identifier', periodIdentifier)
            .limit(1)
            .single();
            
        if (existingEntry) {
            revalidatePath('/welcome');
            return { success: true, message: "Credentials for the current period already exist." };
        }

        // Get user's full name from their profile
        const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('full_name').eq('id', user.id).single();
        if (profileError || !profile) {
            return { error: 'Could not find your user profile.'};
        }
        if (!profile.full_name) {
            return { error: 'Your profile does not have a full name. Please contact support.' };
        }
        const fullName = profile.full_name;

        // Count past entries to create a versioned username
        const { count: entryCount } = await supabaseAdmin.from('competition_entries').select('id', { count: 'exact' }).eq('user_id', user.id);
        const version = (entryCount || 0) + 1;
        const stockmintUsername = `${user.email.split('@')[0]}-p${version}@${user.email.split('@')[1]}`;
        const stockmintPassword = stockmintUsername;
        const accountBalance = getBalanceFromPlanType(session.plan_type);

        // Create the StockMint account via their API
        const stockmintResult = await createStockMintAccount(fullName, stockmintUsername, accountBalance);
        if (!stockmintResult.success) {
            return { error: `Could not create your trading account: ${stockmintResult.error}` };
        }

        // Create the competition_entries record in our DB with the new credentials
        const { error: entryError } = await supabaseAdmin
            .from('competition_entries')
            .insert({
                user_id: user.id,
                week_identifier: periodIdentifier,
                stockmint_username: stockmintUsername,
                stockmint_password: stockmintPassword,
                account_balance: accountBalance
            });

        if (entryError) {
            console.error("CRITICAL: StockMint account created, but failed to save credentials to our DB.", entryError);
            return { error: 'Your trading account was created, but we failed to save the credentials. Please contact support immediately.' };
        }

        revalidatePath('/welcome');
        return { success: true };

    } catch (e: any) {
        console.error("A server-side exception occurred in generateCompetitionCredentials:", e);
        return { error: `An unexpected server error occurred. Please contact support. (${e.message})` };
    }
}


export async function submitUtr(prevState: any, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to submit a transaction ID.' };
  }

  const utr = formData.get('utr') as string;

  if (!utr || utr.length < 12) {
      return { error: 'Please enter a valid UTR / Transaction ID.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ transaction_id: utr })
    .eq('id', user.id);
  
  if (error) {
    console.error("Error submitting UTR:", error);
    return { error: `Failed to save transaction ID: ${error.message}` };
  }

  revalidatePath('/welcome');
  return { success: true };
}
