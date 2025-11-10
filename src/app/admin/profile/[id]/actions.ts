
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const id = formData.get('id') as string;
  const is_approved = formData.get('is_approved') === 'on';
  const trading_username = formData.get('trading_username') as string;
  const trading_password = formData.get('trading_password') as string;
  const credentials_provided = formData.get('credentials_provided') === 'on';
  const kyc_status = formData.get('kyc_status') as string;

  // This is the data that will be sent to the webhook
  const updateData: any = {
    is_approved,
    kyc_status,
  };

  // Only include credential fields if they are being provided
  if (credentials_provided) {
    updateData.credentials_provided = true;
    updateData.trading_username = trading_username;
    updateData.trading_password = trading_password;
  } else {
    // If the switch is off, ensure we don't accidentally clear credentials
    // unless that's the desired behavior. For now, we only update if provided.
    // If you wanted to "un-provide" them, you'd handle that here.
  }

  // To prevent sending empty credentials, we only update them if the 'credentials_provided' toggle is on
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

  // Revalidate the dashboard path to show updated data
  revalidatePath('/admin/dashboard');
  revalidatePath(`/admin/profile/${id}`);
  revalidatePath('/welcome');

  return { error: null };
}
