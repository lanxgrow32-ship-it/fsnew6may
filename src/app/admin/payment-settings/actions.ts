
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function uploadQrCode(file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `qr-code-${Date.now()}.${fileExt}`;
  const { data, error } = await supabaseAdmin.storage.from('payment-qrcodes').upload(fileName, file, {
      cacheControl: '3600',
      upsert: true, // Overwrite if a file with the same name exists, which it shouldn't with timestamp
  });

  if (error) {
    console.error('Error uploading QR code:', error);
    throw new Error('Failed to upload QR code.');
  }

  const { data: urlData } = supabaseAdmin.storage.from('payment-qrcodes').getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function updatePaymentSettings(prevState: any, formData: FormData) {
  const upiId = formData.get('upi_id') as string;
  const qrCodeFile = formData.get('qr_code') as File;
  const commissionPercentage = formData.get('referral_commission_percentage') as string;

  if (!upiId) {
    return { error: 'UPI ID is required.' };
  }
  
  const commission = parseFloat(commissionPercentage);
  if (isNaN(commission) || commission < 0 || commission > 100) {
    return { error: 'Commission percentage must be a number between 0 and 100.' };
  }

  let qrCodeUrl: string | undefined;

  // Only upload if a new file is provided
  if (qrCodeFile && qrCodeFile.size > 0) {
      try {
        qrCodeUrl = await uploadQrCode(qrCodeFile);
      } catch (error: any) {
        return { error: error.message };
      }
  }

  const updateData: { upi_id: string; qr_code_url?: string, referral_commission_percentage: number; } = { 
    upi_id: upiId,
    referral_commission_percentage: commission
  };
  if (qrCodeUrl) {
    updateData.qr_code_url = qrCodeUrl;
  }
  
  // We use upsert to create the record if it doesn't exist, or update it if it does.
  // We'll match on a known `id` of 1, so we're always working on the same single row.
  // Using supabaseAdmin to bypass RLS for this trusted server-side operation.
  const { error } = await supabaseAdmin
    .from('payment_details')
    .upsert({ id: 1, ...updateData }, { onConflict: 'id' });

  if (error) {
    console.error('Error updating payment settings:', error);
    return { error: `Failed to save settings: ${error.message}` };
  }

  revalidatePath('/admin/payment-settings');
  revalidatePath('/signup'); // Revalidate signup page to show new details
  return { success: 'Payment settings updated successfully.', error: null };
}
