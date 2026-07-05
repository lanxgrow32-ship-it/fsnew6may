
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Secure API for external portal to notify main app of a successful plan purchase.
 * POST /api/external/purchase
 */

function getAutoClassification(planName: string): string {
    const name = planName.toLowerCase();
    if (name.includes('ptp') || name.includes('passthenpay')) return 'passthenpay';
    if (name.includes('instant')) return 'instant_live';
    if (name.includes('1-step')) return 'one_step_phase_1';
    if (name.includes('2-step')) return 'two_step_phase_1';
    return 'evaluation';
}

function getBalanceFromPlanName(planName: string): number {
    if (!planName) return 0;
    const name = planName.toLowerCase();
    
    // Check for units like K, L, Cr
    const match = name.match(/([\d,.]+)\s*(k|l|lakh|cr|crore)/);
    if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2];
        if (unit === 'k') amount *= 1000;
        else if (unit === 'l' || unit === 'lakh') amount *= 100000;
        else if (unit === 'cr' || unit === 'crore') amount *= 10000000;
        return amount;
    }
    
    // Check for plain numbers (e.g., 100000)
    const plainNumberMatch = name.match(/^[\d,.]+/);
    if (plainNumberMatch) {
        return parseFloat(plainNumberMatch[0].replace(/,/g, ''));
    }
    
    return 0;
}

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

        const isPTP = plan_name.toLowerCase().includes('ptp');
        const classification = getAutoClassification(plan_name);
        const isKycVerified = profile.kyc_status === 'verified';

        // 2. Create the Account Request
        const { data: account, error: accountError } = await supabaseAdmin.from('user_accounts').insert({
            user_id: profile.id,
            plan_name,
            status: isPTP || isKycVerified ? 'active' : 'pending',
            is_approved: true,
            account_model: isPTP ? 'passthrupay' : 'normal',
            account_classification: classification,
            final_amount_paid: parseFloat(amount),
            transaction_id: transaction_id
        }).select().single();

        if (accountError || !account) throw new Error('Account Provisioning Failure');

        // 3. StockMint Hub Sync
        const stockmintApiKey = process.env.STOCKMINT_API_KEY;
        const initialBalance = getBalanceFromPlanName(plan_name);
        let stockmintUsername = profile.email;

        if (stockmintApiKey && initialBalance > 0) {
            try {
                const { count } = await supabaseAdmin.from('user_accounts').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('credentials_provided', true);
                const versionSuffix = count && count > 0 ? `-ac${count + 1}` : '';
                const [baseEmail, domain] = profile.email.split('@');
                stockmintUsername = `${baseEmail}${versionSuffix}@${domain}`;

                const res = await fetch('https://stockmint.io/api/users/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                    body: JSON.stringify({ 
                        fullName: profile.full_name, email: stockmintUsername, password: stockmintUsername,
                        initialBalance, accountClassification: classification, accountModel: isPTP ? 'passthenpay' : 'normal'
                    }),
                });

                if (res.ok) {
                    await supabaseAdmin.from('user_accounts').update({ 
                        credentials_provided: true, 
                        trading_username: stockmintUsername, 
                        trading_password: stockmintUsername, 
                        status: 'active' 
                    }).eq('id', account.id);
                }
            } catch (e) { console.error('StockMint Hub API Error:', e); }
        }

        // 4. Trigger Automation (v3.1 Purchase Webhook)
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
        return NextResponse.json({ success: true, account_id: account.id });

    } catch (error: any) {
        console.error('External Purchase Protocol Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
