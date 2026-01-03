
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

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

  const { data: beforeUpdateData, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('is_approved, credentials_provided, referred_by, final_amount_paid, plan_purchased, email, full_name')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching profile before update:', fetchError);
    return { error: `Failed to fetch user data: ${fetchError.message}` };
  }
  
  const wasApproved = beforeUpdateData?.is_approved ?? false;
  const wasCredentialsProvided = beforeUpdateData?.credentials_provided ?? false;

  const updateData: any = {
    is_approved,
    kyc_status,
    is_breached,
    breach_reason,
    credentials_provided,
    trading_username,
    trading_password,
  };
  
  try {
      if (breach_image && breach_image.size > 0) {
        updateData.breach_image_url = await uploadBreachProof(breach_image, id);
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

  // 1. StockMint Account Creation Webhook
  if (credentials_provided && !wasCredentialsProvided) {
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;
    if (!stockmintApiKey) {
        console.error('STOCKMINT_API_KEY is not set. Cannot create user on trading platform.');
    } else {
        const initialBalance = getBalanceFromPlanName(beforeUpdateData.plan_purchased || '');
        if (initialBalance <= 0) {
            console.error(`Could not determine initial balance from plan name: "${beforeUpdateData.plan_purchased}". Aborting StockMint account creation.`);
        } else {
            try {
                const response = await fetch('https://stockmint.io/api/users/create', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-API-Key': stockmintApiKey,
                    },
                    body: JSON.stringify({ 
                        fullName: beforeUpdateData.full_name,
                        email: beforeUpdateData.email,
                        password: beforeUpdateData.email, 
                        initialBalance: initialBalance,
                    }),
                });
                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`Failed to trigger StockMint user creation webhook. Status: ${response.status}. Body: ${errorBody}`);
                }
            } catch (webhookError) {
                console.error('Failed to trigger StockMint user creation webhook:', webhookError);
            }
        }
    }
  }


  // 2. Make.com Credentials Webhook
  if (credentials_provided && !wasCredentialsProvided) {
    const makeWebhookUrl = 'https://hook.eu1.make.com/9xr9u0vlumza0rdk28vu2xeuxjcsc50i';
    try {
        await fetch(makeWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                full_name: beforeUpdateData.full_name,
                email: beforeUpdateData.email,
                trading_username: trading_username,
                trading_password: trading_password 
            }),
        });
    } catch (webhookError) {
        console.error('Failed to trigger credentials webhook:', webhookError);
    }
  }

  // 3. Referral Commission Logic
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
