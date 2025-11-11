
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';


async function uploadTicketAttachment(file: File, ticketId: number) {
  const fileExt = file.name.split('.').pop();
  const fileName = `ticket-${ticketId}-${Date.now()}.${fileExt}`;
  const { data, error } = await supabaseAdmin.storage.from('ticket-attachments').upload(fileName, file);

  if (error) {
    console.error('Error uploading ticket attachment:', error);
    throw new Error('Failed to upload image.');
  }

  const { data: urlData } = supabaseAdmin.storage.from('ticket-attachments').getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function createTicket(prevState: any, formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to create a ticket.' };
    }

    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;
    const imageFile = formData.get('image') as File | null;
    
    if (!subject || !description) {
        return { error: 'Subject and description are required.' };
    }
    
    const insertData: {
        user_id: string;
        subject: string;
        description: string;
        updated_at: string;
        image_url?: string;
    } = {
        user_id: user.id,
        subject,
        description,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
        .from('tickets')
        .insert(insertData)
        .select()
        .single();
    
    if (error) {
        console.error('Error creating ticket:', error);
        return { error: `Failed to create ticket: ${error.message}` };
    }

    // Now handle image upload if it exists
    if (imageFile && imageFile.size > 0 && data) {
        try {
            const imageUrl = await uploadTicketAttachment(imageFile, data.id);
            const { error: updateError } = await supabaseAdmin
                .from('tickets')
                .update({ image_url: imageUrl })
                .eq('id', data.id);
            if (updateError) throw updateError;
        } catch(uploadError: any) {
             // If image upload fails, we don't fail the whole ticket creation
             // but we can log it. A more robust solution might delete the ticket
             // or mark it as having a failed upload.
             console.error("Ticket created, but image upload failed:", uploadError.message);
        }
    }


    revalidatePath('/tickets');
    revalidatePath('/admin/tickets');
    redirect(`/tickets/${data.id}`);
}


export async function addReply(ticketId: number, formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in.' };
    }

    const reply = formData.get('reply') as string;
    const imageFile = formData.get('image') as File | null;

    if (!reply.trim() && !imageFile) {
        return { error: 'Reply message or image is required.' };
    }
    
    const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();

    if (!profile) {
        return { error: 'Profile not found.' };
    }

    let imageUrl: string | undefined;
    if (imageFile && imageFile.size > 0) {
        try {
            imageUrl = await uploadTicketAttachment(imageFile, ticketId);
        } catch (uploadError: any) {
            return { error: uploadError.message };
        }
    }

    const replyObject = {
        author: profile.full_name,
        author_role: profile.role,
        message: reply,
        created_at: new Date().toISOString(),
        image_url: imageUrl,
    };

    // This custom RPC is necessary because of Supabase's RLS limitations with updating arrays.
    // It is defined in the initial SQL script.
    const { error } = await supabaseAdmin.rpc('append_to_jsonb_array', {
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
    await supabaseAdmin.from('tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticketId);


    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath('/admin/tickets');
    return { success: true };
}
