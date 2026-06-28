'use server';

export async function sendWalletSuccessTestWebhook() {
  const webhookUrl = process.env.MAKE_WALLET_SUCCESS_WEBHOOK_URL;
  if (!webhookUrl) return { error: 'Webhook URL not configured.' };

  const payload = {
    email: 'trader.wallet@example.com',
    full_name: 'Test Trader',
    deposited_amount: 10000,
    bonus_amount: 500,
    new_balance: 10500
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed');
    return { success: true };
  } catch (e) {
    return { error: 'Failed to send signal.' };
  }
}