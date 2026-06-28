
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function uploadKycImage(file: File, userId: string, type: string) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${userId}-${type}-${Date.now()}.jpeg`;
    const { data, error } = await supabaseAdmin.storage.from('kyc-documents').upload(fileName, buffer, { contentType: file.type });
    if (error) throw new Error(`Failed to upload ${type} image.`);
    const { data: urlData } = supabaseAdmin.storage.from('kyc-documents').getPublicUrl(data.path);
    return urlData.publicUrl;
}

export async function manualVerifyKyc(formData: FormData) {
  const userId = formData.get('id') as string;
  const aadhaarFile = formData.get('aadhaar_photo') as File;
  const selfieFile = formData.get('selfie_photo') as File;

  if (!userId || !aadhaarFile || !selfieFile) return { error: 'Incomplete documents.' };

  try {
    const aadhaarUrl = await uploadKycImage(aadhaarFile, userId, 'aadhaar_manual');
    const selfieUrl = await uploadKycImage(selfieFile, userId, 'selfie_manual');

    const { data: profile, error: updateError } = await supabaseAdmin.from('profiles').update({ 
        kyc_status: 'verified', selfie_url: aadhaarUrl, selfie_with_aadhaar_url: selfieUrl,
        drawdown_rules_accepted: true, risk_rules_understood: true, terms_accepted: true
    }).eq('id', userId).select().single();
    
    if (updateError || !profile) throw new Error("Database failed.");

    // Email Trigger: Standalone KYC Verified
    const kycWebhook = process.env.MAKE_KYC_VERIFIED_WEBHOOK_URL;
    if (kycWebhook) {
        fetch(kycWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: profile.email, full_name: profile.full_name })
        }).catch(e => console.error(e));
    }

    revalidatePath('/support-agent/chat');
    revalidatePath('/welcome');
    return { success: true };
  } catch (error: any) { return { error: error.message }; }
}
