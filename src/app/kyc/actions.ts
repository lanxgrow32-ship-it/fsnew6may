
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { unblockComplianceAccounts } from '@/app/welcome/actions';

export async function verifyPan(panNumber: string) {
  if (!panNumber) return { error: 'PAN number is required.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be logged in.' };
  
  const orderId = randomUUID();
  const url = `https://connect.ekychub.in/v3/verification/pan_verification?username=${process.env.EKYCHUB_USERNAME}&token=${process.env.EKYCHUB_TOKEN}&pan=${panNumber}&orderid=${orderId}`;

  try {
    const response = await fetch(url, { method: 'GET' });
    const apiResponse = await response.json();
    if (apiResponse.status === 'Success') {
      const { data: updatedProfile, error: updateError } = await supabase.from('profiles').update({ is_pan_verified: true, pan_number: apiResponse.pan, full_name: apiResponse.registered_name }).eq('id', user.id).select().single();
      if (updateError) throw new Error(updateError.message);
      revalidatePath('/kyc');
      return { success: true, data: apiResponse, updatedProfile };
    }
    return { error: apiResponse.message || 'Verification failed.' };
  } catch (error) { return { error: 'Server error.' }; }
}

async function uploadKycMedia(data: string | File, userId: string, type: string) {
    let buffer: Buffer;
    let mime: string;
    let ext: string;

    if (data instanceof File) {
        const arrayBuffer = await data.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        mime = data.type;
        ext = data.name.split('.').pop() || 'dat';
    } else {
        const base64Data = data.split(',')[1] || data;
        buffer = Buffer.from(base64Data, 'base64');
        mime = data.match(/^data:(.*);base64,/)?.[1] || 'application/octet-stream';
        ext = mime.includes('video') ? 'webm' : 'jpeg';
    }
    
    const bucket = type === 'video-kyc' ? 'kyc-videos' : 'kyc-documents';
    const fileName = `${userId}-${type}-${Date.now()}.${ext}`;
    
    const { data: uploadRes, error } = await supabaseAdmin.storage.from(bucket).upload(fileName, buffer, { contentType: mime, upsert: true });
    if (error) throw new Error(`Upload Failed: ${error.message}`);
    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(uploadRes.path);
    return urlData.publicUrl;
}

export async function saveKycStep(step: number, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Auth required.' };

  let profileUpdateData: any = {};
  let isFinalStep = false;

  try {
    switch (step) {
      case 1:
        const aadhaarPhoto = formData.get('aadhaar_photo') as string;
        if (aadhaarPhoto) profileUpdateData.selfie_url = await uploadKycMedia(aadhaarPhoto, user.id, 'aadhaar');
        break;
      case 2:
        const selfieWithAadhaarPhoto = formData.get('selfie_with_aadhaar_photo') as string;
        if (selfieWithAadhaarPhoto) profileUpdateData.selfie_with_aadhaar_url = await uploadKycMedia(selfieWithAadhaarPhoto, user.id, 'selfie-with-aadhaar');
        break;
      case 3:
        const videoFile = formData.get('video_kyc_file') as File;
        if (videoFile && videoFile.size > 0) profileUpdateData.video_kyc_url = await uploadKycMedia(videoFile, user.id, 'video-kyc');
        break;
      case 4:
        profileUpdateData = { traded_before: formData.get('traded_before') === 'yes', trading_experience: formData.get('trading_experience'), trading_style: formData.getAll('trading_style') };
        break;
      case 5:
        isFinalStep = true;
        profileUpdateData = { drawdown_rules_accepted: true, risk_rules_understood: true, terms_accepted: true, kyc_status: 'verified' };
        break;
      default: return { error: 'Invalid step.' };
    }
    
    const { data: updatedProfile, error: updateError } = await supabase.from('profiles').update(profileUpdateData).eq('id', user.id).select().single();
    if (updateError) return { error: updateError.message };
    
    // --- FINAL HANDSHAKE PROTOCOL (SPEC v12.0 Atomic Unblock) ---
    if (isFinalStep && updatedProfile) {
        console.log(`[KYC Sync] Finalizing identity for ${updatedProfile.email}. Restoring account access...`);
        // 1. Force release of all compliance-blocked accounts
        await unblockComplianceAccounts(user.id);

        // 2. Trigger Automation
        const kycWebhook = process.env.MAKE_KYC_VERIFIED_WEBHOOK_URL;
        if (kycWebhook) {
            fetch(kycWebhook, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    email: updatedProfile.email, 
                    full_name: updatedProfile.full_name 
                }) 
            }).catch(e => console.error("[KYC Sync] Webhook Failure:", e));
        }
    }
    
    revalidatePath('/kyc');
    revalidatePath('/welcome');
    revalidatePath(`/welcome/dashboard/${user.id}`);
    return { success: true };
  } catch (error: any) { 
      console.error("[KYC Sync] Step Save Failure:", error);
      return { error: error.message }; 
  }
}
