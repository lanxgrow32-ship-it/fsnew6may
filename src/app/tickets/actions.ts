'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function uploadSupportAttachment(file: File, conversationId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `support-${conversationId}-${Date.now()}.${fileExt}`;
  const { data, error } = await supabaseAdmin.storage.from('ticket-attachments').upload(fileName, file);

  if (error) {
    console.error('Error uploading attachment:', error);
    throw new Error('Failed to upload image.');
  }

  const { data: urlData } = supabaseAdmin.storage.from('ticket-attachments').getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function createTicket(prevState: any, formData: FormData) {
    // Next.js 15: cookies() is async, so createClient() returns a promise.
    const supabase = await createClient();
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
    
    // Create conversation
    const { data: conv, error: convError } = await supabaseAdmin
        .from('support_conversations')
        .insert({
            user_id: user.id,
            subject,
            unread_count_admin: 1
        })
        .select()
        .single();
    
    if (convError || !conv) {
        return { error: `Failed to initialize support session: ${convError?.message}` };
    }

    let imageUrl: string | undefined;
    if (imageFile && imageFile.size > 0) {
        try {
            imageUrl = await uploadSupportAttachment(imageFile, conv.id);
        } catch (e) {
            console.error("Image upload failed", e);
        }
    }

    // Insert first message
    const { error: msgError } = await supabaseAdmin.from('support_messages').insert({
        conversation_id: conv.id,
        sender_id: user.id,
        sender_role: 'user',
        message: description,
        image_url: imageUrl
    });

    if (msgError) {
        return { error: `Failed to submit initial message: ${msgError.message}` };
    }

    revalidatePath('/tickets');
    revalidatePath('/admin/tickets');
    revalidatePath('/support-agent/tickets');
    redirect(`/tickets/${conv.id}`);
}

export async function addReply(conversationId: string, formData: FormData) {
    // Next.js 15: cookies() is async, so createClient() returns a promise.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in.' };
    }

    const reply = formData.get('reply') as string;
    const imageFile = formData.get('image') as File | null;

    if (!reply.trim() && !imageFile) {
        return { error: 'Reply message or image is required.' };
    }
    
    let imageUrl: string | undefined;
    if (imageFile && imageFile.size > 0) {
        try {
            imageUrl = await uploadSupportAttachment(imageFile, conversationId);
        } catch (e) {
            console.error("Upload error", e);
        }
    }

    // Insert message
    const { error: msgError } = await supabaseAdmin.from('support_messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_role: 'user',
        message: reply,
        image_url: imageUrl
    });

    if (msgError) return { error: msgError.message };

    // Fetch current unread counts to increment correctly
    const { data: conv } = await supabaseAdmin
        .from('support_conversations')
        .select('unread_count_admin')
        .eq('id', conversationId)
        .single();

    await supabaseAdmin.from('support_conversations')
        .update({ 
            unread_count_admin: (conv?.unread_count_admin || 0) + 1,
            last_message_at: new Date().toISOString() 
        })
        .eq('id', conversationId);

    revalidatePath(`/tickets/${conversationId}`);
    revalidatePath('/support-agent/tickets');
    return { success: true };
}
