
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Handles the final password update during the recovery protocol.
 * Hardened to handle session synchronization issues in Next.js 15.
 */
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

  // 1. VERIFY SESSION: Ensure the browser and server are in sync
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error('[Reset Protocol] Session Mismatch:', sessionError);
    return { error: 'Your session has expired or the link is invalid. Please request a new recovery email.' };
  }

  // 2. UPDATE CREDENTIALS: Set the new password for the current session
  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    console.error('[Reset Protocol] Update Failure:', updateError.message);
    // Specifically handle the refresh token error with user-friendly language
    if (updateError.message.toLowerCase().includes('refresh token')) {
        return { error: 'Security protocol timeout. Please try clicking the reset link in your email again or request a new one.' };
    }
    return { error: updateError.message };
  }

  revalidatePath('/welcome');
  return { success: true };
}
