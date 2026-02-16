
import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest) {
    try {
        const { session_id } = await req.json();

        if (!session_id) {
            return NextResponse.json({ error: 'session_id is missing' }, { status: 400 });
        }

        // 1. Retrieve the session details from our temporary table
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('payment_sessions')
            .select('*')
            .eq('id', session_id)
            .single();

        if (sessionError || !session) {
            console.error(`Webhook Error: Payment session with ID ${session_id} not found.`);
            return NextResponse.json({ error: 'Payment session not found' }, { status: 404 });
        }
        
        // Prevent reprocessing the same payment
        if (session.status === 'completed') {
             return NextResponse.json({ message: 'This payment session has already been processed.' });
        }

        const { name, email, password_hash, plan_type, mobile_number } = session;

        // 2. Find or create the user in profiles
        let userId: string;

        const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();
        
        if (existingProfile) {
            userId = existingProfile.id;
        } else {
            // Create the user in Auth if they don't exist
            const { data: authUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: password_hash, // The plain-text password from the payment_sessions table. Supabase will hash it.
                email_confirm: true,
                 user_metadata: {
                    full_name: name,
                    role: 'user',
                    mobile_number: mobile_number,
                },
            });
            
            if (signUpError) {
                console.error(`Webhook DB Error: Failed to create auth user for ${email}`, signUpError);
                return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
            }
            userId = authUser.user.id;
            
            // The database trigger will create the profile, now we update it with the account type and mobile number.
            await supabaseAdmin.from('profiles').update({ 
                account_type: 'competition',
                mobile_number: mobile_number,
             }).eq('id', userId);
        }

        // 3. Create the competition entry and StockMint account
        const weekIdentifier = format(new Date(), 'yyyy-WW');
        const accountBalance = getBalanceFromPlanType(plan_type);

        // Version the username for StockMint to ensure uniqueness per week
        const { data: pastEntries, error: countError } = await supabaseAdmin.from('competition_entries').select('id', { count: 'exact' }).eq('user_id', userId);
        if (countError) {
             console.error(`Webhook DB Error: Failed to count past entries for user ${userId}`, countError);
             return NextResponse.json({ error: 'Failed to count past entries.' }, { status: 500 });
        }
        const weekCount = (pastEntries?.length || 0) + 1;
        
        const stockmintUsername = `${email.split('@')[0]}-w${weekCount}@${email.split('@')[1]}`;
        const stockmintPassword = stockmintUsername; // Keep it simple

        const stockmintResult = await createStockMintAccount(name, stockmintUsername, accountBalance);

        if (!stockmintResult.success) {
            // This is a critical failure. For now, we'll log it and the session will remain 'initiated'.
            // A more robust system might have a retry mechanism or alert an admin.
             console.error(`CRITICAL: Payment processed for user ${email}, but StockMint account creation failed. Reason: ${stockmintResult.error}`);
             return NextResponse.json({ error: 'Failed to create trading account on StockMint.' }, { status: 500 });
        }
        
        // 4. Record the competition entry in our database
        const { error: entryInsertError } = await supabaseAdmin.from('competition_entries').insert({
            user_id: userId,
            week_identifier: weekIdentifier,
            stockmint_username: stockmintUsername,
            stockmint_password: stockmintPassword, // Storing password for user to see
            account_balance: accountBalance,
        });

        if (entryInsertError) {
            console.error(`CRITICAL: StockMint account created for ${email}, but failed to save entry to our DB.`, entryInsertError);
            return NextResponse.json({ error: 'Failed to save competition entry.' }, { status: 500 });
        }

        // 5. Mark session as complete
        await supabaseAdmin.from('payment_sessions').update({ status: 'completed' }).eq('id', session_id);
        
        revalidatePath('/admin/competition');
        revalidatePath(`/admin/competition/${userId}`);
        revalidatePath('/welcome');

        return NextResponse.json({ message: 'Competition entry processed successfully.' });

    } catch (error: any) {
        console.error('Error processing competition webhook:', error);
        return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }
}
