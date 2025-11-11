
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

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

  const { data: beforeUpdateData, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('is_approved, credentials_provided, referred_by, final_amount_paid')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching profile before update:', fetchError);
    // Don't block the update if this fails, but log it.
    // The main logic can proceed, but commission might need manual check if this fails.
  }
  
  const wasApproved = beforeUpdateData?.is_approved ?? false;
  const wasCredentialsProvided = beforeUpdateData?.credentials_provided ?? false;

  const updateData: any = {
    is_approved,
    kyc_status,
    is_breached,
    breach_reason,
  };

  if (credentials_provided) {
    updateData.credentials_provided = true;
    updateData.trading_username = trading_username;
    updateData.trading_password = trading_password;
  } else {
     updateData.credentials_provided = false;
  }

  if (credentials_provided && (!trading_username || !trading_password)) {
    return { error: "Trading username and password are required when 'Credentials Provided' is on." };
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating profile:', error);
    return { error: error.message };
  }

  // --- Start Webhook & Commission Logic ---

  // 1. Credentials Webhook
  if (credentials_provided && !wasCredentialsProvided) {
    const webhookUrl = 'https://hook.eu1.make.com/9xr9u0vlumza0rdk28vu2xeuxjcsc50i';
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                full_name: fullName,
                email: email,
                trading_username: trading_username,
                trading_password: trading_password 
            }),
        });
    } catch (webhookError) {
        console.error('Failed to trigger credentials webhook:', webhookError);
    }
  }

  // 2. Referral Commission Logic
  // Check if user is newly approved and was referred by someone
  if (is_approved && !wasApproved && beforeUpdateData?.referred_by) {
    const referrerId = beforeUpdateData.referred_by;
    const amountPaid = beforeUpdateData.final_amount_paid;

    if (amountPaid && amountPaid > 0) {
        // Get commission percentage from settings
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

            // Use an RPC function to safely update the referrer's balance
            const { error: rpcError } = await supabaseAdmin.rpc('add_to_balance', {
                user_id: referrerId,
                amount_to_add: commissionAmount
            });

            if (rpcError) {
                console.error('Error updating referrer balance:', rpcError);
            } else {
                // Create a record of the referral transaction
                const { error: referralError } = await supabaseAdmin
                    .from('referrals')
                    .insert({
                        referrer_id: referrerId,
                        referred_id: id,
                        commission_amount: commissionAmount,
                        is_commission_paid: true, // It's paid to their balance, not withdrawn yet
                    });
                if (referralError) {
                    console.error('Error creating referral record:', referralError);
                }
            }
        }
    }
  }


  // --- End Webhook & Commission Logic ---


  revalidatePath('/admin/dashboard');
  revalidatePath(`/admin/profile/${id}`);
  revalidatePath('/welcome');
  revalidatePath('/referrals');
  revalidatePath('/admin/payouts');

  return { error: null };
}
