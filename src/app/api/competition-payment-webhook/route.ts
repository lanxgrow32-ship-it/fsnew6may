import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const { session_id } = await req.json();

        if (!session_id) {
            return NextResponse.json({ error: 'Request body must contain a session_id.' }, { status: 400 });
        }

        // --- Step 1: Check if this is an INITIAL payment ---
        // We look for a session that is still marked as 'initiated'.
        const { data: initialSession, error: initialError } = await supabaseAdmin
            .from('payment_sessions')
            .select('id')
            .eq('id', session_id)
            .eq('status', 'initiated')
            .single();

        if (initialError && initialError.code !== 'PGRST116') { // PGRST116 is "No rows found"
            console.error(`Webhook DB Error: Error checking for initial session ${session_id}.`, initialError);
            return NextResponse.json({ error: 'Database error while checking session status.' }, { status: 500 });
        }

        if (initialSession) {
            // This is an initial payment. Update the status and we're done.
            console.log(`Webhook: Processing initial payment for session_id: ${session_id}`);
            const { error: updateError } = await supabaseAdmin
                .from('payment_sessions')
                .update({ status: 'completed' })
                .eq('id', session_id);
            
            if (updateError) {
                console.error(`Webhook DB Error: Could not update session ${session_id} to completed.`, updateError);
                // Don't stop, acknowledge the webhook. The user can retry getting credentials.
            }

            console.log(`Webhook: Payment session ${session_id} marked as completed.`);
            revalidatePath('/welcome');
            return NextResponse.json({ message: 'Initial payment processed successfully.' });
        }


        // --- Step 2: If not an initial payment, handle it as a RENEWAL ---
        console.log(`Webhook: No initial session found for ${session_id}. Treating as a renewal.`);

        // Find the original session to get user details
        const { data: originalSession, error: originalError } = await supabaseAdmin
            .from('payment_sessions')
            .select('*')
            .eq('id', session_id)
            .limit(1)
            .single();
        
        if (originalError || !originalSession) {
             console.error(`Webhook Renewal Error: Could not find original payment session for ID: ${session_id}`);
             return NextResponse.json({ error: 'Original session not found for renewal.' }, { status: 404 });
        }

        // Create a new payment session for this renewal, copying details from the original
        const newSessionId = randomUUID();
        const { error: renewalInsertError } = await supabaseAdmin
            .from('payment_sessions')
            .insert({
                id: newSessionId,
                name: originalSession.name,
                email: originalSession.email,
                plan_type: originalSession.plan_type,
                mobile_number: originalSession.mobile_number,
                plain_password: originalSession.plain_password, // Copy this too just in case
                status: 'completed' // Mark as completed immediately since it's a confirmed renewal
            });

        if (renewalInsertError) {
            console.error(`Webhook Renewal Error: Could not create new payment session for ${originalSession.email}.`, renewalInsertError);
            return NextResponse.json({ error: 'Failed to create new payment session record for renewal.' }, { status: 500 });
        }
        
        console.log(`Webhook: New 'completed' payment session ${newSessionId} created for renewal of ${originalSession.email}.`);
        
        revalidatePath('/welcome');
        return NextResponse.json({ message: 'Renewal processed successfully.' });

    } catch (error: any) {
        console.error('Error processing competition webhook:', error);
        return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }
}
