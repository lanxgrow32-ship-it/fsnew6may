
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
    try {
        // This webhook now expects a JSON payload from styfashion.in
        const body = await req.json();
        
        console.log("Styfashion Webhook Received - Full Payload:", JSON.stringify(body, null, 2));

        // Make the webhook more robust by accepting 'user_id' as well as 'order_id'
        const order_id = body.order_id || body.user_id;
        const { status, result } = body;

        if (!status || !order_id) {
            console.error("Webhook missing status or user/order_id", { status, order_id });
            return NextResponse.json({ error: 'Missing required webhook parameters: status and a user/order ID' }, { status: 400 });
        }

        if (status.toUpperCase() === 'SUCCESS') {
            console.log(`Processing successful payment for order_id: ${order_id}`);

            const utr = result?.utr || null;
            
            // The order_id from our new flow is the user's ID.
            const { data: profile, error: fetchError } = await supabaseAdmin
                .from('profiles')
                .select('id, is_approved')
                .eq('id', order_id)
                .single();

            if (fetchError || !profile) {
                console.error(`Webhook Error: User with order_id (user_id) ${order_id} not found.`, fetchError);
                return NextResponse.json({ error: 'User for this order not found' }, { status: 404 });
            }

            if (profile.is_approved) {
                console.log(`User ${order_id} is already approved. No action taken.`);
                return NextResponse.json({ message: 'User already approved' });
            }
            
            const updatePayload: { is_approved: boolean, transaction_id?: string } = { is_approved: true };
            if (utr) {
                updatePayload.transaction_id = utr;
            } else {
                // Fallback to a generic ID if utr is not available
                updatePayload.transaction_id = `RAZORPAY_${order_id.substring(0, 8)}`;
            }

            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update(updatePayload)
                .eq('id', order_id);

            if (updateError) {
                console.error(`Webhook DB Error: Failed to update profile for user ${order_id}`, updateError);
                return NextResponse.json({ error: 'Failed to update user profile in database' }, { status: 500 });
            }
            
            // Revalidate paths to ensure UI updates across the app for the user and admin
            revalidatePath('/welcome', 'page');
            revalidatePath('/admin/dashboard', 'page');
            revalidatePath(`/admin/profile/${order_id}`, 'page');

            console.log(`User ${order_id} has been successfully approved.`);
            return NextResponse.json({ message: 'User approved successfully' });

        } else {
            console.log(`Received non-success webhook for order ${order_id}: ${status}. No action taken.`);
            return NextResponse.json({ message: 'Webhook received for non-success status. No action taken.' });
        }

    } catch (error: any) {
        console.error('Error processing styfashion payment webhook:', error);
        return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }
}
