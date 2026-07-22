
import { NextRequest, NextResponse } from 'next/server';
import { generateLgPaySignature } from '@/lib/lg-pay';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * LG-Pay Webhook Handler (Hardened v5.0)
 * Handles automated payment confirmation and Referral Engine integration.
 */
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
        
        const lgPayKey = '3zJXYxvfIY2S1gOHl3Ctunq6xx9apBX1';
        const expectedSign = generateLgPaySignature(data, lgPayKey);

        if (receivedSign !== expectedSign) {
            console.warn(`Webhook signature mismatch for order ${data.order_sn}.`);
            return new NextResponse('Invalid signature', { status: 403 });
        }

        if (data.status === '1') {
            const { data: profile, error: findError } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('order_sn', data.order_sn)
                .single();

            if (findError || !profile) {
                console.error(`Webhook DB Error: Could not find profile for order_sn ${data.order_sn}.`, findError);
                return new NextResponse('ok', { status: 200 });
            }
            
            if (!profile.is_approved) {
                 // 1. Update Profile Approval
                 await supabaseAdmin.from('profiles').update({ 
                    is_approved: true,
                    transaction_id: data.trade_sn,
                 }).eq('id', profile.id);

                 // 2. REFERRAL ENGINE (v5.0): Credit if first real purchase
                 const paidAmount = profile.final_amount_paid || 0;
                 if (profile.referred_by && !profile.referral_commission_paid && paidAmount > 0) {
                    const { data: settings } = await supabaseAdmin.from('payment_details').select('referral_commission_percentage').eq('id', 1).single();
                    const commPercent = settings?.referral_commission_percentage || 10;
                    const commissionAmount = Math.floor((paidAmount * commPercent) / 100);

                    if (commissionAmount > 0) {
                        const { data: referrer } = await supabaseAdmin.from('profiles').select('referral_balance').eq('id', profile.referred_by).single();
                        const newBal = (referrer?.referral_balance || 0) + commissionAmount;
                        
                        await supabaseAdmin.from('profiles').update({ referral_balance: newBal }).eq('id', profile.referred_by);
                        await supabaseAdmin.from('profiles').update({ referral_commission_paid: true }).eq('id', profile.id);

                        await supabaseAdmin.from('referrals').insert({
                            referrer_id: profile.referred_by,
                            referred_id: profile.id,
                            commission_amount: commissionAmount,
                            plan_name: profile.plan_purchased || 'LG-Pay Plan'
                        });
                        console.log(`[Referral Engine] Webhook Credit: ₹${commissionAmount} to ${profile.referred_by}`);
                    }
                 }

                // 3. Sync User Accounts
                const isPTP = profile.account_model === 'passthrupay';
                const isKycVerified = profile.kyc_status === 'verified';
                
                await supabaseAdmin.from('user_accounts').update({ 
                    is_approved: true,
                    status: isPTP || isKycVerified ? 'active' : 'pending'
                }).eq('user_id', profile.id).eq('is_approved', false);

                revalidatePath('/welcome');
                revalidatePath('/admin/dashboard');
                revalidatePath('/referrals');
            }
        }
        
        return new NextResponse('ok', { status: 200 });

    } catch (error: any) {
        console.error('Error processing LG Pay webhook:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
