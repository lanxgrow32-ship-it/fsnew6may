'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'user', // All new users default to 'user'
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Supabase sends a confirmation email. The user profile is created by the trigger.
  return { error: null };
}
