'use server';

export async function sendReceiptTestWebhook() {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) return { error: 'Webhook URL not configured.' };

  const payload = {
    user_name: 'Test Trader',
    email: 'trader.receipt@example.com',
    order_sn: 'FS-TEST-999',
    plan_purchased: '10 Lakh Standard Evaluation',
    account_size: '10,00,000',
    final_amount_paid: '12999',
    payment_method: 'Manual/Direct',
    datetime: new Date().toLocaleString(),
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