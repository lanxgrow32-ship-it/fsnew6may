'use server';

import { generateLgPaySignature } from '@/lib/lg-pay';
import { randomBytes } from 'crypto';
import { headers } from 'next/headers';

interface PaymentState {
    error?: string | null;
    redirectUrl?: string | null;
}

export async function initiateLgPayPayment(prevState: PaymentState, formData: FormData): Promise<PaymentState> {
    const amount = formData.get('amount') as string;
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return { error: 'Please enter a valid amount.' };
    }

    const lgPayAppId = process.env.LG_PAY_APP_ID;
    const lgPayKey = process.env.LG_PAY_KEY;
    const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/lg-pay-webhook`;

    if (!lgPayAppId || !lgPayKey) {
        console.error("LG Pay credentials are not configured.");
        return { error: 'Payment gateway is not configured on the server.' };
    }

    const moneyInCents = Math.round(parsedAmount * 100);
    const order_sn = `FSTEST_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const ipHeader = headers().get('x-forwarded-for') ?? '127.0.0.1';
    const ip = ipHeader.split(',')[0].trim();

    const params: Record<string, string> = {
        app_id: lgPayAppId,
        trade_type: "INRUPI", // Updated as per direct provider instruction
        order_sn: order_sn,
        money: String(moneyInCents),
        notify_url: notifyUrl,
        ip: ip,
        remark: `Test Payment`,
    };

    const sign = generateLgPaySignature(params, lgPayKey);

    try {
        const response = await fetch('https://www.lg-pay.com/api/order/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ ...params, sign }),
        });
        const result = await response.json();

        if (result.status === 1 && result.data?.pay_url) {
            return { redirectUrl: result.data.pay_url };
        } else {
            console.error("LG-Pay API Error:", result);
            return { error: `Gateway Error: ${result.msg || 'Unknown error.'}` };
        }
    } catch (e: any) {
        console.error("LG-Pay fetch Error:", e);
        return { error: 'Failed to contact payment gateway. Please try again later.' };
    }
}
