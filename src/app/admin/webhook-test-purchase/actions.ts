
'use server';

interface WebhookTestState {
  error?: string | null;
  success?: boolean;
}

export async function sendPurchaseTestWebhook(prevState: WebhookTestState, formData: FormData): Promise<WebhookTestState> {
  const webhookUrl = process.env.MAKE_PURCHASE_WEBHOOK_URL;

  if (!webhookUrl) {
    return { error: 'The Purchase webhook URL is not configured in your .env file.' };
  }

  // This is exactly what the "Intelligent Router" needs to see
  const payload = {
    email: 'trader.test@example.com',
    full_name: 'Alex Trader',
    plan_name: '5 Lakh Instant Funding',
    username: 'alex-trader@fundedstock.io',
    password: 'secure-password-123',
    needsKyc: true // This is the logic flag
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Purchase Webhook Test Error:', error);
    return { success: false, error: `Failed to send test signal: ${error.message}` };
  }
}
