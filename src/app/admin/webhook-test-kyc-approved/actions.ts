'use server';

interface WebhookTestState {
  error?: string | null;
  success?: boolean;
}

export async function sendKycApprovedTestWebhook(prevState: WebhookTestState, formData: FormData): Promise<WebhookTestState> {
  const webhookUrl = 'https://hook.eu1.make.com/oxm026n9is2kxy7f6v8qjo36ipa57ahg';

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
