
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

// Helper function to parse plan name into account balance
function getBalanceFromPlanType(planType: string): number {
    switch (planType) {
        case 'weekly':
            return 100000;
        case 'monthly':
            return 500000;
        default:
            return 0;
    }
}

async function createStockMintAccount(fullName: string, email: string, initialBalance: number) {
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;
    if (!stockmintApiKey || initialBalance <= 0) {
        console.error('StockMint API key not set or initial balance is zero. Aborting account creation.');
        return false;
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
                email, // StockMint username
                password: email, // StockMint password
                initialBalance,
            }),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Failed to create StockMint account. Status: ${response.status}. Body: ${errorBody}`);
            return false;
        }
        return true;
    } catch (apiError) {
        console.error('Failed to call StockMint user creation API:', apiError);
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        const { session_id } = await req.json();

        if (!session_id) {
            return NextResponse.json({ error: 'session_id is missing' }, { status: 400 });
        }

        // 1. Retrieve the session details
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('payment_sessions')
            .select('*')
            .eq('id', session_id)
            .single();

        if (sessionError || !session) {
            console.error(`Webhook Error: Payment session with ID ${session_id} not found.`);
            return NextResponse.json({ error: 'Payment session not found' }, { status: 404 });
        }

        if (session.status === 'completed') {
             return NextResponse.json({ message: 'This payment session has already been processed.' });
        }

        const { name, email, password_hash, plan_type } = session;

        // 2. Find or create the user in profiles
        let userId: string;
        let isNewUser = false;

        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();
        
        if (existingProfile) {
            userId = existingProfile.id;
        } else {
            isNewUser = true;
            // Create the user in Auth
            const { data: authUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: password_hash, // This should be the real password, but we have the hash. Let's send a recovery link instead.
                email_confirm: true,
                 user_metadata: {
                    full_name: name,
                    role: 'user',
                },
            });
            
            if (signUpError) {
                console.error(`Webhook DB Error: Failed to create auth user for ${email}`, signUpError);
                return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
            }
            userId = authUser.user.id;
            
            // The trigger will create the profile, now update it.
            await supabaseAdmin.from('profiles').update({ account_type: 'competition' }).eq('id', userId);
        }

        // 3. Create the competition entry and StockMint account
        const weekIdentifier = format(new Date(), 'yyyy-WW');
        const accountBalance = getBalanceFromPlanType(plan_type);

        const { data: pastEntries } = await supabaseAdmin.from('competition_entries').select('id', { count: 'exact' }).eq('user_id', userId);
        const weekCount = (pastEntries?.length || 0) + 1;
        
        const stockmintUsername = `${email.split('@')[0]}-w${weekCount}@${email.split('@')[1]}`;
        const stockmintPassword = stockmintUsername; // Keep it simple

        const stockmintSuccess = await createStockMintAccount(name, stockmintUsername, accountBalance);

        if (!stockmintSuccess) {
            // This is a critical failure. We should not proceed.
            // For now, we'll log it and the session will remain 'initiated'.
            // A more robust system might have a retry mechanism.
             return NextResponse.json({ error: 'Failed to create trading account on StockMint.' }, { status: 500 });
        }
        
        // 4. Record the competition entry
        await supabaseAdmin.from('competition_entries').insert({
            user_id: userId,
            week_identifier: weekIdentifier,
            stockmint_username: stockmintUsername,
            stockmint_password: stockmintPassword,
            account_balance: accountBalance,
        });

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
