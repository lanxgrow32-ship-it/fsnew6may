'use server';

import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

export async function createCompetitionUserAndSession(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const planType = formData.get('plan_type') as 'weekly' | 'monthly';
  const mobileNumber = formData.get('mobile_number') as string;

  if (!fullName || !email || !password || !planType || !mobileNumber) {
    return { error: 'All fields are required.' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  const supabase = createClient();
  
  // 1. Create the user in Supabase Auth first
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'user', // Default role
        // mobile_number is not part of auth user data
      },
    },
  });

  if (signUpError) {
    if (signUpError.message.includes('User already registered')) {
        return { error: 'A user with this email address already exists. Please log in.' };
    }
    return { error: signUpError.message };
  }

  if (user) {
    // 2. The DB trigger creates the profile, now we update it for competition specifics
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        account_type: 'competition',
        mobile_number: mobileNumber,
       })
      .eq('id', user.id);

    if (profileError) {
        // Attempt to clean up the created auth user if profile update fails
        // This makes the process more transactional
        await supabase.auth.admin.deleteUser(user.id);
        console.error('Failed to update profile for competition user, rolling back:', profileError.message);
        return { error: `Could not save registration details: ${profileError.message}` };
    }
    
    // 3. Create the temporary payment session record
    const sessionId = randomUUID();
    const { error: insertError } = await supabase
      .from('payment_sessions')
      .insert({
        id: sessionId,
        name: fullName,
        email,
        plain_password: password,
        plan_type: planType,
        mobile_number: mobileNumber,
      });

    if (insertError) {
      console.error('Error creating payment session:', insertError);
      return { error: `Could not initiate registration: ${insertError.message}` };
    }

    // 4. Return the redirect URL for the frontend
    const redirectUrl = `https://styfashion.in/exclusive-access-pqrstuv/?session_id=${sessionId}`;
    return { redirectUrl };
  }

  return { error: 'An unknown error occurred during signup.' };
}
