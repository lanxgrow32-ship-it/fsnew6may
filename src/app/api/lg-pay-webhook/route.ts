
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
                .select('id, is_approved, account_model, kyc_status')
                .eq('order_sn', data.order_sn)
                .single();

            if (findError || !profile) {
                console.error(`Webhook DB Error: Could not find profile for order_sn ${data.order_sn}.`, findError);
                return new NextResponse('ok', { status: 200 });
            }
            
            // Only update if the account is not already approved to prevent duplicate processing.
            if (!profile.is_approved) {
                 // 1. Update Profile
                 const { error: profileUpdateError } = await supabaseAdmin
                    .from('profiles')
                    .update({ 
                        is_approved: true,
                        transaction_id: data.trade_sn, // Save the gateway's transaction ID
                     })
                    .eq('id', profile.id);

                if (profileUpdateError) {
                    console.error(`Webhook DB Error: Failed to update profile for user ${profile.id}.`, profileUpdateError);
                }

                // 2. Sync User Accounts (This unblocks the Hub view)
                const isPTP = profile.account_model === 'passthrupay';
                const isKycVerified = profile.kyc_status === 'verified';
                
                const { error: accountUpdateError } = await supabaseAdmin
                    .from('user_accounts')
                    .update({ 
                        is_approved: true,
                        status: isPTP || isKycVerified ? 'active' : 'pending'
                    })
                    .eq('user_id', profile.id)
                    .eq('is_approved', false); // Only update the pending ones

                if (accountUpdateError) {
                    console.error(`Webhook DB Error: Failed to sync user_accounts for user ${profile.id}.`, accountUpdateError);
                }

                console.log(`User ${profile.id} has been approved and accounts synced successfully.`);
                
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
