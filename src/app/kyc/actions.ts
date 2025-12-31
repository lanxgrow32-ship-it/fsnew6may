
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

const ekycUsername = process.env.EKYCHUB_USERNAME;
const ekycToken = process.env.EKYCHUB_TOKEN;


export async function createDigilockerUrl(documentType: 'AADHAAR' | 'PAN', redirectBackUrl: string) {
  const orderId = randomUUID();

  if (!ekycUsername || !ekycToken) {
    console.error('eKYCHub credentials are not set in environment variables.');
    return { error: 'Verification service is not configured on the server.' };
  }

  const endpoint = documentType === 'AADHAAR' 
    ? 'create_url_aadhaar' 
    : 'create_url_pan';
  
  const baseUrl = `https://connect.ekychub.in/v3/digilocker/${endpoint}`;
  
  const encodedRedirectUrl = encodeURIComponent(redirectBackUrl);

  const url = `${baseUrl}?username=${ekycUsername}&token=${ekycToken}&redirect_url=${encodedRedirectUrl}&orderid=${orderId}`;

  try {
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();

    if (data.status === 'Success' && data.url) {
      return { success: true, url: data.url, verification_id: data.verification_id, reference_id: data.reference_id };
    } else {
      console.error('eKYCHub API Error (JSON Response):', data);
      return { error: data.message || `Failed to create Digilocker URL from API. Status: ${response.status}` };
    }
  } catch (error) {
    console.error('Error calling createDigilockerUrl:', error);
    if (error instanceof Error) {
        // Distinguish between JSON parsing errors and other errors
        if (error.message.includes('invalid json')) {
             return { error: `Verification service returned an invalid response (not JSON). Check server logs for details. Status: ${(error as any).status}` };
        }
        return { error: `An unexpected error occurred: ${error.message}` };
    }
    return { error: 'An unexpected error occurred while contacting the verification service.' };
  }
}

export async function getVerifiedDocument(verification_id: string, reference_id: string, document_type: 'AADHAAR' | 'PAN') {
  const orderId = randomUUID();
  
  if (!ekycUsername || !ekycToken) {
    console.error('eKYCHub credentials are not set in environment variables.');
    return { error: 'Verification service is not configured on the server.' };
  }

  const baseUrl = `https://connect.ekychub.in/v3/digilocker/get_document`;
  
  const params = new URLSearchParams({
      username: ekycUsername,
      token: ekycToken,
      verification_id: verification_id,
      reference_id: reference_id,
      orderid: orderId,
      document_type: document_type,
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();

    if (data.status === 'Success') {
      return { data: data, error: null };
    } else {
      return { data: null, error: data.message || 'Failed to retrieve document.' };
    }
    
  } catch (error) {
    console.error('Error calling getDigilockerDocument:', error);
    if (error instanceof Error) {
        return { data: null, error: `An unexpected error occurred: ${error.message}` };
    }
    return { data: null, error: 'An unexpected error occurred during verification.' };
  }
}

async function uploadBase64Image(base64: string, bucket: string, userId: string) {
    const buffer = Buffer.from(base64, 'base64');
    const fileName = `${userId}-photo-${Date.now()}.jpeg`;
    
    const { data, error } = await supabaseAdmin.storage.from(bucket).upload(fileName, buffer, {
        contentType: 'image/jpeg',
    });

    if (error) {
        console.error(`Error uploading ${bucket}:`, error);
        throw new Error(`Failed to upload ${bucket}.`);
    }

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
    if (formData.has('document_type')) {
        // This is a Digilocker response
        const docType = formData.get('document_type') as string;
        const apiResponse = JSON.parse(formData.get('api_response') as string);
        const verificationId = formData.get('verification_id') as string;

        profileUpdateData.digilocker_verification_id = verificationId;

        if (docType === 'AADHAAR') {
            profileUpdateData.is_aadhaar_verified = true;
            profileUpdateData.aadhar_number = apiResponse.uid;
            if (apiResponse.photo_link) {
                 profileUpdateData.selfie_url = await uploadBase64Image(apiResponse.photo_link, 'kyc-documents', user.id);
            }
             if (apiResponse.address) {
                profileUpdateData.city_state = `${apiResponse.split_address?.dist}, ${apiResponse.split_address?.state}`;
            }
        }
        if (docType === 'PAN') {
            profileUpdateData.is_pan_verified = true;
            profileUpdateData.pan_number = apiResponse.pan_number;
        }

    } else {
        // This is a form step submission
        switch (step) {
          case 1:
            profileUpdateData = {
              mobile_number: formData.get('mobile_number') as string,
            };
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
              kyc_status: 'submitted', // Final step sets status
            };
            break;

          default:
            return { error: 'Invalid KYC step.' };
        }
    }

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

    revalidatePath('/welcome');
    revalidatePath('/kyc');
    return { error: null, success: true, updatedProfile };

  } catch (error: any) {
    return { error: error.message };
  }
}
