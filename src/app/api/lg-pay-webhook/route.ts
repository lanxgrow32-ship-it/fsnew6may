
import { NextRequest, NextResponse } from 'next/server';
import { generateLgPaySignature } from '@/lib/lg-pay';

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
            return new NextResponse('Invalid callback data', { status: 400 });
        }
        
        const lgPayKey = process.env.LG_PAY_KEY;
        if (!lgPayKey) {
            console.error('LG Pay Key not configured for webhook verification.');
            return new NextResponse('Internal Server Error', { status: 500 });
        }
        
        const expectedSign = generateLgPaySignature(data, lgPayKey);

        if (receivedSign !== expectedSign) {
            console.warn(`Webhook signature mismatch for order ${data.order_sn}.`);
            return new NextResponse('Invalid signature', { status: 403 });
        }

        if (data.status === '1') {
            // Payment is successful.
            // In a real app, you would find the order by `data.order_sn`
            // and update its status in your database.
            console.log(`Successfully received payment confirmation for order: ${data.order_sn}`);
        }
        
        // Acknowledge the webhook successfully
        return new NextResponse('ok', { status: 200 });

    } catch (error: any) {
        console.error('Error processing LG Pay webhook:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
