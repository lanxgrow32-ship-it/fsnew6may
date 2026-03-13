
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateLgPaySignature } from '@/lib/lg-pay';
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
        
        if (!data.order_sn || !data.status || !receivedSign) {
            return new NextResponse('Invalid callback data', { status: 400 });
        }
        
        const lgPayKey = process.env.LG_PAY_KEY;
        if (!lgPayKey) {
            console.error('LG Pay Key not configured for webhook verification.');
            return new NextResponse('Internal Server Error', { status: 500 });
        }
        
        const expectedSign = generateLgPaySignature(data, lgPayKey);

        if (receivedSign !== expectedSign) {
            console.warn(`Webhook signature mismatch for order ${data.order_sn}. Expected ${expectedSign}, got ${receivedSign}`);
            return new NextResponse('Invalid signature', { status: 403 });
        }

        if (data.status === '1') {
            const { data: profile, error: fetchError } = await supabaseAdmin
                .from('profiles')
                .select('id, is_approved, referred_by, final_amount_paid')
                .eq('order_sn', data.order_sn)
                .single();

            if (fetchError || !profile) {
                console.error(`Webhook Error: Could not find profile for order_sn ${data.order_sn}.`);
                return new NextResponse('ok', { status: 200 });
            }

            if (profile.is_approved) {
                console.log(`Webhook: Order ${data.order_sn} already processed. Ignoring duplicate callback.`);
                return new NextResponse('ok', { status: 200 });
            }

            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ is_approved: true, transaction_id: `lgpay_${data.order_sn}` })
                .eq('id', profile.id);

            if (updateError) {
                 console.error(`Webhook DB Error: Could not update profile for order_sn ${data.order_sn}.`, updateError);
            } else {
                if (profile.referred_by && profile.final_amount_paid && profile.final_amount_paid > 0) {
                    const { data: settings, error: settingsError } = await supabaseAdmin
                        .from('payment_details')
                        .select('referral_commission_percentage')
                        .eq('id', 1)
                        .single();

                    if (!settingsError && settings) {
                        const commissionAmount = (profile.final_amount_paid * settings.referral_commission_percentage) / 100;
                        const { error: rpcError } = await supabaseAdmin.rpc('add_to_balance', {
                            user_id: profile.referred_by,
                            amount_to_add: commissionAmount
                        });

                        if (!rpcError) {
                            await supabaseAdmin.from('referrals').insert({
                                referrer_id: profile.referred_by,
                                referred_id: profile.id,
                                commission_amount: commissionAmount,
                                is_commission_paid: true,
                            });
                            revalidatePath('/referrals');
                        } else {
                            console.error(`Webhook: Error updating referrer balance for order ${data.order_sn}:`, rpcError);
                        }
                    } else {
                         console.error(`Webhook: Could not fetch referral commission setting for order ${data.order_sn}:`, settingsError);
                    }
                }
                revalidatePath('/welcome');
                revalidatePath('/admin/dashboard');
            }
        }
        
        return new NextResponse('ok', { status: 200 });

    } catch (error: any) {
        console.error('Error processing LG Pay webhook:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
