
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

async function uploadBreachProof(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `breach-proof-${userId}-${Date.now()}.${fileExt}`;
  const { data, error } = await supabaseAdmin.storage.from('breach-proofs').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
  });

  if (error) {
    console.error('Error uploading breach proof:', error);
    throw new Error('Failed to upload breach proof image.');
  }

  const { data: urlData } = supabaseAdmin.storage.from('breach-proofs').getPublicUrl(data.path);
  return urlData.publicUrl;
}

async function uploadKycDocument(file: File, userId: string, type: 'aadhaar' | 'selfie-with-aadhaar') {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${type}-${Date.now()}.${fileExt}`;
  const { data, error } = await supabaseAdmin.storage.from('kyc-documents').upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
  });

  if (error) {
    console.error(`Error uploading ${type} image:`, error);
    throw new Error(`Failed to upload ${type} image.`);
  }

  const { data: urlData } = supabaseAdmin.storage.from('kyc-documents').getPublicUrl(data.path);
  return urlData.publicUrl;
}

function getAccountSizeText(planName: string): string {
    if (!planName) return 'N/A';
    const lowerPlanName = planName.toLowerCase();
    if (lowerPlanName.includes('1l')) return '1,00,000';
    if (lowerPlanName.includes('2l')) return '2,00,000';
    if (lowerPlanName.includes('5l')) return '5,00,000';
    if (lowerPlanName.includes('10l')) return '10,00,000';
    if (lowerPlanName.includes('25l')) return '25,00,000';
    if (lowerPlanName.includes('50l')) return '50,00,000';
    return 'N/A';
}

export async function updateProfile(formData: FormData) {
  const id = formData.get('id') as string;
  const fullName = formData.get('full_name') as string;
  const is_approved = formData.get('is_approved') === 'on';
  const trading_username = formData.get('trading_username') as string;
  const trading_password = formData.get('trading_password') as string;
  const kyc_status = formData.get('kyc_status') as string;
  const is_breached = formData.get('is_breached') === 'on';
  const breach_reason = formData.get('breach_reason') as string;
  const breach_image = formData.get('breach_image') as File;
  const account_classification = formData.get('account_classification') as string;

  const { data: before } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();
  const wasClassified = before?.account_classification;

  const updateData: any = {
    full_name: fullName,
    is_approved,
    kyc_status,
    is_breached,
    breach_reason,
    trading_username,
    trading_password,
    account_classification,
  };

  try {
      if (breach_image && breach_image.size > 0) {
        updateData.breach_image_url = await uploadBreachProof(breach_image, id);
      }
  } catch (e: any) { return { error: e.message }; }

  const { error } = await supabaseAdmin.from('profiles').update(updateData).eq('id', id);
  if (error) return { error: error.message };

  // Sync classification change with StockMint
  if (account_classification !== wasClassified && trading_username) {
      const apiKey = process.env.STOCKMINT_API_KEY;
      if (apiKey) {
          try {
              await fetch('https://stockmint.io/api/users/update', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                  body: JSON.stringify({ email: trading_username, accountClassification: account_classification }),
              });
          } catch (e) { console.error('StockMint Update Error:', e); }
      }
  }

  revalidatePath('/admin/dashboard');
  revalidatePath(`/admin/profile/${id}`);
  revalidatePath('/welcome');
  return { error: null };
}

export async function resetPassword(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const password = formData.get('password') as string;
  if (!password || password.length < 6) return { error: 'Min 6 characters required.' };
  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
  if (error) return { error: error.message };
  return { success: true, error: null };
}

export async function sendBreachRecoveryEmail(prevState: any, formData: FormData) {
  const userId = formData.get('userId') as string;
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
  if (!profile) return { error: 'User not found.' };

  const webhookUrl = process.env.MAKE_BREACH_RECOVERY_WEBHOOK_URL;
  if (!webhookUrl) return { error: 'Webhook not configured.' };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: profile.full_name, email: profile.email, discount_code: 'RETRY15', discount_percent: 15, expiry_days: 3 }),
    });
    return { success: 'Recovery email sent.' };
  } catch (e: any) { return { error: e.message }; }
}
