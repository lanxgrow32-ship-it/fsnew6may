
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signupAndCreateOrder(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const planPurchased = formData.get('plan_purchased') as string;
  const referralCode = formData.get('referral_code') as string | null;
  const mobileNumber = formData.get('mobile_number') as string;
  const paymentMethod = formData.get('payment_method') as 'upi' | 'crypto';
  const cryptoTransactionHash = formData.get('crypto_transaction_hash') as string | null;

  const planPrice = parseFloat(formData.get('plan_price') as string);
  const couponCode = formData.get('coupon_code') as string;
  const discountAmount = parseFloat(formData.get('discount_amount') as string);
  const finalAmountPaid = parseFloat(formData.get('final_amount_paid') as string);
  
  if (!mobileNumber) {
    return { error: 'Mobile number is required.' };
  }


  const supabase = createClient();
  
  // 1. Check if user already exists
  const { data: existingUser, error: lookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    return { error: 'A user with this email address already exists.' };
  }

  // Find the referrer user ID if a referral code was provided
  let referrerId: string | null = null;
  if (referralCode) {
    const { data: referrerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode.trim().toUpperCase())
      .single();
    
    if (referrerProfile) {
      referrerId = referrerProfile.id;
    } else {
        return { error: 'The entered referral code is not valid. Please remove it or enter a valid one.' };
    }
  }

  // 2. Get payment settings to decide if user should be hidden
  const { data: paymentSettings, error: settingsError } = await supabaseAdmin
        .from('payment_details')
        .select('active_payment_url, primary_payment_url, secondary_payment_url')
        .eq('id', 1)
        .single();
        
  if (settingsError || !paymentSettings) {
      console.error('CRITICAL: Could not fetch payment gateway settings during signup.');
      return { error: 'Payment gateway is not configured on the server. Cannot proceed.'};
  }

  const isHiddenUser = paymentSettings.active_payment_url === 'secondary';


  // 3. Create the user in Supabase Auth
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'user',
        mobile_number: mobileNumber,
      },
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (user) {
    const profileData: any = { 
        plan_purchased: planPurchased,
        is_approved: false, // All signups start as not approved
        plan_price: planPrice,
        coupon_code: couponCode,
        discount_amount: discountAmount,
        final_amount_paid: finalAmountPaid,
        mobile_number: mobileNumber,
        crypto_transaction_hash: paymentMethod === 'crypto' ? cryptoTransactionHash : null,
        is_hidden: isHiddenUser,
    };
    
    if (referrerId) {
        profileData.referred_by = referrerId;
    }
    
    const orderId = user.id; 

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id);

    if (profileError) {
      console.error('Failed to update profile:', profileError.message);
      return { error: `Could not save registration details: ${profileError.message}` };
    }
    
    revalidatePath('/admin/dashboard');

    if (paymentMethod === 'upi') {
        
        const baseUrl = paymentSettings.active_payment_url === 'secondary' 
            ? paymentSettings.secondary_payment_url
            : paymentSettings.primary_payment_url;
            
        if (!baseUrl) {
             console.error('Active payment URL is not set in admin settings.');
             return { error: 'Payment gateway is not properly configured. Please contact support.'};
        }

        const redirectUrl = new URL(baseUrl);
        redirectUrl.searchParams.set('user_id', user.id);
        redirectUrl.searchParams.set('plan_name', planPurchased);
        redirectUrl.searchParams.set('amount', String(finalAmountPaid));
        redirectUrl.searchParams.set('redirect_url', `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?order_id=${user.id}`);


        return { success: true, payment_url: redirectUrl.toString(), orderId: orderId };

    } else { // Crypto payment
        // For crypto, we don't redirect to a payment gateway. The user has manually paid.
        // We just return a success state to redirect them to the success page.
        return { success: true, orderId: orderId };
    }
  }

  return { error: 'An unknown error occurred during signup.' };
}


export async function validateCoupon(code: string) {
  if (!code) {
    return { error: 'Coupon code cannot be empty.' };
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('coupons')
    .select('discount_value')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) {
    return { error: 'Invalid or expired coupon code.' };
  }

  return { discount: data.discount_value };
}

export async function validateReferralCode(code: string) {
  if (!code) {
    return { error: 'Referral code cannot be empty.' };
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', code.trim().toUpperCase())
    .single();

  if (error || !data) {
    return { error: 'Invalid referral code.' };
  }

  return { success: true };
}
