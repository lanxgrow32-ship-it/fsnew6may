
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const status = formData.get('status') as string;
        const order_id = formData.get('order_id') as string;
        const utr = formData.get('utr') as string;
        const result_json = formData.get('result') as string;
        
        let result: any = {};
        if (result_json) {
            try {
                result = JSON.parse(result_json);
            } catch (e) {
                console.warn('Could not parse result JSON from webhook:', e);
            }
        }

        if (!status || !order_id) {
            return NextResponse.json({ error: 'Missing required webhook parameters: status and order_id' }, { status: 400 });
        }

        if (status.toUpperCase() === 'SUCCESS') {
            const { data: profile, error: fetchError } = await supabaseAdmin
                .from('profiles')
                .select('id, is_approved')
                .eq('id', order_id) // The order_id is the user's ID
                .single();

            if (fetchError || !profile) {
                console.error(`Webhook received for unknown order_id (user_id): ${order_id}`);
                return NextResponse.json({ error: 'User for this order not found' }, { status: 404 });
            }

            // To prevent replay attacks or multiple processing, only update if not already approved
            if (profile.is_approved) {
                 return NextResponse.json({ message: 'User already approved. No action taken.' });
            }

            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ 
                    is_approved: true,
                    // Optionally save the UTR if you have a column for it
                    // utr: utr 
                 })
                .eq('id', order_id);

            if (updateError) {
                console.error(`Failed to update profile for user ${order_id} after webhook`, updateError);
                return NextResponse.json({ error: 'Failed to update user profile in database' }, { status: 500 });
            }
            
            return NextResponse.json({ message: 'User approved successfully' });

        } else {
            // Handle failed, pending, etc. statuses if needed
            console.log(`Received non-success webhook for order ${order_id}: ${status}`);
            return NextResponse.json({ message: 'Webhook received for non-success status. No action taken.' });
        }

    } catch (error: any) {
        console.error('Error processing IMB webhook:', error);
        return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }
}
