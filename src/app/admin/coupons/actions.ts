'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createCoupon(formData: FormData) {
  const code = formData.get('code') as string;
  const discountValue = formData.get('discount_value') as string;

  if (!code || !discountValue) {
    return { error: 'Coupon code and discount value are required.' };
  }

  const { error } = await supabaseAdmin
    .from('coupons')
    .insert({
      code: code.toUpperCase(),
      discount_value: parseFloat(discountValue)
    });

  if (error) {
    console.error('Error creating coupon:', error);
    return { error: `Failed to create coupon: ${error.message}` };
  }

  revalidatePath('/admin/coupons');
  return { error: null };
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
  
  // This revalidation is handled by the component calling this action.
  // revalidatePath('/admin/coupons');
  return { error: null };
}
