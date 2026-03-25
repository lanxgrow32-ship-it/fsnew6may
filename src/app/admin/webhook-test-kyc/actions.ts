'use server';

import { revalidatePath } from 'next/cache';

const KYC_WEBHOOK_URL = 'https://hook.eu1.make.com/581iv3qty0xgy61nmbvt8nuv8ulcvomi';

export async function sendKycTestWebhook(prevState: any, formData: FormData) {
  const userName = formData.get('user_name') as string;
  const email = formData.get('email') as string;

  if (!userName || !email) {
    return { error: 'Please provide a name and email.' };
  }

  const payload = {
    user_name: userName,
    email: email
  };

  try {
    const response = await fetch(KYC_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Webhook responded with status ${response.status}: ${errorBody}`);
    }

  } catch (error: any) {
    console.error('Failed to send KYC test webhook:', error);
    return { error: `Failed to send signal: ${error.message}` };
  }
  
  revalidatePath('/admin/webhook-test-kyc');
  return { success: 'Test signal sent successfully!' };
}
