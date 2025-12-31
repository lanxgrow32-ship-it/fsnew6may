
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const status = formData.get('status') as string;
        const order_id = formData.get('order_id') as string;
        
        // The result is a JSON string within the form data
        const resultString = formData.get('result') as string | null;

        console.log("IMB Webhook Received - Full Payload:", Object.fromEntries(formData.entries()));

        if (!status || !order_id) {
            console.error("Webhook missing status or order_id", { status, order_id });
            return NextResponse.json({ error: 'Missing required webhook parameters: status and order_id' }, { status: 400 });
        }

        if (status.toUpperCase() === 'SUCCESS') {
            console.log(`Processing successful payment for order_id: ${order_id}`);

            // Parse the nested result JSON
            let utr: string | null = null;
            if (resultString) {
                try {
                    const resultData = JSON.parse(resultString);
                    utr = resultData.utr || null;
                } catch (parseError) {
                    console.error("Failed to parse 'result' JSON from webhook:", parseError);
                    // Continue without UTR, but log the issue
                }
            }
            
            // The order_id from IMB is our user's ID.
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
                // Fallback to the order_id if utr is not available
                updatePayload.transaction_id = order_id;
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
        console.error('Error processing IMB webhook:', error);
        return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }
}
