
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// This RPC is necessary because of Supabase's RLS limitations with updating arrays on the client.
// By using `supabaseAdmin`, we bypass RLS for this trusted server-side operation.
async function appendReply(ticketId: number, replyObject: any) {
    return await supabaseAdmin.rpc('append_to_jsonb_array', {
        table_name: 'tickets',
        column_name: 'replies',
        row_id: ticketId,
        new_element: replyObject
    });
}

export async function addAdminReply(ticketId: number, reply: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in.' };
    }
    
    // We can assume the admin's name is 'Admin' for simplicity, or fetch it.
    const replyObject = {
        author: 'Admin',
        author_role: 'admin',
        message: reply,
        created_at: new Date().toISOString(),
    };

    const { error } = await appendReply(ticketId, replyObject);
    
    if (error) {
        console.error('Error adding admin reply:', error);
        return { error: 'Failed to add reply.' };
    }

    // Also update the `updated_at` timestamp to bring ticket to top
    await supabaseAdmin.from('tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticketId);

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath('/admin/tickets');
    return { success: true };
}


export async function updateTicketStatus(ticketId: number, status: 'Open' | 'Closed') {
    const { error } = await supabaseAdmin
        .from('tickets')
        .update({ status: status, updated_at: new Date().toISOString() })
        .eq('id', ticketId);
    
    if (error) {
        console.error('Error updating ticket status:', error);
        return { error: 'Failed to update ticket status.' };
    }

    revalidatePath(`/admin/tickets`);
    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath(`/tickets/${ticketId}`);
    return { success: true };
}
