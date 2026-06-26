
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';

export async function signup(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const mobileNumber = formData.get('mobile_number') as string;

  if (!email || !password || !fullName || !mobileNumber) {
    return { error: 'All fields are required.' };
  }

  const supabase = createClient();

  // 1. Create User in Auth
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'user',
      },
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (user) {
      // 2. Update Profile (Immediate Approval for Dashboard Access)
      // Generate unique referral code
      let namePart = fullName.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4) || 'USER';
      const referralCode = `${namePart}-${user.id.substring(0, 4).toUpperCase()}`;

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            full_name: fullName,
            mobile_number: mobileNumber,
            referral_code: referralCode,
            is_approved: true, // Allow login instantly
        })
        .eq('id', user.id);
      
      if (profileError) {
          return { error: 'Failed to initialize profile. Please contact support.' };
      }

      // Auto login redirect
      redirect('/welcome');
  }

  return { error: 'Registration failed.' };
}
