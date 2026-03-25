'use server';

interface WebhookState {
    error?: string | null;
    success?: boolean;
}

export async function sendTestWebhook(prevState: WebhookState, formData: FormData): Promise<WebhookState> {
    
    const webhookUrl = 'https://hook.eu1.make.com/lm20hgqefloy6n16a7dwrbpt1epfk49t';

    const testData = {
        user_name: "Test User",
        email: "test.user@example.com",
        plan_purchased: "5L 2-Step",
        account_size: "500000",
        order_sn: "FSTEST_123456789",
        final_amount_paid: "7999",
        payment_method: "UPI",
        datetime: new Date().toISOString()
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData),
        });

        if (response.ok) {
            // Make.com webhooks typically respond with "Accepted" text, not JSON.
            // We just need to know if the request was successful (status 200).
            return { success: true };
        } else {
            const errorText = await response.text();
            console.error('Make.com Webhook Error:', errorText);
            return { error: `The webhook endpoint responded with status ${response.status}: ${errorText}` };
        }
    } catch (error: any) {
        console.error('Failed to send test webhook:', error);
        return { error: `An unexpected network error occurred: ${error.message}` };
    }
}
