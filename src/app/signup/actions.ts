'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

/**
 * Validates a referral code against the database.
 */
export async function checkReferralCode(code: string) {
    if (!code) return { error: 'Empty code' };
    
    const { data: referrer, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .eq('referral_code', code.toUpperCase())
        .single();
    
    if (error || !referrer) return { error: 'Referral code not found.' };
    return { success: true, name: referrer.full_name };
}

export async function signup(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const mobileNumber = formData.get('mobile_number') as string;
  const referredByCode = formData.get('referred_by') as string | null;

  if (!email || !password || !fullName || !mobileNumber) {
    return { error: 'All fields are required.' };
  }

  // Next.js 15: cookies() is async, so createClient() returns a promise.
  const supabase = await createClient();

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
      // 2. Handle Referral Link
      let referrerId = null;
      if (referredByCode) {
          const { data: referrer } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('referral_code', referredByCode.toUpperCase())
            .single();
          
          if (referrer) referrerId = referrer.id;
      }

      // 3. Initialize Professional Profile
      let namePart = fullName.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4) || 'USER';
      const referralCode = `${namePart}-${user.id.substring(0, 4).toUpperCase()}`;

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            full_name: fullName,
            mobile_number: mobileNumber,
            referral_code: referralCode,
            is_approved: true, 
            referred_by: referrerId,
            wallet_balance: 0,
            referral_balance: 0,
            kyc_status: 'pending',
            account_type: 'standard'
        })
        .eq('id', user.id);
      
      if (profileError) {
          return { error: 'Profile sync failed. Please log in manually.' };
      }

      // 4. Trigger Welcome Webhook (v3.0 Fresh Start)
      const welcomeWebhook = process.env.MAKE_WELCOME_WEBHOOK_URL;
      if (welcomeWebhook) {
          fetch(welcomeWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  email: email,
                  full_name: fullName
              })
          }).catch(e => console.error('Welcome Webhook Failed:', e));
      }

      redirect('/welcome');
  }

  return { error: 'Registration failed.' };
}
