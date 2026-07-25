import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getAutoClassification, getBalanceFromPlanName, generateStockmintUsername } from '@/lib/plan-utils';

/**
 * WatchPay Webhook Handler (Perfect Automation SPEC v4.2)
 */
export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        
        if (!data.merchantOrder || data.status !== 'success') return NextResponse.json({ message: 'ignored' });

        const orderSn = data.merchantOrder;
        const tradeSn = data.orderNo;

        // 1. Check Wallet Top-up
        const { data: walletTx } = await supabaseAdmin.from('wallet_transactions').select('*, profiles(*)').eq('gateway_transaction_id', orderSn).eq('status', 'pending').single();

        if (walletTx) {
            const amount = parseFloat(walletTx.amount);
            const bonus = amount >= 10000 ? (amount * 0.05) : 0;
            const total = amount + bonus;
            const newBalance = (walletTx.profiles.wallet_balance || 0) + total;

            await supabaseAdmin.from('wallet_transactions').update({ 
                status: 'completed', bonus_amount: bonus, processed_at: new Date().toISOString(), gateway_transaction_id: tradeSn
            }).eq('id', walletTx.id);

            await supabaseAdmin.from('profiles').update({ wallet_balance: newBalance }).eq('id', walletTx.user_id);
        } 
        // 2. Check Plan Purchase
        else {
            const { data: account } = await supabaseAdmin.from('user_accounts').select('*, profiles(*)').eq('transaction_id', orderSn).eq('is_approved', false).single();

            if (account) {
                const profile = account.profiles;
                const isPTP = account.account_model === 'passthrupay';
                const isKycDone = profile.kyc_status === 'verified';

                await supabaseAdmin.from('user_accounts').update({ 
                    is_approved: true, 
                    status: isKycDone || isPTP ? 'active' : 'pending',
                    transaction_id: tradeSn 
                }).eq('id', account.id);

                // Handle Referral Commission
                if (profile.referred_by && !profile.referral_commission_paid && account.final_amount_paid > 0) {
                    const { data: settings } = await supabaseAdmin.from('payment_details').select('referral_commission_percentage').eq('id', 1).single();
                    const commPercent = settings?.referral_commission_percentage || 10;
                    const commission = Math.floor((account.final_amount_paid * commPercent) / 100);

                    if (commission > 0) {
                        const { data: referrer } = await supabaseAdmin.from('profiles').select('referral_balance').eq('id', profile.referred_by).single();
                        await supabaseAdmin.from('profiles').update({ referral_balance: (referrer?.referral_balance || 0) + commission }).eq('id', profile.referred_by);
                        await supabaseAdmin.from('profiles').update({ referral_commission_paid: true }).eq('id', profile.id);
                        await supabaseAdmin.from('referrals').insert({ referrer_id: profile.referred_by, referred_id: profile.id, commission_amount: commission, plan_name: account.plan_name });
                    }
                }

                // --- Hub Auto-Provisioning ---
                if (isKycDone || isPTP) {
                    const initialBalance = getBalanceFromPlanName(account.plan_name);
                    const apiKey = process.env.STOCKMINT_API_KEY;
                    if (apiKey && initialBalance > 0) {
                        const { count } = await supabaseAdmin.from('user_accounts').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('credentials_provided', true);
                        const username = generateStockmintUsername(profile.email, count || 0);
                        
                        await fetch('https://stockmint.io/api/users/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                            body: JSON.stringify({
                                fullName: profile.full_name, email: username, password: username,
                                initialBalance, accountClassification: account.account_classification, 
                                accountModel: isPTP ? 'passthenpay' : 'normal'
                            }),
                        }).then(async (res) => {
                            if (res.ok) {
                                await supabaseAdmin.from('user_accounts').update({
                                    credentials_provided: true, trading_username: username, trading_password: username, status: 'active'
                                }).eq('id', account.id);
                            }
                        }).catch(console.error);
                    }
                }
            }
        }
        
        revalidatePath('/welcome');
        return new NextResponse('success', { status: 200 });
    } catch (error) {
        return new NextResponse('Error', { status: 500 });
    }
}