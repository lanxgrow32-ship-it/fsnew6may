
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Admin Ticket Actions (Unified Support System)
 * This file handles formal ticket management using the support_conversations architecture.
 */

export async function updateTicketStatus(ticketId: string, status: 'open' | 'closed') {
    const { error } = await supabaseAdmin
        .from('support_conversations')
        .update({ status: status, last_message_at: new Date().toISOString() })
        .eq('id', ticketId);
    
    if (error) {
        console.error('Error updating ticket status:', error);
        return { error: 'Failed to update ticket status.' };
    }

    revalidatePath(`/admin/tickets`);
    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath('/support-agent/tickets');
    return { success: true };
}

export async function getTicketById(ticketId: string) {
    const { data, error } = await supabaseAdmin
        .from('support_conversations')
        .select('*, profiles:user_id(full_name, email)')
        .eq('id', ticketId)
        .single();
    
    if (error) {
        console.error('Error fetching ticket by ID (admin):', error);
        return { error: 'Failed to fetch ticket.' };
    }

    return { data };
}
