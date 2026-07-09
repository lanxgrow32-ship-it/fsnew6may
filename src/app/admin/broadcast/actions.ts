
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
 */
export async function sendBroadcastSignal(email: string, name: string, subject: string, message: string) {
    const webhookUrl = process.env.MAKE_CUSTOM_BROADCAST_WEBHOOK_URL;
    
    if (!webhookUrl) {
        return { error: 'Broadcast Webhook URL not configured in .env' };
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient_email: email,
                full_name: name || 'Trader',
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
