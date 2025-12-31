
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        // IMB sends data as application/x-www-form-urlencoded
        const formData = await req.formData();
        
        const status = formData.get('status') as string;
        const order_id = formData.get('order_id') as string;
        
        // Log the entire payload for debugging
        console.log("IMB Webhook Received:", Object.fromEntries(formData.entries()));

        if (!status || !order_id) {
            console.error("Webhook missing status or order_id", { status, order_id });
            return NextResponse.json({ error: 'Missing required webhook parameters: status and order_id' }, { status: 400 });
        }

        if (status.toUpperCase() === 'SUCCESS') {
            console.log(`Processing successful payment for order_id: ${order_id}`);

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

            // To prevent replay attacks or multiple processing, only update if not already approved.
            if (profile.is_approved) {
                console.log(`User ${order_id} is already approved. No action taken.`);
                return NextResponse.json({ message: 'User already approved. No action taken.' });
            }

            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ is_approved: true })
                .eq('id', order_id);

            if (updateError) {
                console.error(`Webhook DB Error: Failed to update profile for user ${order_id}`, updateError);
                return NextResponse.json({ error: 'Failed to update user profile in database' }, { status: 500 });
            }
            
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
