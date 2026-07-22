import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getAutoClassification, getBalanceFromPlanName, generateStockmintUsername } from '@/lib/plan-utils';

/**
 * Secure API for external portal to notify main app of a successful plan purchase.
 * POST /api/external/purchase
 * Follows SPEC v4.0
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { wallet_id, plan_name, amount, transaction_id, secret_key } = body;

        // Security Protocol
        const systemSecret = process.env.FS_GATEWAY_SECRET;
        if (!systemSecret || secret_key !== systemSecret) {
            return NextResponse.json({ error: 'Unauthorized Protocol Access' }, { status: 401 });
        }

        if (!wallet_id || !plan_name || !amount || !transaction_id) {
            return NextResponse.json({ error: 'Incomplete Payload' }, { status: 400 });
        }

        // 1. Locate Trader
        const { data: profile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('wallet_id', parseInt(wallet_id))
            .single();

        if (fetchError || !profile) {
            return NextResponse.json({ error: 'Trader ID Mismatch' }, { status: 404 });
        }

        const isPTP = plan_name.toLowerCase().includes('ptp') || plan_name.toLowerCase().includes('passthenpay');
        const classification = getAutoClassification(plan_name);
        const isKycVerified = profile.kyc_status === 'verified';

        const finalPrice = parseFloat(amount);

        // 2. Create the Account Record
        const { data: account, error: accountError } = await supabaseAdmin.from('user_accounts').insert({
            user_id: profile.id,
            plan_name,
            status: isPTP || isKycVerified ? 'active' : 'pending',
            is_approved: true,
            account_model: isPTP ? 'passthrupay' : 'normal',
            account_classification: classification,
            final_amount_paid: finalPrice,
            transaction_id: transaction_id
        }).select().single();

        if (accountError || !account) throw new Error('Account Provisioning Failure');

        // 3. REFERRAL ENGINE (v5.0): Credit if first real purchase
        // Safety lock check: Only credit if 'referral_commission_paid' is false.
        if (profile.referred_by && !profile.referral_commission_paid && finalPrice > 0) {
            const { data: settings } = await supabaseAdmin.from('payment_details').select('referral_commission_percentage').eq('id', 1).single();
            const commPercent = settings?.referral_commission_percentage || 10;
            const commissionAmount = Math.floor((finalPrice * commPercent) / 100);

            if (commissionAmount > 0) {
                const { data: referrer } = await supabaseAdmin.from('profiles').select('referral_balance').eq('id', profile.referred_by).single();
                const newBalance = (referrer?.referral_balance || 0) + commissionAmount;
                
                await supabaseAdmin.from('profiles').update({ referral_balance: newBalance }).eq('id', profile.referred_by);
                
                // SET LOCK
                await supabaseAdmin.from('profiles').update({ referral_commission_paid: true }).eq('id', profile.id);

                await supabaseAdmin.from('referrals').insert({
                    referrer_id: profile.referred_by,
                    referred_id: profile.id,
                    commission_amount: commissionAmount,
                    plan_name: plan_name
                });
                console.log(`[External API] Referral Credit Dispatched: ₹${commissionAmount}`);
            }
        }

        // 4. StockMint Hub Sync (SPEC v4.0)
        const stockmintApiKey = process.env.STOCKMINT_API_KEY;
        const initialBalance = getBalanceFromPlanName(plan_name);
        let stockmintUsername = profile.email;

        if (stockmintApiKey && initialBalance > 0) {
            try {
                const { count } = await supabaseAdmin.from('user_accounts').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('credentials_provided', true);
                stockmintUsername = generateStockmintUsername(profile.email, count || 0);

                const payload = { 
                    fullName: profile.full_name, 
                    email: stockmintUsername, 
                    password: stockmintUsername,
                    initialBalance, 
                    accountClassification: classification, 
                    accountModel: isPTP ? 'passthenpay' : 'normal'
                };

                const res = await fetch('https://stockmint.io/api/users/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    await supabaseAdmin.from('user_accounts').update({ 
                        credentials_provided: true, 
                        trading_username: stockmintUsername, 
                        trading_password: stockmintUsername, 
                        status: 'active' 
                    }).eq('id', account.id);
                } else {
                    const errTxt = await res.text();
                    console.error(`[External Purchase] StockMint API Error: ${res.status} - ${errTxt}`);
                }
            } catch (e) { console.error('StockMint Hub API Error:', e); }
        }

        // 5. Trigger Automation (v3.1 Purchase Webhook)
        const purchaseWebhook = process.env.MAKE_PURCHASE_WEBHOOK_URL;
        if (purchaseWebhook) {
            fetch(purchaseWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: profile.email,
                    full_name: profile.full_name,
                    plan_name: plan_name,
                    username: stockmintUsername,
                    password: stockmintUsername,
                    needsKyc: !isKycVerified && !isPTP
                })
            }).catch(e => console.error('Automation Hook Failed:', e));
        }

        revalidatePath('/welcome');
        revalidatePath('/admin/account-requests');
        revalidatePath('/referrals');
        return NextResponse.json({ success: true, account_id: account.id });

    } catch (error: any) {
        console.error('External Purchase Protocol Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}