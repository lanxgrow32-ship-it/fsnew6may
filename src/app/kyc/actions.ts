
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function uploadFile(file: File, bucket: string, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  
  // Use supabaseAdmin to bypass RLS for storage writes
  const { data, error } = await supabaseAdmin.storage.from(bucket).upload(fileName, file);

  if (error) {
    console.error(`Error uploading ${bucket}:`, error);
    throw new Error(`Failed to upload ${bucket}.`);
  }

  // Use the public (non-admin) client to get the public URL
  const supabase = createClient();
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
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
        break;

      case 2: // Document Upload
        const panFile = formData.get('pan_card') as File;
        const aadharFile = formData.get('aadhar_card') as File;
        const selfieFile = formData.get('selfie') as File;

        if (!panFile || !aadharFile || !selfieFile || panFile.size === 0 || aadharFile.size === 0 || selfieFile.size === 0) {
          return { error: 'All three document uploads are required.' };
        }
        
        const [pan_card_url, aadhar_card_url, selfie_url] = await Promise.all([
          uploadFile(panFile, 'kyc-documents', user.id),
          uploadFile(aadharFile, 'kyc-documents', user.id),
          uploadFile(selfieFile, 'kyc-documents', user.id)
        ]);

        profileUpdateData = { pan_card_url, aadhar_card_url, selfie_url };
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
