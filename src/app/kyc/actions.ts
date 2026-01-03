
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

const ekycUsername = process.env.EKYCHUB_USERNAME;
const ekycToken = process.env.EKYCHUB_TOKEN;

export async function verifyPan(panNumber: string) {
  if (!panNumber) {
    return { error: 'PAN number is required.' };
  }

  if (!ekycUsername || !ekycToken) {
    console.error('eKYCHub credentials are not set in environment variables.');
    return { error: 'Verification service is not configured on the server.' };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in.' };
  }
  
  const orderId = randomUUID();
  const url = `https://connect.ekychub.in/v3/verification/pan_verification?username=${ekycUsername}&token=${ekycToken}&pan=${panNumber}&orderid=${orderId}`;

  try {
    const response = await fetch(url, { method: 'GET' });
    const apiResponse = await response.json();

    if (apiResponse.status === 'Success') {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ is_pan_verified: true, pan_number: apiResponse.pan, full_name: apiResponse.registered_name })
        .eq('id', user.id)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Failed to save PAN data to profile: ${updateError.message}`);
      }
      
      revalidatePath('/kyc');
      return { success: true, data: apiResponse, updatedProfile };
    } else {
      return { error: apiResponse.message || 'Failed to verify PAN. Please check the number and try again.' };
    }
  } catch (error) {
    console.error('Error calling verifyPan API:', error);
    return { error: 'An unexpected error occurred while contacting the verification service.' };
  }
}

async function uploadAadhaarImage(base64: string, userId: string) {
    // Remove data URI prefix if present
    const base64Data = base64.split(',')[1] || base64;
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${userId}-aadhaar-${Date.now()}.jpeg`;
    
    const { data, error } = await supabaseAdmin.storage.from('kyc-documents').upload(fileName, buffer, {
        contentType: 'image/jpeg',
    });

    if (error) {
        console.error(`Error uploading aadhaar image:`, error);
        throw new Error(`Failed to upload Aadhaar image.`);
    }

    const { data: urlData } = supabaseAdmin.storage.from('kyc-documents').getPublicUrl(data.path);
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
      case 1:
        const aadhaarPhoto = formData.get('aadhaar_photo') as string;
        if (aadhaarPhoto) {
            const aadhaarPhotoUrl = await uploadAadhaarImage(aadhaarPhoto, user.id);
            profileUpdateData.selfie_url = aadhaarPhotoUrl; // Assuming selfie_url stores the aadhaar photo
            profileUpdateData.is_aadhaar_verified = true; // We'll manually verify, but mark as submitted
        }
        break;

      case 2: // Trading Background
        profileUpdateData = {
          traded_before: formData.get('traded_before') === 'yes',
          trading_experience: formData.get('trading_experience') as string,
          comments: formData.get('comments') as string,
          trading_style: formData.getAll('trading_style') as string[],
        };
        break;

      case 3: // Agreements
        profileUpdateData = {
          drawdown_rules_accepted: formData.get('drawdown_rules_accepted') === 'yes',
          risk_rules_understood: formData.get('risk_rules_understood') === 'yes',
          terms_accepted: formData.get('terms_accepted') === 'yes',
          kyc_status: 'verified', // Final step sets status to verified
        };
        break;

      default:
        return { error: 'Invalid KYC step.' };
    }
    
    if (Object.keys(profileUpdateData).length > 0) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update(profileUpdateData)
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error(`Error updating profile on step ${step}:`, updateError);
          return { error: `Failed to save KYC data: ${updateError.message}` };
        }
        revalidatePath('/kyc');
        revalidatePath('/welcome');
        return { error: null, success: true, updatedProfile };
    }
    
    return { error: null, success: true };


  } catch (error: any) {
    return { error: error.message };
  }
}
