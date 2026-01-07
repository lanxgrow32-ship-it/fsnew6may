
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

const ekycUsername = process.env.EKYCHUB_USERNAME;
const ekycToken = process.env.EKYCHUB_TOKEN;

// Helper function to parse plan name into account balance
function getBalanceFromPlanName(planName: string): number {
    if (!planName) return 0;

    const name = planName.toLowerCase();
    // Match numbers and units like K, L, Cr
    const match = name.match(/([\d,.]+)\s*(k|l|lakh|cr|crore)/);
    
    if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2];

        if (unit === 'k') {
            amount *= 1000;
        } else if (unit === 'l' || unit === 'lakh') {
            amount *= 100000;
        } else if (unit === 'cr' || unit === 'crore') {
            amount *= 10000000;
        }
        return amount;
    }
    
    // Fallback for names like "25000" without a unit
    const plainNumberMatch = name.match(/^[\d,.]+/);
    if (plainNumberMatch) {
        return parseFloat(plainNumberMatch[0].replace(/,/g, ''));
    }

    return 0;
}


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

async function uploadKycImage(base64: string, userId: string, type: 'aadhaar' | 'selfie-with-aadhaar') {
    // Remove data URI prefix if present
    const base64Data = base64.split(',')[1] || base64;
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${userId}-${type}-${Date.now()}.jpeg`;
    
    const { data, error } = await supabaseAdmin.storage.from('kyc-documents').upload(fileName, buffer, {
        contentType: 'image/jpeg',
    });

    if (error) {
        console.error(`Error uploading ${type} image:`, error);
        throw new Error(`Failed to upload ${type} image.`);
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
  let isFinalStep = false;

  try {
    switch (step) {
      case 1:
        const aadhaarPhoto = formData.get('aadhaar_photo') as string;
        if (aadhaarPhoto) {
            const aadhaarPhotoUrl = await uploadKycImage(aadhaarPhoto, user.id, 'aadhaar');
            profileUpdateData.selfie_url = aadhaarPhotoUrl; // This is the Aadhaar photo
            profileUpdateData.is_aadhaar_verified = true; // Mark as submitted for manual verification
        }
        break;

      case 2:
        const selfieWithAadhaarPhoto = formData.get('selfie_with_aadhaar_photo') as string;
        if (selfieWithAadhaarPhoto) {
            const selfieUrl = await uploadKycImage(selfieWithAadhaarPhoto, user.id, 'selfie-with-aadhaar');
            profileUpdateData.selfie_with_aadhaar_url = selfieUrl;
        }
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
        isFinalStep = true;
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
    
    // --- DATABASE UPDATE ---
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
    
    // --- AUTOMATION ON FINAL STEP ---
    if (isFinalStep && updatedProfile) {
        // Automatically create trading account
        const stockmintApiKey = process.env.STOCKMINT_API_KEY;
        const initialBalance = getBalanceFromPlanName(updatedProfile.plan_purchased || '');
        const tradingUsername = updatedProfile.email;
        const tradingPassword = updatedProfile.email; // Using email as password as planned

        // 1. StockMint Account Creation
        if (stockmintApiKey && initialBalance > 0) {
             try {
                const response = await fetch('https://stockmint.io/api/users/create', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-API-Key': stockmintApiKey,
                    },
                    body: JSON.stringify({ 
                        fullName: updatedProfile.full_name,
                        email: updatedProfile.email,
                        password: tradingPassword,
                        initialBalance: initialBalance,
                    }),
                });
                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`Failed to trigger StockMint webhook. Status: ${response.status}. Body: ${errorBody}`);
                    // Even if this fails, don't block the user. Log it for admin.
                }
            } catch (webhookError) {
                console.error('Failed to trigger StockMint webhook:', webhookError);
            }
        } else {
             console.error('StockMint API key not set or initial balance is zero. Aborting account creation.');
        }

        // 2. Update profile with credentials in our database
        await supabaseAdmin.from('profiles').update({
            credentials_provided: true,
            trading_username: tradingUsername,
            trading_password: tradingPassword
        }).eq('id', user.id);
    }
    
    revalidatePath('/kyc');
    revalidatePath('/welcome');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/admin/profile/${user.id}`);
    return { error: null, success: true, updatedProfile };


  } catch (error: any) {
    return { error: error.message };
  }
}
