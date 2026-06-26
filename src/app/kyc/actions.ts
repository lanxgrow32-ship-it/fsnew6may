
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { format } from 'date-fns';


const ekycUsername = process.env.EKYCHUB_USERNAME;
const ekycToken = process.env.EKYCHUB_TOKEN;

// Helper function to parse plan name into account balance
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
    
    const plainNumberMatch = name.match(/^[\d,.]+/);
    if (plainNumberMatch) return parseFloat(plainNumberMatch[0].replace(/[,_]/g, ''));
    return 0;
}

// Helper to determine starting classification
function getAutoClassification(planName: string): string {
    const name = planName.toLowerCase();
    if (name.includes('instant')) return 'instant_live';
    if (name.includes('1-step')) return 'one_step_phase_1';
    if (name.includes('2-step')) return 'two_step_phase_1';
    return 'evaluation';
}

function getAccountSizeText(planName: string): string {
    if (!planName) return 'N/A';
    const lowerPlanName = planName.toLowerCase();

    if (lowerPlanName.includes('1l') || lowerPlanName.includes('1,00,000')) return '1,00,000';
    if (lowerPlanName.includes('2l') || lowerPlanName.includes('2,00,000')) return '2,00,000';
    if (lowerPlanName.includes('5l') || lowerPlanName.includes('5,00,000')) return '5,00,000';
    if (lowerPlanName.includes('10l') || lowerPlanName.includes('10,00,000')) return '10,00,000';
    if (lowerPlanName.includes('25l') || lowerPlanName.includes('25,00,000')) return '25,00,000';
    if (lowerPlanName.includes('50l') || lowerPlanName.includes('50,00_000')) return '50,00,000';
    
    const plainNumberMatch = lowerPlanName.match(/^[\d,._]+/);
    if (plainNumberMatch) {
        return parseFloat(plainNumberMatch[0].replace(/[,_]/g, '')).toLocaleString('en-IN', {useGrouping: false});
    }

    return 'N/A';
}


export async function verifyPan(panNumber: string) {
  if (!panNumber) return { error: 'PAN number is required.' };
  if (!ekycUsername || !ekycToken) return { error: 'Verification service is not configured.' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be logged in.' };
  
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
      
      if (updateError) throw new Error(updateError.message);
      revalidatePath('/kyc');
      return { success: true, data: apiResponse, updatedProfile };
    } else {
      return { error: apiResponse.message || 'Verification failed.' };
    }
  } catch (error) {
    return { error: 'Server error during PAN verification.' };
  }
}

async function uploadKycImage(base64: string, userId: string, type: 'aadhaar' | 'selfie-with-aadhaar') {
    const base64Data = base64.split(',')[1] || base64;
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${userId}-${type}-${Date.now()}.jpeg`;
    
    const { data, error } = await supabaseAdmin.storage.from('kyc-documents').upload(fileName, buffer, {
        contentType: 'image/jpeg',
    });

    if (error) throw new Error(`Failed to upload ${type} image.`);
    const { data: urlData } = supabaseAdmin.storage.from('kyc-documents').getPublicUrl(data.path);
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
        profileUpdateData = {
          traded_before: formData.get('traded_before') === 'yes',
          trading_experience: formData.get('trading_experience') as string,
          trading_style: formData.getAll('trading_style') as string[],
        };
        break;
      case 4:
        isFinalStep = true;
        profileUpdateData = {
          drawdown_rules_accepted: formData.get('drawdown_rules_accepted') === 'yes',
          risk_rules_understood: formData.get('risk_rules_understood') === 'yes',
          terms_accepted: formData.get('terms_accepted') === 'yes',
          kyc_status: 'verified',
        };
        break;
      default: return { error: 'Invalid step.' };
    }
    
    const { data: updatedProfile, error: updateError } = await supabase.from('profiles').update(profileUpdateData).eq('id', user.id).select().single();
    if (updateError) return { error: updateError.message };
    
    if (isFinalStep && updatedProfile) {
        const stockmintApiKey = process.env.STOCKMINT_API_KEY;
        const initialBalance = getBalanceFromPlanName(updatedProfile.plan_purchased || '');
        const classification = getAutoClassification(updatedProfile.plan_purchased || '');
        const isPTP = updatedProfile.account_model === 'passthrupay';

        // 1. StockMint Account Activation via POST /api/users/create
        if (stockmintApiKey && initialBalance > 0) {
             try {
                await fetch('https://stockmint.io/api/users/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                    body: JSON.stringify({ 
                        fullName: updatedProfile.full_name,
                        email: updatedProfile.email,
                        password: updatedProfile.email,
                        initialBalance: initialBalance,
                        accountClassification: classification,
                        accountModel: isPTP ? 'passthenpay' : 'normal'
                    }),
                });
            } catch (e) { console.error('StockMint creation failed:', e); }
        }

        // 2. Sync Database
        await supabaseAdmin.from('profiles').update({ credentials_provided: true, trading_username: updatedProfile.email, trading_password: updatedProfile.email }).eq('id', user.id);
        const { data: account } = await supabaseAdmin.from('user_accounts').select('id').eq('user_id', user.id).order('created_at', { ascending: true }).limit(1).single();
        if (account) {
            await supabaseAdmin.from('user_accounts').update({ credentials_provided: true, trading_username: updatedProfile.email, trading_password: updatedProfile.email, status: 'active', account_classification: classification }).eq('id', account.id);
        }

        // 3. Webhook Alert
        const kycApprovedWebhookUrl = process.env.MAKE_KYC_APPROVED_WEBHOOK_URL;
        if (kycApprovedWebhookUrl) {
            fetch(kycApprovedWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_name: updatedProfile.full_name,
                    email: updatedProfile.email,
                    plan_name: updatedProfile.plan_purchased,
                    activation_date: format(new Date(), 'dd MMMM yyyy'),
                }),
            }).catch(e => console.error(e));
        }
    }
    
    revalidatePath('/kyc');
    revalidatePath('/welcome');
    return { success: true, updatedProfile };
  } catch (error: any) {
    return { error: error.message };
  }
}
