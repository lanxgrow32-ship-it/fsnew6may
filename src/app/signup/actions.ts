'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateLgPaySignature } from '@/lib/lg-pay';
import { generateWatchPaySignature } from '@/lib/watchpay';
import { randomBytes } from 'crypto';
import { headers } from 'next/headers';

export async function signupAndCreateOrder(prevState: any, formData: FormData) {
  const supabase = createClient();

  // 1. Securely fetch settings via admin to bypass RLS
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('payment_details')
    .select('*')
    .eq('id', 1)
    .single();
    
  if (settingsError || !settings) {
      console.error("Settings Fetch Error:", settingsError);
      return { error: 'Server configuration error. Please contact support.' };
  }

  // 2. Resolve final gateway based on mode
  let activeGateway = settings.active_payment_gateway || 'lgpay';
  
  if (activeGateway === 'automated') {
      const mode = settings.automated_gateway_mode || 'both';
      if (mode === 'lgpay') {
          activeGateway = 'lgpay';
      } else if (mode === 'watchpay') {
          activeGateway = 'watchpay';
      } else {
          // BOTH (Round Robin / Alternating)
          const lastUsed = settings.last_used_automated_gateway || 'watchpay';
          activeGateway = lastUsed === 'lgpay' ? 'watchpay' : 'lgpay';
          
          // Update tracker for the next user
          await supabaseAdmin.from('payment_details').update({ 
              last_used_automated_gateway: activeGateway 
          }).eq('id', 1);
      }
  }

  // --- Process Data ---
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
    return { error: 'Required fields missing.' };
  }
  
  if (activeGateway === 'manual' && !(formData.get('utr') as string)) {
      return { error: 'UTR / Transaction ID is required for manual verification.' };
  }

  // 3. User Existence Check
  const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).single();
  if (existingUser) return { error: 'User with this email already exists.' };

  // 4. Referrer Logic
  let referrerId: string | null = null;
  if (referralCode) {
    const { data: ref } = await supabase.from('profiles').select('id').eq('referral_code', referralCode.trim().toUpperCase()).single();
    if (ref) referrerId = ref.id;
    else return { error: 'Invalid referral code.' };
  }

  const order_sn = `FS_${Date.now()}_${randomBytes(4).toString('hex')}`;
  
  // 5. Auth Account Creation
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role: 'user' } },
  });

  if (signUpError) return { error: signUpError.message };

  if (user) {
    // Generate code
    let namePart = fullName.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4) || 'USER';
    const referralCodeValue = `${namePart}-${user.id.substring(0, 4).toUpperCase()}`;

    const profileData: any = {
        plan_purchased: planPurchased,
        is_approved: false,
        order_sn: order_sn,
        plan_price: planPrice,
        coupon_code: couponCode,
        discount_amount: discountAmount,
        final_amount_paid: finalAmountPaid,
        mobile_number: mobileNumber,
        referral_code: referralCodeValue,
    };
    
    if (planPurchased.toLowerCase().includes('passthenpay')) profileData.account_model = 'passthrupay';
    if (referrerId) profileData.referred_by = referrerId;

    // Multi-Account Support
    const utrValue = activeGateway === 'manual' ? formData.get('utr') as string : null;
    await supabaseAdmin.from('user_accounts').insert({
        user_id: user.id,
        plan_name: planPurchased,
        status: 'pending',
        is_approved: false,
        transaction_id: utrValue,
        account_model: profileData.account_model || 'normal',
        final_amount_paid: finalAmountPaid,
    });

    if (activeGateway === 'manual') profileData.transaction_id = utrValue;
    
    const { error: profileError } = await supabase.from('profiles').update(profileData).eq('id', user.id);
    if (profileError) {
        await supabase.auth.admin.deleteUser(user.id);
        return { error: `Profile update failed: ${profileError.message}` };
    }

    // 6. Branch into Gateway Flows
    if (activeGateway === 'manual') {
        redirect('/welcome');
    } else if (activeGateway === 'watchpay') {
        const merchantId = settings.watchpay_merchant_id?.trim();
        const apiKey = settings.watchpay_api_key?.trim();
        const amountFormatted = finalAmountPaid.toFixed(2);
        const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://app.fundedstock.io'}/api/watchpay-webhook`;

        const params = { merchant_id: String(merchantId), amount: amountFormatted, merchant_order_no: order_sn, callback_url: callbackUrl };
        const signature = generateWatchPaySignature(params, apiKey!);

        try {
            const res = await fetch('https://api.watchpays.com/v1/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...params, api_key: apiKey, signature, extra: user.id }),
            });
            const result = await res.json();
            if (result.payment_url) return { redirectUrl: result.payment_url };
            return { error: `WatchPay Error: ${result.message || 'Initiation failed.'}` };
        } catch (e) { return { error: 'WatchPay connection failed.' }; }
    } else {
        // LG-Pay
        const lgKey = '3zJXYxvfIY2S1gOHl3Ctunq6xx9apBX1';
        const moneyCents = Math.round(finalAmountPaid * 100);
        const ip = headers().get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
        const params = { app_id: 'YD4957', trade_type: "INRUPI", order_sn, money: String(moneyCents), notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/lg-pay-webhook`, ip, remark: planPurchased };
        const sign = generateLgPaySignature(params, lgKey);

        try {
            const res = await fetch('https://www.lg-pay.com/api/order/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ ...params, sign }),
            });
            const result = await res.json();
            if (result.status === 1 && result.data?.pay_url) return { redirectUrl: result.data.pay_url };
            return { error: `LG-Pay Error: ${result.msg || 'Gateway rejected.'}` };
        } catch (e) { return { error: 'LG-Pay connection failed.' }; }
    }
  }
  return { error: 'Unknown signup error.' };
}

export async function validateCoupon(code: string) {
  if (!code) return { error: 'Coupon code required.' };
  const supabase = createClient();
  const { data, error } = await supabase.from('coupons').select('discount_value').eq('code', code.toUpperCase()).single();
  if (error || !data) return { error: 'Invalid or expired coupon.' };
  return { discount: data.discount_value };
}

export async function validateReferralCode(code: string) {
  if (!code) return { error: 'Referral code required.' };
  const supabase = createClient();
  const { data, error } = await supabase.from('profiles').select('id').eq('referral_code', code.trim().toUpperCase()).single();
  if (error || !data) return { error: 'Invalid referral code.' };
  return { success: true };
}
