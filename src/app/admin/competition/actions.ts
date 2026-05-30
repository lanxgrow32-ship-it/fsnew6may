'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function upsertEvent(formData: FormData) {
  const id = formData.get('id') as string | null;
  const weekLabel = formData.get('week_label') as string;
  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;
  const entryFeeStr = formData.get('entry_fee') as string;
  const status = formData.get('status') as 'ongoing' | 'upcoming' | 'completed';
  const isFree = formData.get('is_free') === 'on';

  if (!weekLabel || !startDate || !endDate) {
    return { error: 'Please fill all required fields.' };
  }

  const entryFee = isFree ? 0 : parseFloat(entryFeeStr || '0');

  const data = {
    week_label: weekLabel,
    start_date: startDate,
    end_date: endDate,
    entry_fee: entryFee,
    is_free: isFree,
    status: status || 'upcoming',
    is_active: true
  };

  try {
    if (id) {
      const { error } = await supabaseAdmin.from('competition_events').update(data).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from('competition_events').insert(data);
      if (error) throw error;
    }

    revalidatePath('/admin/competition');
    revalidatePath('/competition');
    return { success: true };
  } catch (error: any) {
    console.error('Database Error in upsertEvent:', error);
    return { error: error.message || 'Failed to save event.' };
  }
}

export async function approveRegistration(regId: string) {
    try {
        const { data: reg, error: fetchError } = await supabaseAdmin
            .from('competition_registrations')
            .select('*, profiles(full_name, email), competition_events(week_label)')
            .eq('id', regId)
            .single();
        
        if (fetchError || !reg) return { error: 'Registration not found.' };

        // 1. Create StockMint Account
        const stockmintApiKey = process.env.STOCKMINT_API_KEY;
        const weekSuffix = reg.competition_events.week_label.replace(/\s+/g, '-').toLowerCase();
        const stockmintUsername = `${reg.profiles.email.split('@')[0]}-${weekSuffix}@${reg.profiles.email.split('@')[1]}`;
        
        if (stockmintApiKey) {
            try {
                const response = await fetch('https://stockmint.io/api/users/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                    body: JSON.stringify({ 
                        fullName: reg.profiles.full_name,
                        email: stockmintUsername,
                        password: stockmintUsername,
                        initialBalance: 100000 
                    }),
                });
                if (!response.ok) {
                    console.error('StockMint API failed with status:', response.status);
                }
            } catch (e) { 
                console.error('StockMint API Connection Error:', e);
            }
        }

        // 2. Mark as approved in DB
        const { error: updateError } = await supabaseAdmin.from('competition_registrations').update({
            is_approved: true,
            stockmint_username: stockmintUsername,
            stockmint_password: stockmintUsername,
        }).eq('id', regId);

        if (updateError) throw updateError;

        revalidatePath('/admin/competition');
        revalidatePath('/welcome');
        return { success: true };
    } catch (error: any) {
        console.error('Approval Error:', error);
        return { error: error.message || 'Failed to approve registration.' };
    }
}

export async function deleteEvent(id: string) {
    try {
        const { error } = await supabaseAdmin.from('competition_events').delete().eq('id', id);
        if (error) throw error;
        revalidatePath('/admin/competition');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * ARCHIVE LOGIC:
 * 1. Fetches final balances from StockMint for all approved users of a week.
 * 2. Identifies Top 3 and saves them to competition_winners.
 * 3. Marks event as archived.
 * NOTE: Participant deletion removed to allow permanent report exporting.
 */
export async function archiveWeekResults(eventId: string) {
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;

    try {
        // 1. Get all approved regs
        const { data: regs, error: regsError } = await supabaseAdmin
            .from('competition_registrations')
            .select('user_id, stockmint_username, profiles(full_name, email)')
            .eq('event_id', eventId)
            .eq('is_approved', true);
        
        if (regsError || !regs) throw new Error("Could not find participants.");

        // 2. Fetch final stats for all
        const results = await Promise.all(regs.map(async (reg) => {
            let balance = 100000;
            if (reg.stockmint_username && stockmintApiKey) {
                const res = await fetch(`https://stockmint.io/api/users/stats?email=${reg.stockmint_username}`, {
                    headers: { 'x-api-key': stockmintApiKey }
                });
                if (res.ok) {
                    const stats = await res.json();
                    if (stats.success) balance = stats.data.balance;
                }
            }
            return {
                name: reg.profiles?.full_name || 'Champion',
                email: reg.profiles?.email || 'N/A',
                balance: balance
            };
        }));

        // 3. Sort and pick winners
        const sorted = results.sort((a, b) => b.balance - a.balance);
        const winners = sorted.slice(0, 3);

        // 4. Save Winners permanently
        const winnerInserts = winners.map((w, index) => ({
            event_id: eventId,
            rank: index + 1,
            user_name: w.name,
            user_email: w.email,
            final_balance: w.balance
        }));

        const { error: winError } = await supabaseAdmin.from('competition_winners').insert(winnerInserts);
        if (winError) throw winError;

        // 5. Mark as archived
        await supabaseAdmin.from('competition_events').update({ is_archived: true }).eq('id', eventId);

        // NOTE: We no longer delete registrations here so that "Export PDF" can work forever.

        revalidatePath('/admin/competition');
        return { success: true };

    } catch (err: any) {
        console.error("Archive Error:", err);
        return { error: err.message };
    }
}