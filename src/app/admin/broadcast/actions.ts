
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Fetches all trader emails for broadcast.
 */
export async function getSubscriberEmails() {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('account_type', 'standard');
    
    if (error) {
        console.error("Failed to fetch subscribers:", error);
        return [];
    }
    
    return (data || []).map(p => p.email);
}

/**
 * Sends a single broadcast signal to Make.com.
 * This is used for both tests and individual steps in a mass broadcast.
 */
export async function sendBroadcastSignal(email: string, subject: string, message: string) {
    const webhookUrl = process.env.MAKE_CUSTOM_BROADCAST_WEBHOOK_URL;
    
    if (!webhookUrl) {
        return { error: 'Broadcast Webhook URL not configured.' };
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient_email: email,
                subject: subject,
                message_content: message,
                timestamp: new Date().toISOString()
            }),
        });

        if (!response.ok) {
            throw new Error(`Gateway responded with ${response.status}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error(`Broadcast Signal Failed for ${email}:`, error);
        return { error: error.message };
    }
}
