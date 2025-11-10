
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

  const { data: beforeUpdateData, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('credentials_provided')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching profile before update:', fetchError);
    return { error: 'Could not verify user state before update.' };
  }
  
  const wasCredentialsProvided = beforeUpdateData.credentials_provided;

  const updateData: any = {
    is_approved,
    kyc_status,
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

  // --- Start Webhook Logic ---

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

  // --- End Webhook Logic ---


  revalidatePath('/admin/dashboard');
  revalidatePath(`/admin/profile/${id}`);
  revalidatePath('/welcome');

  return { error: null };
}
