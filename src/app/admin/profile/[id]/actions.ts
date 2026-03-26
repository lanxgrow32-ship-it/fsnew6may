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
        return parseFloat(plainNumberMatch[0].replace(/[,_]/g, ''));
    }

    return 0;
}

// Helper function to get account size text from plan name
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


export async function updateProfile(formData: FormData) {
  const id = formData.get('id') as string;
  const fullName = formData.get('full_name') as string;
  const email = formData.get('email') as string;
  const is_approved = formData.get('is_approved') === 'on';
  const trading_username = formData.get('trading_username') as string;
  const trading_password = formData.get('trading_password') as string;
  const credentials_provided = formData.get('credentials_provided') === 'on';
  const kyc_status = formData.get('kyc_status') as string;
  const is_breached = formData.get('is_breached') === 'on';
  const breach_reason = formData.get('breach_reason') as string;
  const breach_image = formData.get('breach_image') as File;
  const admin_aadhaar_photo = formData.get('admin_aadhaar_photo') as File;
  const admin_selfie_with_aadhaar = formData.get('admin_selfie_with_aadhaar') as File;

  const { data: beforeUpdateData, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('is_approved, credentials_provided, referred_by, final_amount_paid, plan_purchased, email, full_name, kyc_status, is_hidden, created_at, order_sn, transaction_id')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching profile before update:', fetchError);
    return { error: `Failed to fetch user data: ${fetchError.message}` };
  }
  
  const wasApproved = beforeUpdateData?.is_approved ?? false;
  const wasKycVerified = beforeUpdateData?.kyc_status === 'verified';

  const updateData: any = {
    is_approved,
    kyc_status,
    is_breached,
    breach_reason,
    // These are now set automatically, but an admin can override them.
    credentials_provided,
    trading_username,
    trading_password,
  };
  
  try {
      if (breach_image && breach_image.size > 0) {
        updateData.breach_image_url = await uploadBreachProof(breach_image, id);
      }
      if (admin_aadhaar_photo && admin_aadhaar_photo.size > 0) {
        updateData.selfie_url = await uploadKycDocument(admin_aadhaar_photo, id, 'aadhaar');
      }
      if (admin_selfie_with_aadhaar && admin_selfie_with_aadhaar.size > 0) {
          updateData.selfie_with_aadhaar_url = await uploadKycDocument(admin_selfie_with_aadhaar, id, 'selfie-with-aadhaar');
      }
  } catch (uploadError: any) {
      return { error: uploadError.message };
  }


  const { error } = await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating profile:', error);
    return { error: error.message };
  }

  // --- Start Webhook & Automation Logic ---
  // Trigger "Payment Confirmed" & "KYC Reminder" Webhooks
  if (is_approved && !wasApproved && beforeUpdateData) {
      const paymentWebhookUrl = process.env.MAKE_WEBHOOK_URL;
      const kycWebhookUrl = process.env.MAKE_KYC_WEBHOOK_URL;

      // --- 1. Payment Confirmation Webhook ---
      if (paymentWebhookUrl) {
          try {
              const account_size_text = getAccountSizeText(beforeUpdateData.plan_purchased);

              const payload = {
                  user_name: beforeUpdateData.full_name,
                  email: beforeUpdateData.email,
                  order_sn: beforeUpdateData.order_sn || beforeUpdateData.transaction_id || 'N/A',
                  plan_purchased: beforeUpdateData.plan_purchased,
                  account_size: account_size_text,
                  final_amount_paid: beforeUpdateData.final_amount_paid,
                  payment_method: 'Online / Manual',
                  datetime: format(new Date(beforeUpdateData.created_at), 'dd-MM-yyyy HH:mm:ss'),
              };
              
              fetch(paymentWebhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
              }).catch(e => console.error("Payment webhook failed:", e));

          } catch (webhookError: any) {
              console.error("Failed to construct or send Make.com payment webhook:", webhookError.message);
          }
      }
      
      // --- 2. KYC Reminder Webhook ---
      if (kycWebhookUrl) {
          try {
              const kycPayload = {
                  user_name: beforeUpdateData.full_name,
                  email: beforeUpdateData.email
              };
              
              fetch(kycWebhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(kycPayload),
              }).catch(e => console.error("KYC webhook failed:", e));

          } catch (webhookError: any) {
              console.error("Failed to construct or send Make.com KYC webhook:", webhookError.message);
          }
      }
  }


  // Manual admin override for KYC verification
  if (kyc_status === 'verified' && !wasKycVerified) {
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;
    let finalTradingUsername = trading_username;
    let finalTradingPassword = trading_password;

    if (!finalTradingUsername) {
        finalTradingUsername = beforeUpdateData.email;
        finalTradingPassword = beforeUpdateData.email; // Use email as password if not provided
    }
    
    if (!stockmintApiKey) {
        console.error('AUTOMATION SKIPPED: StockMint API Key is not set.');
    } else {
        const initialBalance = getBalanceFromPlanName(beforeUpdateData.plan_purchased || '');
        
        if (initialBalance > 0) {
            try {
                const response = await fetch('https://stockmint.io/api/users/create', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-API-Key': stockmintApiKey,
                    },
                    body: JSON.stringify({ 
                        fullName: beforeUpdateData.full_name,
                        email: finalTradingUsername, // Use the final username
                        password: finalTradingPassword, // Use the final password
                        initialBalance: initialBalance,
                        isHidden: beforeUpdateData.is_hidden || false,
                    }),
                });
                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`Failed to trigger StockMint user creation. Status: ${response.status}. Body: ${errorBody}`);
                }
            } catch (apiError) {
                console.error('Failed to call StockMint user creation API:', apiError);
            }
            
            // Ensure credentials are saved in our DB
            await supabaseAdmin.from('profiles').update({
                credentials_provided: true,
                trading_username: finalTradingUsername,
                trading_password: finalTradingPassword
            }).eq('id', id);

        } else {
             console.error(`Could not determine initial balance from plan name: "${beforeUpdateData.plan_purchased}". Aborting StockMint account creation.`);
        }
    }
    
     // --- 3. KYC Approved Webhook ---
    const kycApprovedWebhookUrl = process.env.MAKE_KYC_APPROVED_WEBHOOK_URL;
    if (kycApprovedWebhookUrl) {
        try {
            const account_size_text = getAccountSizeText(beforeUpdateData.plan_purchased);
            const kycApprovedPayload = {
                user_name: beforeUpdateData.full_name,
                email: beforeUpdateData.email,
                trading_username: finalTradingUsername,
                trading_password: finalTradingPassword,
                plan_name: beforeUpdateData.plan_purchased,
                account_size: account_size_text,
                activation_date: format(new Date(), 'dd MMMM yyyy'),
            };

            fetch(kycApprovedWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kycApprovedPayload),
            }).catch(e => console.error("KYC Approved webhook failed:", e));

        } catch(webhookError: any) {
            console.error("Failed to construct or send KYC Approved webhook:", webhookError.message);
        }
    }
  }


  // Referral Commission Logic (triggered on first payment approval)
  if (is_approved && !wasApproved && beforeUpdateData?.referred_by) {
    const referrerId = beforeUpdateData.referred_by;
    const amountPaid = beforeUpdateData.final_amount_paid;

    if (amountPaid && amountPaid > 0) {
        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('payment_details')
            .select('referral_commission_percentage')
            .eq('id', 1)
            .single();
        
        if (settingsError || !settings) {
            console.error('Could not fetch referral commission setting:', settingsError);
        } else {
            const commissionPercentage = settings.referral_commission_percentage;
            const commissionAmount = (amountPaid * commissionPercentage) / 100;

            const { error: rpcError } = await supabaseAdmin.rpc('add_to_balance', {
                user_id: referrerId,
                amount_to_add: commissionAmount
            });

            if (rpcError) {
                console.error('Error updating referrer balance:', rpcError);
            } else {
                const { error: referralError } = await supabaseAdmin
                    .from('referrals')
                    .insert({
                        referrer_id: referrerId,
                        referred_id: id,
                        commission_amount: commissionAmount,
                        is_commission_paid: true,
                    });
                if (referralError) {
                    console.error('Error creating referral record:', referralError);
                }
            }
        }
    }
  }

  // --- End Webhook & Automation Logic ---


  revalidatePath('/admin/dashboard');
  revalidatePath(`/admin/profile/${id}`);
  revalidatePath('/welcome');
  revalidatePath('/referrals');
  revalidatePath('/admin/payouts');

  return { error: null };
}

export async function resetPassword(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const password = formData.get('password') as string;

  if (!password) {
    return { error: 'Password cannot be empty.' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    id,
    { password: password }
  );

  if (authError) {
    console.error("Error resetting password:", authError);
    return { error: `Failed to reset password: ${authError.message}` };
  }

  return { success: true, error: null };
}

export async function sendBreachRecoveryEmail(prevState: any, formData: FormData) {
  const userId = formData.get('userId') as string;

  if (!userId) {
    return { error: 'User ID is missing.' };
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .single();
  
  if (error || !profile) {
    return { error: 'Could not find the user profile.' };
  }

  const webhookUrl = process.env.MAKE_BREACH_RECOVERY_WEBHOOK_URL;
  if (!webhookUrl) {
    return { error: 'The breach recovery webhook is not configured on the server.' };
  }

  const payload = {
    first_name: profile.full_name,
    email: profile.email,
    discount_code: 'RETRY15',
    discount_percent: 15,
    expiry_days: 3
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }

    return { success: 'Breach recovery email has been sent successfully!' };
  } catch (e: any) {
    console.error("Breach recovery webhook error:", e);
    return { error: `Failed to send email: ${e.message}` };
  }
}
