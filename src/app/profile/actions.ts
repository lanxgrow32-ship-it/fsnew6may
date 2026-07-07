'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function changePassword(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to change your password.' };
  }

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirm_password') as string;

  if (!password || !confirmPassword) {
    return { error: 'Both password fields are required.' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Error changing password:", error);
    return { error: `Failed to change password: ${error.message}` };
  }
  
  revalidatePath('/profile');
  return { success: 'Your password has been changed successfully.', error: null };
}
