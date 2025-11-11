
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createTicket(prevState: any, formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to create a ticket.' };
    }

    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;
    
    if (!subject || !description) {
        return { error: 'Subject and description are required.' };
    }
    
    const { data, error } = await supabase
        .from('tickets')
        .insert({
            user_id: user.id,
            subject,
            description,
        })
        .select()
        .single();
    
    if (error) {
        console.error('Error creating ticket:', error);
        return { error: `Failed to create ticket: ${error.message}` };
    }

    revalidatePath('/tickets');
    redirect(`/tickets/${data.id}`);
}


export async function addReply(ticketId: number, reply: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in.' };
    }
    
    const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();

    if (!profile) {
        return { error: 'Profile not found.' };
    }

    const replyObject = {
        author: profile.full_name,
        author_role: profile.role,
        message: reply,
        created_at: new Date().toISOString(),
    };

    // This custom RPC is necessary because of Supabase's RLS limitations with updating arrays.
    const { error } = await supabase.rpc('append_to_jsonb_array', {
        table_name: 'tickets',
        column_name: 'replies',
        row_id: ticketId,
        new_element: replyObject
    });
    
    if (error) {
        console.error('Error adding reply:', error);
        return { error: 'Failed to add reply.' };
    }
    
    // Also update the `updated_at` timestamp
    await supabase.from('tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticketId);


    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath(`/admin/tickets/${ticketId}`);
    return { success: true };
}
