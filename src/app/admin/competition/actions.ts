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

  if (!weekLabel || !startDate || !endDate || !entryFeeStr) {
    return { error: 'Please fill all required fields.' };
  }

  const entryFee = parseFloat(entryFeeStr);

  const data = {
    week_label: weekLabel,
    start_date: startDate,
    end_date: endDate,
    entry_fee: entryFee,
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
