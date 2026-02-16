'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';

export async function preRegisterForCompetition(formData: FormData) {
  const name = formData.get('full_name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const planType = formData.get('plan_type') as 'weekly' | 'monthly';

  if (!name || !email || !password || !planType) {
    return { error: 'All fields are required.' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  try {
    // Store plain text password temporarily. The webhook will use it, and Supabase will hash it correctly.
    const sessionId = randomUUID();

    const { error: insertError } = await supabaseAdmin
      .from('payment_sessions')
      .insert({
        id: sessionId,
        name,
        email,
        password_hash: password, 
        plan_type: planType,
      });

    if (insertError) {
      console.error('Error creating payment session:', insertError);
      return { error: `Could not initiate registration: ${insertError.message}` };
    }

    const redirectUrl = `https://styfashion.in/exclusive-access-pqrstuv/?session_id=${sessionId}`;

    return { redirectUrl };
  } catch (e: any) {
    console.error('Pre-registration error:', e);
    return { error: 'An unexpected server error occurred.' };
  }
}
