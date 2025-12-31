
'use server';

import { createClient } from '@/lib/supabase/server';

export async function checkPaymentStatus(orderId: string) {
  const supabase = createClient();

  if (!orderId) {
    return { status: 'error', message: 'No order ID provided.' };
  }

  // We need to use the admin client here to bypass RLS, since the user isn't logged in yet.
  // But for this check, we can allow reads on the profiles table for the specific ID.
  // Let's assume for now that RLS allows reading one's own (or a specific) record.
  // If not, we'd need to switch to an RPC or use the admin client.
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_approved')
    .eq('id', orderId)
    .single();
  
  if (error) {
    console.error('Error fetching payment status:', error);
    return { status: 'error', message: 'Could not verify payment status.' };
  }

  if (!profile) {
     return { status: 'not_found', message: 'Could not find a matching order.' };
  }

  return { status: 'ok', is_approved: profile.is_approved };
}
