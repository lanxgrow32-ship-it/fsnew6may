'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const id = formData.get('id') as string;
  const is_approved = formData.get('is_approved') === 'on';
  const trading_username = formData.get('trading_username') as string;
  const trading_password = formData.get('trading_password') as string;
  const credentials_provided = formData.get('credentials_provided') === 'on';

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      is_approved,
      trading_username,
      trading_password,
      credentials_provided
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating profile:', error);
    return { error: error.message };
  }

  // Revalidate the dashboard path to show updated data
  revalidatePath('/admin/dashboard');
  revalidatePath(`/admin/profile/${id}`);

  return { error: null };
}
