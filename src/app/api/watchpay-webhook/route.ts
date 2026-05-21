
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        
        if (!data.merchantOrder || data.status !== 'success') {
            console.error('WatchPay Webhook Error: Invalid or unsuccessful status.', { data });
            return NextResponse.json({ message: 'ignored' });
        }

        console.log(`Successfully received WatchPay payment confirmation for order: ${data.merchantOrder}`);
        
        // Find the profile associated with this order_sn
        const { data: profile, error: findError } = await supabaseAdmin
            .from('profiles')
            .select('id, is_approved')
            .eq('order_sn', data.merchantOrder)
            .single();

        if (findError || !profile) {
            console.error(`Webhook DB Error: Could not find profile for order_sn ${data.merchantOrder}.`, findError);
            return NextResponse.json({ message: 'order not found' });
        }
        
        // Only update if not already approved to prevent loops
        if (!profile.is_approved) {
             const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ 
                    is_approved: true,
                    transaction_id: data.orderNo, // Save WatchPay's internal order ID
                 })
                .eq('id', profile.id);

            if (updateError) {
                console.error(`Webhook DB Error: Failed to approve user ${profile.id} for WatchPay order ${data.merchantOrder}.`, updateError);
                return NextResponse.json({ message: 'update failed' }, { status: 500 });
            }

            console.log(`User ${profile.id} has been approved successfully via WatchPay.`);
            
            revalidatePath('/welcome');
            revalidatePath('/admin/dashboard');
            revalidatePath(`/admin/profile/${profile.id}`);
        }
        
        // WatchPay documentation requires 'success' as response
        return new NextResponse('success', { status: 200 });

    } catch (error: any) {
        console.error('Error processing WatchPay webhook:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
