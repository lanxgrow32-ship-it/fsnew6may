
import { NextRequest, NextResponse } from 'next/server';
import { generateLgPaySignature } from '@/lib/lg-pay';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
    try {
        const body = await req.formData();
        const data: Record<string, string> = {};
        body.forEach((value, key) => {
            if (key !== 'sign') {
                data[key] = value.toString();
            }
        });
        const receivedSign = body.get('sign')?.toString();
        
        if (!data.order_sn || !receivedSign) {
            console.error('LG-Pay Webhook Error: Invalid callback data received.', { body });
            return new NextResponse('Invalid callback data', { status: 400 });
        }
        
        // This is hardcoded for now to ensure stability, as requested.
        const lgPayKey = '3zJXYxvfIY2S1gOHl3Ctunq6xx9apBX1';
        
        const expectedSign = generateLgPaySignature(data, lgPayKey);

        if (receivedSign !== expectedSign) {
            console.warn(`Webhook signature mismatch for order ${data.order_sn}.`);
            return new NextResponse('Invalid signature', { status: 403 });
        }

        if (data.status === '1') {
            // Payment is successful. Find the order by `data.order_sn` and update its status.
            console.log(`Successfully received payment confirmation for order: ${data.order_sn}`);
            
            const { data: profile, error: findError } = await supabaseAdmin
                .from('profiles')
                .select('id, is_approved')
                .eq('order_sn', data.order_sn)
                .single();

            if (findError || !profile) {
                console.error(`Webhook DB Error: Could not find profile for order_sn ${data.order_sn}.`, findError);
                // Still return 'ok' so LG-Pay doesn't retry. The issue is logged.
                return new NextResponse('ok', { status: 200 });
            }
            
            // Only update if the account is not already approved to prevent duplicate processing.
            if (!profile.is_approved) {
                 const { error: updateError } = await supabaseAdmin
                    .from('profiles')
                    .update({ 
                        is_approved: true,
                        transaction_id: data.trade_sn, // Save the gateway's transaction ID
                     })
                    .eq('id', profile.id);

                if (updateError) {
                    console.error(`Webhook DB Error: Failed to approve user ${profile.id} for order ${data.order_sn}.`, updateError);
                    // Still return 'ok'. The error is logged for manual review.
                    return new NextResponse('ok', { status: 200 });
                }

                console.log(`User ${profile.id} has been approved successfully for order ${data.order_sn}.`);
                
                // Revalidate paths to update the user's view
                revalidatePath('/welcome');
                revalidatePath('/admin/dashboard');
                revalidatePath(`/admin/profile/${profile.id}`);

            } else {
                 console.log(`Order ${data.order_sn} was already approved. Skipping update.`);
            }
        }
        
        // Acknowledge the webhook successfully
        return new NextResponse('ok', { status: 200 });

    } catch (error: any) {
        console.error('Error processing LG Pay webhook:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
