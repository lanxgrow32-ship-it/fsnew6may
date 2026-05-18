'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function upsertEvent(formData: FormData) {
  const id = formData.get('id') as string | null;
  const weekLabel = formData.get('week_label') as string;
  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;
  const entryFee = parseFloat(formData.get('entry_fee') as string);
  const status = formData.get('status') as 'ongoing' | 'upcoming' | 'completed';

  const data = {
    week_label: weekLabel,
    start_date: startDate,
    end_date: endDate,
    entry_fee: entryFee,
    status: status,
  };

  if (id) {
    await supabaseAdmin.from('competition_events').update(data).eq('id', id);
  } else {
    await supabaseAdmin.from('competition_events').insert(data);
  }

  revalidatePath('/admin/competition');
  revalidatePath('/competition');
  return { success: true };
}

export async function approveRegistration(regId: string) {
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
                    initialBalance: 100000 
                }),
            });
        } catch (e) { console.error('StockMint API Error:', e); }
    }

    // 2. Mark as approved in DB
    await supabaseAdmin.from('competition_registrations').update({
        is_approved: true,
        stockmint_username: stockmintUsername,
        stockmint_password: stockmintUsername,
    }).eq('id', regId);

    revalidatePath('/admin/competition');
    return { success: true };
}

export async function deleteEvent(id: string) {
    await supabaseAdmin.from('competition_events').delete().eq('id', id);
    revalidatePath('/admin/competition');
    return { success: true };
}
