
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function signupAndCreateOrder(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const planPurchased = formData.get('plan_purchased') as string;
  const referralCode = formData.get('referral_code') as string | null;
  const mobileNumber = formData.get('mobile_number') as string;
  const address = formData.get('address') as string;

  const planPrice = parseFloat(formData.get('plan_price') as string);
  const couponCode = formData.get('coupon_code') as string;
  const discountAmount = parseFloat(formData.get('discount_amount') as string);
  const finalAmountPaid = parseFloat(formData.get('final_amount_paid') as string);
  
  if (!mobileNumber) {
    return { error: 'Mobile number is required.' };
  }
  if (!address) {
    return { error: 'Address is required.' };
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

  // 2. Create the user in Supabase Auth
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'user',
        mobile_number: mobileNumber,
        address: address,
      },
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (user) {
    const profileData: any = { 
        plan_purchased: planPurchased,
        is_approved: false,
        plan_price: planPrice,
        coupon_code: couponCode,
        discount_amount: discountAmount,
        final_amount_paid: finalAmountPaid,
        mobile_number: mobileNumber,
        address: address
    };
    
    if (referrerId) {
        profileData.referred_by = referrerId;
    }
    
    // The `order_id` for IMB will be the user's UUID
    const orderId = user.id; 

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id);

    if (profileError) {
      console.error('Failed to update profile:', profileError.message);
      return { error: `Could not save registration details: ${profileError.message}` };
    }

    // 3. Create the order with IMB Payment Gateway
    const imbUserToken = process.env.IMB_PAYMENT_USER_TOKEN;
    if (!imbUserToken) {
        console.error('IMB Payment Gateway user token is not configured.');
        return { error: 'Payment gateway is not configured on the server. Cannot proceed.'};
    }

    try {
        const orderPayload = new FormData();
        orderPayload.append('customer_mobile', mobileNumber);
        orderPayload.append('user_token', imbUserToken);
        orderPayload.append('amount', String(finalAmountPaid));
        orderPayload.append('order_id', orderId);
        // Correct redirect URL to prevent double path segments
        orderPayload.append('redirect_url', `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?order_id=${orderId}`);
        orderPayload.append('remark1', email);
        orderPayload.append('remark2', `Signup for ${planPurchased}`);
        

        const response = await fetch('https://pay.imb.org.in/api/create-order', {
            method: 'POST',
            body: orderPayload,
        });
        
        const imbResult = await response.json();
        
        if (imbResult.status === true && imbResult.result?.payment_url) {
            revalidatePath('/admin/dashboard');
            return { success: true, payment_url: imbResult.result.payment_url };
        } else {
            console.error('IMB Order Creation Failed:', imbResult);
            return { error: `Failed to create payment order: ${imbResult.message || 'Unknown error from payment gateway.'}` };
        }
    } catch (apiError: any) {
        console.error('Error calling IMB API:', apiError);
        return { error: `An unexpected error occurred while contacting the payment gateway: ${apiError.message}` };
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
