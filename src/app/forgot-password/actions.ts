
'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function sendResetLink(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Please enter your email address.' };
  }

  const supabase = await createClient();
  const origin = (await headers()).get('origin');

  // TRIGGER RECOVERY PROTOCOL
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error('[Recovery Protocol] Error:', error.message);
    return { error: error.message };
  }

  return { success: 'Check your email. We have sent a secure recovery link to your inbox.' };
}
