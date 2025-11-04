
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createAdmin(prevState: any, formData: FormData) {
  const fullName = formData.get('full_name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!fullName || !email || !password) {
    return { error: 'All fields are required.', success: false };
  }
  
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.', success: false };
  }

  const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Bypass email verification for admins
    user_metadata: {
      full_name: fullName,
      role: 'admin',
    },
  });

  if (error) {
    console.error('Error creating admin user:', error);
    return { error: `Failed to create admin: ${error.message}`, success: false };
  }

  // The database trigger 'handle_new_user' should create the profile automatically.
  // We just need to revalidate the path to show the new user in the table.
  revalidatePath('/admin/dashboard');
  
  return { success: true, error: null };
}
