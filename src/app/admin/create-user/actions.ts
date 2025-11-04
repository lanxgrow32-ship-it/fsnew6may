'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export async function createUser(formData: FormData) {
  const email = formData.get('email') as string;
  const fullName = formData.get('full_name') as string;
  const planPurchased = formData.get('plan_purchased') as string;

  // Generate a random password
  const password = Math.random().toString(36).slice(-8);

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm the email for admin-created users
    user_metadata: {
      full_name: fullName,
      role: 'user', // Default role is user
    },
  });

  if (authError) {
    return { error: authError.message, password: null };
  }

  if (authData.user) {
    // Now, update the corresponding profile table entry if plan is provided
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ plan_purchased: planPurchased })
      .eq('id', authData.user.id);
    
    if (profileError) {
      // If updating the profile fails, we might want to handle that
      // For now, we'll just log it on the server and proceed
      console.error("Failed to update profile for new user:", profileError.message);
    }
  }

  return { error: null, password };
}
