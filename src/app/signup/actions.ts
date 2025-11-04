'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const planPurchased = formData.get('plan_purchased') as string;
  const transactionId = formData.get('transaction_id') as string;
  const supabase = createClient();

  // We are not verifying the email, so we can create the user directly.
  // The user will be created but won't be able to log in until approved.
  // We will manage "approval" via a field in the profiles table, which is already handled
  // by the admin dashboard logic (not yet implemented for approval).
  
  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'user', // All new users default to 'user'
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (user) {
     // The trigger will create the profile, now we update it with the extra info.
     // This assumes the RLS policy allows the user to update their own profile.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        plan_purchased: planPurchased,
        transaction_id: transactionId,
        is_approved: false // Explicitly set to not approved
      })
      .eq('id', user.id);

    if (profileError) {
      // If updating the profile fails, we should ideally delete the auth user
      // to avoid orphaned users. For now, we'll return the error.
      console.error('Failed to update profile:', profileError.message);
      // await supabase.auth.admin.deleteUser(user.id); // This needs admin client
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
    .eq('code', code)
    .single();

  if (error || !data) {
    return { error: 'Invalid or expired coupon code.' };
  }

  return { discount: data.discount_value };
}
