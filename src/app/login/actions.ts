'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Get profile to check role for routing
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('email', email)
    .single();

  if (profile?.role === 'admin') {
    redirect('/admin/dashboard');
  } else if (profile?.role === 'support') {
    // Redirect support agents to their dedicated standalone hub
    redirect('/support-agent');
  } else if (profile?.role === 'specialist') {
    // REDIRECT V2: Redirect Specialists to their standalone Pure Panel
    redirect('/specialist-desk');
  } else {
    redirect('/welcome');
  }
}
