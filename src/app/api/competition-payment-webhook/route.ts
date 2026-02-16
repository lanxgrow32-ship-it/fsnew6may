
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

        const { name, email, password_hash, plan_type } = session;

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
                },
            });
            
            if (signUpError) {
                console.error(`Webhook DB Error: Failed to create auth user for ${email}`, signUpError);
                return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
            }
            userId = authUser.user.id;
            
            // The database trigger will create the profile, now we update it with the account type.
            await supabaseAdmin.from('profiles').update({ 
                account_type: 'competition',
             }).eq('id', userId);
        }

        // 3. Create the competition entry record (without credentials yet)
        const weekIdentifier = format(new Date(), 'yyyy-WW');
        const accountBalance = getBalanceFromPlanType(plan_type);
        
        const { error: entryInsertError } = await supabaseAdmin.from('competition_entries').insert({
            user_id: userId,
            week_identifier: weekIdentifier,
            account_balance: accountBalance,
            // Credentials will be added later by the user action
            stockmint_username: null,
            stockmint_password: null,
        });

        if (entryInsertError) {
            console.error(`CRITICAL: Payment processed for ${email}, but failed to save initial entry to our DB.`, entryInsertError);
            return NextResponse.json({ error: 'Failed to save competition entry.' }, { status: 500 });
        }

        // 4. Mark session as complete
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
