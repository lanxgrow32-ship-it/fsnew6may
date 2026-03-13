
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
  const upiId = formData.get('upi_id') as string;
  const upiQrCodeFile = formData.get('qr_code') as File;
  const commissionPercentage = formData.get('referral_commission_percentage') as string;
  const is_upi_enabled = formData.get('is_upi_enabled') === 'on';

  const commission = parseFloat(commissionPercentage);
  if (isNaN(commission) || commission < 0 || commission > 100) {
    return { error: 'Commission percentage must be a number between 0 and 100.' };
  }

  const updateData: { [key: string]: any } = { 
    upi_id: upiId,
    referral_commission_percentage: commission,
    is_upi_enabled,
    // Nullify crypto fields
    usdt_to_inr_rate: null,
    crypto_wallet_address: null,
    is_crypto_enabled: false,
  };

  try {
    if (upiQrCodeFile && upiQrCodeFile.size > 0) {
      const fileName = `upi-qr-${Date.now()}`;
      updateData.qr_code_url = await uploadImage(upiQrCodeFile, 'payment-qrcodes', fileName);
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
  return { success: 'Payment settings updated successfully.', error: null };
}
