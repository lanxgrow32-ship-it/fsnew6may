'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function uploadQrCode(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `payout-qr-${userId}-${Date.now()}.${fileExt}`;
  const { data, error } = await supabaseAdmin.storage.from('payment-qrcodes').upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
  });

  if (error) {
    console.error('Error uploading QR code:', error);
    throw new Error('Failed to upload QR code.');
  }

  const { data: urlData } = supabaseAdmin.storage.from('payment-qrcodes').getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function updatePayoutDetails(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in.' };
  }

  const upiId = formData.get('payout_upi_id') as string;
  const qrCodeFile = formData.get('payout_qr_code') as File;

  if (!upiId) {
    return { error: 'UPI ID is required.' };
  }

  const updateData: { payout_upi_id: string; payout_qr_code_url?: string } = { payout_upi_id: upiId };

  try {
    if (qrCodeFile && qrCodeFile.size > 0) {
        updateData.payout_qr_code_url = await uploadQrCode(qrCodeFile, user.id);
    }
  } catch (error: any) {
    return { error: error.message };
  }
  
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (error) {
    console.error('Error updating payout details:', error);
    return { error: `Failed to save settings: ${error.message}` };
  }

  revalidatePath('/referrals');
  return { success: 'Payout details updated successfully.', error: null };
}


export async function requestPayout(amount: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to request a payout.' };
    }

    if (amount <= 0) {
        return { error: 'Payout amount must be greater than zero.' };
    }

    // Verify user has sufficient balance
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('referral_balance, payout_upi_id')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return { error: 'Could not retrieve your profile.' };
    }
    
    if (!profile.payout_upi_id) {
        return { error: 'You must set up your UPI payout details before requesting a withdrawal.' };
    }

    if (profile.referral_balance < amount) {
        return { error: 'Insufficient balance for this payout request.' };
    }

    // Create a payout request record
    const { error: requestError } = await supabase
        .from('payout_requests')
        .insert({
            user_id: user.id,
            amount: amount,
            status: 'pending',
            payout_details: {
                upi_id: profile.payout_upi_id,
            }
        });
    
    if (requestError) {
        return { error: `Failed to create payout request: ${requestError.message}` };
    }

    // Deduct amount from user's referral balance
    const newBalance = profile.referral_balance - amount;
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ referral_balance: newBalance })
        .eq('id', user.id);
    
    if (updateError) {
        console.error('CRITICAL: Failed to update user balance after creating payout request.', updateError);
        return { error: 'Your request was created, but we failed to update your balance. Please contact support.' };
    }
    
    revalidatePath('/referrals');
    revalidatePath('/admin/payouts');
    return { success: true };
}
