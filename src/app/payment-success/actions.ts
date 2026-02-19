
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export async function checkPaymentStatus(orderId: string) {
  if (!orderId) {
    return { status: 'error', message: 'No order ID provided.' };
  }

  // Use the admin client to bypass RLS since the user is not logged in on this page.
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('is_approved')
    .eq('id', orderId)
    .single();
  
  if (error) {
    console.error('Error fetching payment status:', error);
    return { status: 'error', message: 'Could not verify payment status at this time.' };
  }

  if (!profile) {
     return { status: 'not_found', message: 'Could not find a matching order.' };
  }

  return { status: 'ok', is_approved: profile.is_approved };
}
