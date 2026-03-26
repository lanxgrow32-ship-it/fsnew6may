'use server';

interface WebhookTestState {
  error?: string | null;
  success?: boolean;
}

export async function sendKycApprovedTestWebhook(prevState: WebhookTestState, formData: FormData): Promise<WebhookTestState> {
  const webhookUrl = process.env.MAKE_KYC_APPROVED_WEBHOOK_URL;

  if (!webhookUrl) {
    return { error: 'The KYC Approved webhook URL is not configured on the server.' };
  }

  const payload = {
    user_name: 'Test User',
    email: 'test.user@example.com',
    trading_username: 'test.user@example.com',
    trading_password: 'test.user@example.com',
    plan_name: '5L 1-Step Fast Track',
    account_size: '5,00,000',
    activation_date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }),
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
    console.error('Webhook Test Error:', error);
    return { success: false, error: `Failed to send test signal: ${error.message}` };
  }
}
