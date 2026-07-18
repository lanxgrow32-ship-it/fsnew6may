
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function resetPasswordSubmit(prevState: any, formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirm_password') as string;

  if (!password || !confirmPassword) {
    return { error: 'Both fields are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const supabase = await createClient();

  // Establish the update using the session created by the recovery link
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error('[Reset Protocol] Failure:', error.message);
    return { error: error.message };
  }

  revalidatePath('/welcome');
  return { success: true };
}
