
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function addAdminReply(ticketId: number, reply: string) {
    // 1. Fetch the current ticket data securely
    const { data: ticket, error: fetchError } = await supabaseAdmin
        .from('tickets')
        .select('replies')
        .eq('id', ticketId)
        .single();
    
    if (fetchError || !ticket) {
        console.error('Error fetching ticket before replying:', fetchError);
        return { error: 'Failed to find the ticket to reply to.' };
    }

    // 2. Prepare the new reply object
    const replyObject = {
        author: 'Admin',
        author_role: 'admin' as const,
        message: reply,
        created_at: new Date().toISOString(),
    };

    // 3. Append the new reply to the existing array
    const updatedReplies = [...(ticket.replies || []), replyObject];
    
    // 4. Update the ticket with the new replies array and a new `updated_at` timestamp
    const { error: updateError } = await supabaseAdmin
        .from('tickets')
        .update({ 
            replies: updatedReplies,
            updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

    if (updateError) {
        console.error('Error adding admin reply:', updateError);
        return { error: 'Failed to add reply.' };
    }

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

export async function getTicketById(ticketId: number) {
    const { data, error } = await supabaseAdmin
        .from('tickets')
        .select('*, profiles:user_id(*)')
        .eq('id', ticketId)
        .single();
    
    if (error) {
        console.error('Error fetching ticket by ID (admin):', error);
        return { error: 'Failed to fetch ticket.' };
    }

    return { data };
}
