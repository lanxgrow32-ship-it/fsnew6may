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
  const utr = formData.get('utr') as string | null;

  if (!email || !password || !fullName || !mobileNumber || !eventId) {
    return { error: 'All fields are required.' };
  }

  // 1. Fetch event to check if it's free
  const { data: event, error: eventError } = await supabaseAdmin
    .from('competition_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
      return { error: 'Tournament week not found.' };
  }

  if (!event.is_free && !utr) {
      return { error: 'Transaction ID (UTR) is required for paid tournaments.' };
  }

  const supabase = createClient();
  
  // 2. Check if user already exists
  const { data: existingUser } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single();
  
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
        return { error: 'You are already registered for this week.' };
    }
    userId = existingUser.id;
  } else {
    // 3. Create the user in Supabase Auth if they don't exist
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
    await supabaseAdmin.from('profiles').update({ 
        account_type: 'competition',
        mobile_number: mobileNumber,
        full_name: fullName 
    }).eq('id', userId);
  }
  
  // 4. Handle Free vs Paid registration
  let stockmintUsername = null;
  let stockmintPassword = null;
  let isApproved = false;

  if (event.is_free) {
      isApproved = true;
      // Generate credentials immediately for free events
      const weekSuffix = event.week_label.replace(/\s+/g, '-').toLowerCase();
      stockmintUsername = `${email.split('@')[0]}-${weekSuffix}@${email.split('@')[1]}`;
      stockmintPassword = stockmintUsername;

      // Create StockMint account automatically
      const stockmintApiKey = process.env.STOCKMINT_API_KEY;
      if (stockmintApiKey) {
          try {
              await fetch('https://stockmint.io/api/users/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                  body: JSON.stringify({ 
                      fullName,
                      email: stockmintUsername,
                      password: stockmintUsername,
                      initialBalance: 100000 
                  }),
              });
          } catch (e) {
              console.error('StockMint API failed for free registration:', e);
          }
      }
  }

  // 5. Create the registration entry
  const { error: regError } = await supabaseAdmin
    .from('competition_registrations')
    .insert({
        user_id: userId,
        event_id: eventId,
        transaction_id: utr || 'FREE-ENTRY',
        is_approved: isApproved,
        stockmint_username: stockmintUsername,
        stockmint_password: stockmintPassword
    });

  if (regError) {
      console.error('Registration Error:', regError);
      return { error: 'Failed to submit registration.' };
  }

  revalidatePath('/competition');
  revalidatePath('/welcome');
  return { success: true, isFree: event.is_free };
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
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;

    const { data: regs, error } = await supabaseAdmin
        .from('competition_registrations')
        .select('stockmint_username, profiles(full_name)')
        .eq('event_id', eventId)
        .eq('is_approved', true);
    
    if (error || !regs || regs.length === 0) return [];

    if (stockmintApiKey) {
        try {
            const leaderboardData = await Promise.all(regs.map(async (reg) => {
                let balance = 100000;
                
                if (reg.stockmint_username) {
                    try {
                        const res = await fetch(`https://stockmint.io/api/users/stats?email=${reg.stockmint_username}`, {
                            headers: { 'x-api-key': stockmintApiKey },
                            next: { revalidate: 60 }
                        });
                        if (res.ok) {
                            const statsRes = await res.json();
                            if (statsRes.success && statsRes.data) {
                                balance = statsRes.data.balance;
                            }
                        }
                    } catch (apiErr) {
                        console.error(`Leaderboard API Error for ${reg.stockmint_username}:`, apiErr);
                    }
                }

                return {
                    name: reg.profiles?.full_name || 'Champion Trader',
                    balance: balance
                };
            }));

            return leaderboardData.sort((a, b) => b.balance - a.balance).slice(0, 50);
        } catch (e) {
            console.error('Major error in getLeaderboard parallel fetch:', e);
        }
    }

    return regs.map(r => ({ 
        name: r.profiles?.full_name || 'Champion Trader', 
        balance: 100000 
    })).slice(0, 50);
}
