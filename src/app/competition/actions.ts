'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function registerForTournament(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const mobileNumber = formData.get('mobile_number') as string;
  const eventId = formData.get('event_id') as string;
  const utr = formData.get('utr') as string;

  if (!email || !password || !fullName || !mobileNumber || !eventId || !utr) {
    return { error: 'All fields are required, including the Transaction ID (UTR).' };
  }

  const supabase = createClient();
  
  // 1. Check if user already exists
  const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).single();
  
  let userId: string;

  if (existingUser) {
    // Check if they are already registered for THIS specific event
    const { data: existingReg } = await supabaseAdmin
        .from('competition_registrations')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('event_id', eventId)
        .single();
    
    if (existingReg) {
        return { error: 'You are already registered for this week. Please wait for approval.' };
    }
    userId = existingUser.id;
  } else {
    // 2. Create the user in Supabase Auth if they don't exist
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
        data: {
            full_name: fullName,
            role: 'user',
        },
        },
    });

    if (signUpError) return { error: signUpError.message };
    if (!user) return { error: 'Failed to create account.' };
    userId = user.id;

    // Update profile for competition
    await supabase.from('profiles').update({ 
        account_type: 'competition',
        mobile_number: mobileNumber 
    }).eq('id', userId);
  }
  
  // 3. Create the registration entry
  const { error: regError } = await supabaseAdmin
    .from('competition_registrations')
    .insert({
        user_id: userId,
        event_id: eventId,
        transaction_id: utr,
        is_approved: false,
    });

  if (regError) {
      console.error('Registration Error:', regError);
      return { error: 'Failed to submit registration. Please contact support.' };
  }

  revalidatePath('/competition');
  return { success: true };
}

export async function getCompetitionEvents() {
    const { data } = await supabaseAdmin
        .from('competition_events')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: true });
    return data || [];
}

export async function getLeaderboard(eventId: string) {
    const { data } = await supabaseAdmin
        .from('competition_registrations')
        .select('current_balance, profiles(full_name)')
        .eq('event_id', eventId)
        .eq('is_approved', true)
        .order('current_balance', { ascending: false })
        .limit(50);
    
    return data || [];
}
