'use server';

interface WebhookTestState {
  error?: string | null;
  success?: boolean;
}

export async function sendPurchaseTestWebhook(state: any, formData: FormData): Promise<WebhookTestState> {
  const webhookUrl = process.env.MAKE_PURCHASE_WEBHOOK_URL;
  const needsKyc = formData.get('needsKyc') === 'true';

  if (!webhookUrl) {
    return { error: 'The Purchase webhook URL is not configured in your .env file.' };
  }

  const payload = {
    email: 'trader.test@example.com',
    full_name: 'Alex Trader',
    plan_name: '10 Lakh Standard Evaluation',
    username: 'alex-trader@fundedstock.io',
    password: 'secure-password-123',
    needsKyc: needsKyc
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
