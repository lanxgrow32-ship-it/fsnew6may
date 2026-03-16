
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateLgPaySignature } from '@/lib/lg-pay';
import { randomBytes } from 'crypto';
import { headers } from 'next/headers';


export async function signupAndCreateOrder(formData: FormData) {
  const supabase = createClient();

  // Securely fetch the active gateway on the server to decide the flow
  const { data: settings } = await supabase.from('payment_details').select('active_payment_gateway').eq('id', 1).single();
  const activeGateway = settings?.active_payment_gateway || 'lgpay';

  // --- Get form data ---
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const planPurchased = formData.get('plan_purchased') as string;
  const referralCode = formData.get('referral_code') as string | null;
  const mobileNumber = formData.get('mobile_number') as string;
  
  const planPrice = parseFloat(formData.get('plan_price') as string);
  const couponCode = formData.get('coupon_code') as string;
  const discountAmount = parseFloat(formData.get('discount_amount') as string);
  const finalAmountPaid = parseFloat(formData.get('final_amount_paid') as string);

  if (!email || !password || !fullName || !planPurchased || !mobileNumber) {
    return { error: 'All required fields must be filled.' };
  }
  
  // For manual flow, also require the UTR
  if (activeGateway === 'manual') {
      const utr = formData.get('utr') as string;
      if (!utr) {
          return { error: 'UTR / Transaction ID is required for manual verification.' };
      }
  }

  // 1. Check if user already exists
  const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).single();
  if (existingUser) {
    return { error: 'A user with this email address already exists.' };
  }

  // 2. Find referrer if code is provided
  let referrerId: string | null = null;
  if (referralCode) {
    const { data: referrerProfile } = await supabase.from('profiles').select('id').eq('referral_code', referralCode.trim().toUpperCase()).single();
    if (referrerProfile) {
      referrerId = referrerProfile.id;
    } else {
        return { error: 'The entered referral code is not valid.' };
    }
  }

  // 3. Create a unique order number for the transaction (only used by automated gateway)
  const order_sn = `FS_${Date.now()}_${randomBytes(4).toString('hex')}`;
  
  // 4. Create the user in Supabase Auth
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role: 'user' } },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (user) {
    // Generate referral code
    const referralCodeValue = (
        (fullName.replace(/[^a-zA-Z]/g, '').substring(0, 4)) + '-' + (user.id.substring(0, 4))
    ).toUpperCase();

    // 5. Update the automatically created profile with purchase details
    const profileData: any = {
        plan_purchased: planPurchased,
        is_approved: false, // Payment is not yet confirmed
        order_sn: order_sn, // Will be used by automated gateway
        plan_price: planPrice,
        coupon_code: couponCode,
        discount_amount: discountAmount,
        final_amount_paid: finalAmountPaid,
        mobile_number: mobileNumber,
        referral_code: referralCodeValue,
    };
    if (referrerId) {
        profileData.referred_by = referrerId;
    }
    // If it was a manual payment, also save the UTR now
    if (activeGateway === 'manual') {
        profileData.transaction_id = formData.get('utr') as string;
    }
    
    const { error: profileError } = await supabase.from('profiles').update(profileData).eq('id', user.id);

    if (profileError) {
      await supabase.auth.admin.deleteUser(user.id);
      return { error: `Could not save registration details: ${profileError.message}` };
    }

    // 6. Branch logic based on active gateway
    if (activeGateway === 'manual') {
        // For manual flow, we just redirect the user to the welcome page
        // where they will see their pending status.
        redirect('/welcome');

    } else {
        // AUTOMATED (LG-Pay) Flow
        const lgPayAppId = 'YD4957';
        const lgPayKey = '3zJXYxvfIY2S1gOHl3Ctunq6xx9apBX1';
        const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/lg-pay-webhook`;

        const moneyInCents = Math.round(finalAmountPaid * 100);
        const ipHeader = headers().get('x-forwarded-for') ?? '127.0.0.1';
        const ip = ipHeader.split(',')[0].trim();


        const params: Record<string, string> = {
            app_id: lgPayAppId,
            trade_type: "INRUPI",
            order_sn: order_sn,
            money: String(moneyInCents),
            notify_url: notifyUrl,
            ip: ip,
            remark: `Plan: ${planPurchased}`
        };

        const sign = generateLgPaySignature(params, lgPayKey);

        try {
            const response = await fetch('https://www.lg-pay.com/api/order/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ ...params, sign }),
            });
            const result = await response.json();

            if (result.status === 1 && result.data?.pay_url) {
                return { redirectUrl: result.data.pay_url };
            } else {
                console.error("LG-Pay API Error:", result);
                return { error: `Could not initiate payment: ${result.msg || 'Unknown gateway error.'}` };
            }
        } catch (e: any) {
            console.error("LG-Pay fetch Error:", e);
            return { error: 'Failed to contact payment gateway. Please try again later.' };
        }
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
