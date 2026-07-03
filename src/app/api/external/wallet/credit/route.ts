
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Secure API to credit wallet from external portal
 * POST /api/external/wallet/credit
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { wallet_id, amount, transaction_id, secret_key } = body;

        // Security Protocol
        const systemSecret = process.env.FS_GATEWAY_SECRET;
        if (!systemSecret || secret_key !== systemSecret) {
            return NextResponse.json({ error: 'Unauthorized Protocol Access' }, { status: 401 });
        }

        if (!wallet_id || !amount || !transaction_id) {
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

        // 2. Bonus Protocol: 5% if >= 10,000
        const depositAmount = parseFloat(amount);
        const bonus = depositAmount >= 10000 ? (depositAmount * 0.05) : 0;
        const totalToAdd = depositAmount + bonus;

        // 3. Persistent Ledger Entry
        const { error: txError } = await supabaseAdmin.from('wallet_transactions').insert({
            user_id: profile.id,
            amount: depositAmount,
            bonus_amount: bonus,
            type: 'deposit',
            status: 'completed',
            gateway_transaction_id: transaction_id,
            description: 'Portal Recharge (Cashfree)',
            processed_at: new Date().toISOString()
        });

        if (txError) throw new Error('Ledger Write Failure');

        // 4. Update Liquidity Balance
        const newBalance = (profile.wallet_balance || 0) + totalToAdd;
        await supabaseAdmin.from('profiles').update({ wallet_balance: newBalance }).eq('id', profile.id);

        // 5. Trigger Automation (Make.com)
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
            }).catch(e => console.error('Automation Hook Failed:', e));
        }

        revalidatePath('/welcome');
        return NextResponse.json({ success: true, balance: newBalance });

    } catch (error: any) {
        console.error('Credit Protocol Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
