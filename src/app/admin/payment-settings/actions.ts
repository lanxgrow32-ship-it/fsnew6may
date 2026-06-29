
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function uploadImage(file: File, bucket: string, fileName: string) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
  });

  if (error) {
    console.error(`Error uploading to ${bucket}:`, error);
    throw new Error(`Failed to upload to ${bucket}.`);
  }

  const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function updatePaymentSettings(prevState: any, formData: FormData) {
  // Regular settings
  const upiId = formData.get('upi_id') as string;
  const upiQrCodeFile = formData.get('qr_code') as File;
  const commissionPercentage = formData.get('referral_commission_percentage') as string;
  const activeGateway = formData.get('active_gateway') as 'lgpay' | 'manual' | 'watchpay' | 'automated';
  const automatedMode = formData.get('automated_mode') as 'both' | 'lgpay' | 'watchpay';
  const isPtpEnabled = formData.get('is_ptp_enabled') === 'on';

  // Pay Later settings
  const payLaterUpiId = formData.get('pay_later_upi_id') as string;
  const payLaterQrCodeFile = formData.get('pay_later_qr_code') as File;

  // WatchPay settings
  const watchPayMerchantId = formData.get('watchpay_merchant_id') as string;
  const watchPayApiKey = formData.get('watchpay_api_key') as string;

  if (!['lgpay', 'manual', 'watchpay', 'automated'].includes(activeGateway)) {
      return { error: 'Invalid gateway selected.' };
  }
   if (activeGateway === 'manual' && !upiId) {
      return { error: 'UPI ID is required to enable the manual gateway.' };
  }
  if ((activeGateway === 'watchpay' || activeGateway === 'automated') && (!watchPayMerchantId || !watchPayApiKey)) {
      return { error: 'WatchPay Merchant ID and API Key are required to enable this gateway mode.' };
  }

  const commission = parseFloat(commissionPercentage);
  if (isNaN(commission) || commission < 0 || commission > 100) {
    return { error: 'Commission percentage must be a number between 0 and 100.' };
  }

  const updateData: { [key: string]: any } = { 
    upi_id: upiId,
    pay_later_upi_id: payLaterUpiId,
    referral_commission_percentage: commission,
    active_payment_gateway: activeGateway,
    automated_gateway_mode: automatedMode,
    watchpay_merchant_id: watchPayMerchantId,
    watchpay_api_key: watchPayApiKey,
    is_ptp_enabled: isPtpEnabled,
  };

  try {
    if (upiQrCodeFile && upiQrCodeFile.size > 0) {
      const fileName = `upi-qr-${Date.now()}`;
      updateData.qr_code_url = await uploadImage(upiQrCodeFile, 'payment-qrcodes', fileName);
    }
    if (payLaterQrCodeFile && payLaterQrCodeFile.size > 0) {
      const fileName = `pay-later-upi-qr-${Date.now()}`;
      updateData.pay_later_qr_code_url = await uploadImage(payLaterQrCodeFile, 'payment-qrcodes', fileName);
    }
  } catch (error: any) {
    return { error: error.message };
  }
  
  const { error } = await supabaseAdmin
    .from('payment_details')
    .upsert({ id: 1, ...updateData }, { onConflict: 'id' });

  if (error) {
    console.error('Error updating payment settings:', error);
    return { error: `Failed to save settings: ${error.message}` };
  }

  revalidatePath('/admin/payment-settings');
  revalidatePath('/signup');
  revalidatePath('/welcome');
  return { success: 'Payment settings updated successfully.', error: null };
}
