
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
                await fetch('https://stockmint.io/api/users/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                    body: JSON.stringify({ 
                        fullName: reg.profiles.full_name,
                        email: stockmintUsername,
                        password: stockmintUsername,
                        initialBalance: 100000,
                        accountClassification: 'evaluation',
                        accountModel: 'normal'
                    }),
                });
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

        // TRIGGER V3: Intelligent Purchase Handler (Competition Approval)
        const purchaseWebhook = process.env.MAKE_PURCHASE_WEBHOOK_URL;
        if (purchaseWebhook) {
            fetch(purchaseWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: reg.profiles.email,
                    full_name: reg.profiles.full_name,
                    plan_name: `Tournament: ${reg.competition_events.week_label}`,
                    username: stockmintUsername,
                    password: stockmintUsername,
                    needsKyc: false
                })
            }).catch(e => console.error(e));
        }

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

export async function archiveWeekResults(eventId: string) {
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;

    try {
        const { data: regs, error: regsError } = await supabaseAdmin
            .from('competition_registrations')
            .select('user_id, stockmint_username, profiles(full_name, email)')
            .eq('event_id', eventId)
            .eq('is_approved', true);
        
        if (regsError || !regs) throw new Error("Could not find participants.");

        const results = await Promise.all(regs.map(async (reg) => {
            let balance = 100000;
            if (reg.stockmint_username && stockmintApiKey) {
                const res = await fetch(`https://stockmint.io/api/users/stats?email=${reg.stockmint_username}`, {
                    headers: { 'X-API-Key': stockmintApiKey }
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

        const sorted = results.sort((a, b) => b.balance - a.balance);
        const winners = sorted.slice(0, 3);

        const winnerInserts = winners.map((w, index) => ({
            event_id: eventId,
            rank: index + 1,
            user_name: w.name,
            user_email: w.email,
            final_balance: w.balance
        }));

        const { error: winError } = await supabaseAdmin.from('competition_winners').insert(winnerInserts);
        if (winError) throw winError;

        await supabaseAdmin.from('competition_events').update({ is_archived: true }).eq('id', eventId);

        revalidatePath('/admin/competition');
        return { success: true };

    } catch (err: any) {
        console.error("Archive Error:", err);
        return { error: err.message };
    }
}
