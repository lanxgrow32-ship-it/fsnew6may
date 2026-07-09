
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Fetches all trader emails and names for personalized broadcast.
 */
export async function getSubscriberData() {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('account_type', 'standard');
    
    if (error) {
        console.error("Failed to fetch subscribers:", error);
        return [];
    }
    
    return data || [];
}

/**
 * Sends a single broadcast signal to Make.com with personalization context.
 * Automatically converts text newlines to HTML <br> tags for Resend compatibility.
 */
export async function sendBroadcastSignal(email: string, name: string, subject: string, message: string) {
    const webhookUrl = process.env.MAKE_CUSTOM_BROADCAST_WEBHOOK_URL;
    
    if (!webhookUrl) {
        return { error: 'Broadcast Webhook URL not configured in .env' };
    }

    // PROTOCOL v4.1: Auto-format message for HTML email clients
    const htmlMessage = message.replace(/\n/g, '<br>');

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient_email: email,
                full_name: name || 'Trader',
                subject: subject,
                message_content: htmlMessage, // Sent as HTML-ready string
                raw_text: message, // Kept as backup
                timestamp: new Date().toISOString()
            }),
        });

        if (!response.ok) {
            throw new Error(`Gateway responded with ${response.status}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error(`[Broadcast Protocol] Signal Failed for ${email}:`, error);
        return { error: error.message };
    }
}
