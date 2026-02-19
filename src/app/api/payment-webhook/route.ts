
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// --- This is the new, more robust webhook logic ---

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // CRITICAL: Log the entire raw payload as soon as it's received for debugging.
        console.log("Styfashion Webhook Received - Full Raw Payload:", JSON.stringify(body, null, 2));

        let userId: string | null = null;
        let transactionId: string | null = null;
        let isSuccess = false;

        // --- Scenario 1: It's the simple custom payload we designed ---
        if (body.status?.toUpperCase() === 'SUCCESS') {
            console.log("Attempting to process as custom 'SUCCESS' payload.");
            isSuccess = true;
            userId = body.order_id || body.user_id; // Check for both keys
            transactionId = body.result?.utr || body.transaction_id || null;
             if (userId) console.log(`Found userId: ${userId} in custom payload.`);
        }
        // --- Scenario 2: It's a raw Razorpay 'payment.captured' webhook ---
        else if (body.event === 'payment.captured') {
            console.log("Attempting to process as raw Razorpay 'payment.captured' payload.");
            isSuccess = true;
            userId = body.payload?.payment?.entity?.notes?.user_id || null;
            transactionId = body.payload?.payment?.entity?.id || null;
            if (userId) console.log(`Found userId: ${userId} in Razorpay notes.`);
        }

        // --- Fallback Scenario: If not a recognized success event, do nothing. ---
        if (!isSuccess) {
            console.log("Webhook received, but it was not a recognized success event. No action taken.", { event: body.event, status: body.status });
            return NextResponse.json({ message: 'Webhook received for non-success event. No action taken.' });
        }
        
        if (!userId) {
            console.error("Webhook processing failed: Could not find user_id in any expected location of the payload. The integration is likely misconfigured.");
            return NextResponse.json({ error: 'User ID was not found in the webhook payload.' }, { status: 400 });
        }

        // --- Proceed with User Approval ---
        console.log(`Processing successful payment approval for User ID: ${userId}`);

        const { data: profile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('id, is_approved')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            console.error(`Webhook DB Error: User with ID ${userId} not found in database.`, fetchError);
            return NextResponse.json({ error: 'User for this order not found in our system.' }, { status: 404 });
        }

        if (profile.is_approved) {
            console.log(`User ${userId} is already approved. No further action taken.`);
            return NextResponse.json({ message: 'User already approved' });
        }
        
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ 
                is_approved: true,
                transaction_id: transactionId 
            })
            .eq('id', userId);

        if (updateError) {
            console.error(`Webhook DB Error: Failed to update profile for user ${userId}.`, updateError);
            return NextResponse.json({ error: 'Failed to update user profile in database.' }, { status: 500 });
        }
        
        // Revalidate paths to ensure UI updates across the app for the user and admin
        revalidatePath('/welcome', 'page');
        revalidatePath('/admin/dashboard', 'page');
        revalidatePath(`/admin/profile/${userId}`, 'page');
        revalidatePath(`/payment-success`, 'page'); // Revalidate the success page

        console.log(`User ${userId} has been successfully approved via webhook.`);
        return NextResponse.json({ message: 'User approved successfully.' });

    } catch (error: any) {
        console.error('CRITICAL: An exception occurred while processing the payment webhook.', error);
        return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }
}
