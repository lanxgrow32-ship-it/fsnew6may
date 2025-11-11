
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath(`/tickets/${ticketId}`);
    return { success: true };
}


export async function updateTicketStatus(ticketId: number, status: 'Open' | 'Closed') {
    const supabase = createClient();
    const { error } = await supabase
        .from('tickets')
        .update({ status: status, updated_at: new Date().toISOString() })
        .eq('id', ticketId);
    
    if (error) {
        console.error('Error updating ticket status:', error);
        return { error: 'Failed to update ticket status.' };
    }

    revalidatePath(`/admin/tickets`);
    revalidatePath(`/admin/tickets/${ticketId}`);
    return { success: true };
}
