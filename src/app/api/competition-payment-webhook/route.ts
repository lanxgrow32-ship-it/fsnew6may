import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        // NEW: We now expect email and plan_type for renewals.
        // We still support session_id for the initial payment for backward compatibility.
        const { session_id, email, plan_type } = await req.json();

        if (session_id) {
             // This is the flow for the INITIAL payment.
            console.log(`Webhook received for initial payment via session_id: ${session_id}`);
            const { error: updateError } = await supabaseAdmin
                .from('payment_sessions')
                .update({ status: 'completed' })
                .eq('id', session_id);
            
            if (updateError) {
                console.error(`Webhook Error: Could not update payment session ${session_id} to completed.`, updateError);
                return NextResponse.json({ message: 'Failed to update session status, but webhook acknowledged.' });
            }
            console.log(`Payment session ${session_id} marked as completed.`);

        } else if (email && plan_type) {
            // This is the NEW flow for RENEWALS.
            console.log(`Webhook received for renewal for email: ${email}`);
            
            // Find the user to get their name
            const { data: profile } = await supabaseAdmin.from('profiles').select('full_name, mobile_number').eq('email', email).single();

            if (!profile) {
                console.error(`Webhook Renewal Error: Could not find a profile for email: ${email}`);
                return NextResponse.json({ error: 'User profile not found for renewal.' }, { status: 404 });
            }

            // Create a new payment session for this renewal
            const newSessionId = randomUUID();
            const { error: insertError } = await supabaseAdmin
                .from('payment_sessions')
                .insert({
                    id: newSessionId,
                    name: profile.full_name || 'N/A',
                    email: email,
                    plan_type: plan_type,
                    mobile_number: profile.mobile_number || 'N/A',
                    status: 'completed' // Mark as completed immediately since it's a confirmed renewal
                });
            
            if (insertError) {
                console.error(`Webhook Renewal Error: Could not create new payment session for ${email}.`, insertError);
                return NextResponse.json({ error: 'Failed to create new payment session record.' }, { status: 500 });
            }
            console.log(`New 'completed' payment session ${newSessionId} created for renewal of ${email}.`);

        } else {
            return NextResponse.json({ error: 'Request body must contain either a session_id (for initial payment) or an email and plan_type (for renewals).' }, { status: 400 });
        }
        
        revalidatePath('/welcome');
        return NextResponse.json({ message: 'Webhook processed successfully.' });

    } catch (error: any) {
        console.error('Error processing competition webhook:', error);
        return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }
}
