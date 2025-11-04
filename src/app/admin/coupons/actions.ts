
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createCoupon(prevState: any, formData: FormData) {
  const code = formData.get('code') as string;
  const discountValue = formData.get('discount_value') as string;

  if (!code || !discountValue) {
    return { error: 'Coupon code and discount value are required.', success: false };
  }

  const { error } = await supabaseAdmin
    .from('coupons')
    .insert({
      code: code.toUpperCase(),
      discount_value: parseFloat(discountValue)
    });

  if (error) {
    console.error('Error creating coupon:', error);
    if (error.code === '23505') { // Unique constraint violation
        return { error: 'This coupon code already exists.', success: false };
    }
    return { error: `Failed to create coupon: ${error.message}`, success: false };
  }

  revalidatePath('/admin/coupons');
  return { error: null, success: true };
}

export async function deleteCoupon(couponId: number) {
  if (!couponId) {
    return { error: 'Coupon ID is required.' };
  }

  const { error } = await supabaseAdmin
    .from('coupons')
    .delete()
    .eq('id', couponId);

  if (error) {
    console.error('Error deleting coupon:', error);
    return { error: `Failed to delete coupon: ${error.message}` };
  }
  
  revalidatePath('/admin/coupons');
  return { error: null };
}
