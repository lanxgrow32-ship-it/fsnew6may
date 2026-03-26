'use server';

interface WebhookTestState {
  error?: string | null;
  success?: boolean;
}

export async function sendBreachRecoveryTestWebhook(prevState: WebhookTestState, formData: FormData): Promise<WebhookTestState> {
  const webhookUrl = process.env.MAKE_BREACH_RECOVERY_WEBHOOK_URL;

  if (!webhookUrl) {
    return { error: 'The Breach Recovery webhook URL is not configured on the server.' };
  }

  const payload = {
    first_name: 'Test User',
    email: 'test.user@example.com',
    discount_code: 'RETRY15',
    discount_percent: 15,
    expiry_days: 3
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
    console.error('Breach Recovery Webhook Test Error:', error);
    return { success: false, error: `Failed to send test signal: ${error.message}` };
  }
}
