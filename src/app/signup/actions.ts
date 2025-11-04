
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const planPurchased = formData.get('plan_purchased') as string;
  const transactionId = formData.get('transaction_id') as string;
  const planPrice = parseFloat(formData.get('plan_price') as string);
  const couponCode = formData.get('coupon_code') as string;
  const discountAmount = parseFloat(formData.get('discount_amount') as string);
  const finalAmountPaid = parseFloat(formData.get('final_amount_paid') as string);

  const supabase = createClient();

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'user',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        plan_purchased: planPurchased,
        transaction_id: transactionId,
        is_approved: false, // Explicitly set to not approved
        plan_price: planPrice,
        coupon_code: couponCode,
        discount_amount: discountAmount,
        final_amount_paid: finalAmountPaid,
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Failed to update profile:', profileError.message);
      return { error: `Could not save registration details: ${profileError.message}` };
    }
  }

  return { error: null };
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
