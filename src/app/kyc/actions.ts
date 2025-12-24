
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

async function uploadFile(file: File, bucket: string, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  
  // Use supabaseAdmin to bypass RLS for storage writes
  const { data, error } = await supabaseAdmin.storage.from(bucket).upload(fileName, file);

  if (error) {
    console.error(`Error uploading ${bucket}:`, error);
    throw new Error(`Failed to upload ${bucket}.`);
  }

  // Use the admin client to get the public URL
  const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function saveKycStep(step: number, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to submit KYC.' };
  }

  let profileUpdateData: any = {};

  try {
    switch (step) {
      case 1: // Personal Information
        profileUpdateData = {
          mobile_number: formData.get('mobile_number') as string,
          pan_number: formData.get('pan_number') as string,
          aadhar_number: formData.get('aadhar_number') as string,
          city_state: formData.get('city_state') as string,
        };
        // Also update kyc_status to show verification is in progress for this step.
        profileUpdateData.kyc_status = 'pending_pan';
        break;

      case 2: // Document Upload
        const aadharFile = formData.get('aadhar_card') as File;
        const selfieFile = formData.get('selfie') as File;

        if (!aadharFile || !selfieFile || aadharFile.size === 0 || selfieFile.size === 0) {
          return { error: 'Aadhar and selfie uploads are required.' };
        }
        
        const [aadhar_card_url, selfie_url] = await Promise.all([
          uploadFile(aadharFile, 'kyc-documents', user.id),
          uploadFile(selfieFile, 'kyc-documents', user.id)
        ]);

        profileUpdateData = { aadhar_card_url, selfie_url };
        break;
      
      case 3: // Trading Background
        profileUpdateData = {
          traded_before: formData.get('traded_before') === 'yes',
          trading_experience: formData.get('trading_experience') as string,
          comments: formData.get('comments') as string,
          trading_style: formData.getAll('trading_style') as string[],
        };
        break;

      case 4: // Agreements
        profileUpdateData = {
          drawdown_rules_accepted: formData.get('drawdown_rules_accepted') === 'yes',
          risk_rules_understood: formData.get('risk_rules_understood') === 'yes',
          terms_accepted: formData.get('terms_accepted') === 'yes',
          kyc_status: 'submitted', // Final step sets status
        };
        break;

      default:
        return { error: 'Invalid KYC step.' };
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', user.id);

    if (updateError) {
      console.error(`Error updating profile on step ${step}:`, updateError);
      return { error: `Failed to save KYC data: ${updateError.message}` };
    }

    revalidatePath('/welcome');
    revalidatePath('/kyc');
    return { error: null, success: true };

  } catch (error: any) {
    return { error: error.message };
  }
}

export async function verifyPan(pan: string) {
  const username = process.env.EKYCHUB_USERNAME;
  const token = process.env.EKYCHUB_TOKEN;
  const orderId = randomUUID();

  if (!username || !token) {
    console.error('eKYCHub credentials are not set in environment variables.');
    return { status: 'Failure', message: 'Verification service is not configured.' };
  }

  const url = `https://connect.ekychub.in/v3/verification/pan_verification?username=${username}&token=${token}&pan=${pan}&orderid=${orderId}`;

  try {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      console.error('eKYCHub API request failed:', response.statusText);
      return { status: 'Failure', message: 'Could not connect to verification service.' };
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling eKYCHub API:', error);
    return { status: 'Failure', message: 'An unexpected error occurred during verification.' };
  }
}
