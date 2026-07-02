'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

const ekycUsername = process.env.EKYCHUB_USERNAME;
const ekycToken = process.env.EKYCHUB_TOKEN;

function getBalanceFromPlanName(planName: string): number {
    if (!planName) return 0;
    const name = planName.toLowerCase();
    const match = name.match(/([\d,.]+)\s*(k|l|lakh|cr|crore)/);
    if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2];
        if (unit === 'k') amount *= 1000;
        else if (unit === 'l' || unit === 'lakh') amount *= 100000;
        else if (unit === 'cr' || unit === 'crore') amount *= 10000000;
        return amount;
    }
    return 0;
}

function getAutoClassification(planName: string): string {
    const name = planName.toLowerCase();
    if (name.includes('ptp') || name.includes('passthenpay')) return 'passthenpay';
    if (name.includes('instant')) return 'instant_live';
    if (name.includes('1-step')) return 'one_step_phase_1';
    if (name.includes('2-step')) return 'two_step_phase_1';
    return 'evaluation';
}

export async function verifyPan(panNumber: string) {
  if (!panNumber) return { error: 'PAN number is required.' };
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be logged in.' };
  
  const orderId = randomUUID();
  const url = `https://connect.ekychub.in/v3/verification/pan_verification?username=${ekycUsername}&token=${ekycToken}&pan=${panNumber}&orderid=${orderId}`;

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

async function uploadKycImage(base64: string, userId: string, type: 'aadhaar' | 'selfie-with-aadhaar' | 'video-kyc') {
    const base64Data = base64.split(',')[1] || base64;
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Determine bucket and file extension
    const bucket = type === 'video-kyc' ? 'kyc-videos' : 'kyc-documents';
    const ext = type === 'video-kyc' ? 'webm' : 'jpeg';
    const mime = type === 'video-kyc' ? 'video/webm' : 'image/jpeg';
    
    const fileName = `${userId}-${type}-${Date.now()}.${ext}`;
    const { data, error } = await supabaseAdmin.storage.from(bucket).upload(fileName, buffer, { contentType: mime });
    if (error) {
        console.error(`Storage Error (${type}):`, error);
        throw new Error(`Failed to upload ${type} file.`);
    }
    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
}

export async function saveKycStep(step: number, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required.' };

  let profileUpdateData: any = {};
  let isFinalStep = false;

  try {
    switch (step) {
      case 1:
        const aadhaarPhoto = formData.get('aadhaar_photo') as string;
        if (aadhaarPhoto) profileUpdateData.selfie_url = await uploadKycImage(aadhaarPhoto, user.id, 'aadhaar');
        break;
      case 2:
        const selfieWithAadhaarPhoto = formData.get('selfie_with_aadhaar_photo') as string;
        if (selfieWithAadhaarPhoto) profileUpdateData.selfie_with_aadhaar_url = await uploadKycImage(selfieWithAadhaarPhoto, user.id, 'selfie-with-aadhaar');
        break;
      case 3:
        const videoKycBase64 = formData.get('video_kyc') as string;
        if (videoKycBase64) profileUpdateData.video_kyc_url = await uploadKycImage(videoKycBase64, user.id, 'video-kyc');
        break;
      case 4:
        profileUpdateData = { traded_before: formData.get('traded_before') === 'yes', trading_experience: formData.get('trading_experience') as string, trading_style: formData.getAll('trading_style') as string[] };
        break;
      case 5:
        isFinalStep = true;
        profileUpdateData = { drawdown_rules_accepted: formData.get('drawdown_rules_accepted') === 'yes', risk_rules_understood: formData.get('risk_rules_understood') === 'yes', terms_accepted: formData.get('terms_accepted') === 'yes', kyc_status: 'verified' };
        break;
      default: return { error: 'Invalid step.' };
    }
    
    const { data: updatedProfile, error: updateError } = await supabase.from('profiles').update(profileUpdateData).eq('id', user.id).select().single();
    if (updateError) return { error: updateError.message };
    
    if (isFinalStep && updatedProfile) {
        // TRIGGER V3: Standalone KYC Success
        const kycWebhook = process.env.MAKE_KYC_VERIFIED_WEBHOOK_URL;
        if (kycWebhook) {
            fetch(kycWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: updatedProfile.email,
                    full_name: updatedProfile.full_name
                })
            }).catch(e => console.error('KYC success webhook failed:', e));
        }

        const stockmintApiKey = process.env.STOCKMINT_API_KEY;
        const initialBalance = getBalanceFromPlanName(updatedProfile.plan_purchased || '');
        const classification = getAutoClassification(updatedProfile.plan_purchased || '');

        if (stockmintApiKey && initialBalance > 0) {
             try {
                await fetch('https://stockmint.io/api/users/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                    body: JSON.stringify({ fullName: updatedProfile.full_name, email: updatedProfile.email, password: updatedProfile.email, initialBalance, accountClassification: classification, accountModel: 'normal' }),
                });
            } catch (e) { console.error('StockMint creation failed:', e); }
        }
    }
    
    revalidatePath('/kyc');
    revalidatePath('/welcome');
    return { success: true, updatedProfile };
  } catch (error: any) { return { error: error.message }; }
}
