'use server';

interface WebhookTestState {
  error?: string | null;
  success?: boolean;
}

export async function sendWelcomeTestWebhook(prevState: WebhookTestState, formData: FormData): Promise<WebhookTestState> {
  const webhookUrl = process.env.MAKE_WELCOME_WEBHOOK_URL;

  if (!webhookUrl) {
    return { error: 'The Welcome webhook URL is not configured in your .env file.' };
  }

  const payload = {
    email: 'trader.test@example.com',
    full_name: 'Alex Trader',
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
    console.error('Welcome Webhook Test Error:', error);
    return { success: false, error: `Failed to send test signal: ${error.message}` };
  }
}
