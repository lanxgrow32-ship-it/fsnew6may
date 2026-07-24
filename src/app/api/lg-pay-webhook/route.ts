import { NextRequest, NextResponse } from 'next/server';
import { generateLgPaySignature } from '@/lib/lg-pay';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * LG-Pay Webhook Handler (Hardened v5.1)
 * Handles both Account Activation and Wallet Credits.
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
            
            // --- BRANCH A: WALLET TOP-UP ---
            if (profile.plan_purchased === 'WALLET_TOPUP') {
                const depositAmount = profile.final_amount_paid || 0;
                // Only process if not already processed (transaction_id is empty or mismatch)
                if (profile.transaction_id !== data.trade_sn) {
                    const bonus = depositAmount >= 10000 ? (depositAmount * 0.05) : 0;
                    const totalToAdd = depositAmount + bonus;
                    const newBalance = (profile.wallet_balance || 0) + totalToAdd;

                    // 1. Log Ledger Entry
                    await supabaseAdmin.from('wallet_transactions').insert({
                        user_id: profile.id,
                        amount: depositAmount,
                        bonus_amount: bonus,
                        type: 'deposit',
                        status: 'completed',
                        gateway_transaction_id: data.trade_sn,
                        description: 'Automated Recharge (LG-Pay)',
                        processed_at: new Date().toISOString()
                    });

                    // 2. Update Profile & Clear Lock
                    await supabaseAdmin.from('profiles').update({ 
                        wallet_balance: newBalance,
                        transaction_id: data.trade_sn,
                        order_sn: null // Clear handshake
                    }).eq('id', profile.id);

                    // 3. Trigger Automation (Make.com)
                    const webhookUrl = process.env.MAKE_WALLET_SUCCESS_WEBHOOK_URL;
                    if (webhookUrl) {
                        fetch(webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: profile.email,
                                full_name: profile.full_name,
                                deposited_amount: depositAmount,
                                bonus_amount: bonus,
                                new_balance: newBalance
                            })
                        }).catch(e => console.error(e));
                    }
                }
            } 
            // --- BRANCH B: PLAN PURCHASE ---
            else if (!profile.is_approved) {
                 // 1. Update Profile Approval
                 await supabaseAdmin.from('profiles').update({ 
                    is_approved: true,
                    transaction_id: data.trade_sn,
                    order_sn: null // Clear handshake
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
                    }
                 }

                // 3. Sync User Accounts
                const isPTP = profile.account_model === 'passthrupay';
                const isKycVerified = profile.kyc_status === 'verified';
                
                await supabaseAdmin.from('user_accounts').update({ 
                    is_approved: true,
                    status: isPTP || isKycVerified ? 'active' : 'pending'
                }).eq('user_id', profile.id).eq('is_approved', false);
            }
            
            revalidatePath('/welcome');
            revalidatePath('/admin/dashboard');
        }
        
        return new NextResponse('ok', { status: 200 });

    } catch (error: any) {
        console.error('Error processing LG Pay webhook:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
