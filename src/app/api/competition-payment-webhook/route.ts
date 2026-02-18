import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
    try {
        const { session_id } = await req.json();

        if (!session_id) {
            return NextResponse.json({ error: 'session_id is missing' }, { status: 400 });
        }
        
        console.log(`Webhook received for session_id: ${session_id}`);

        const { error: updateError } = await supabaseAdmin
            .from('payment_sessions')
            .update({ status: 'completed' })
            .eq('id', session_id);
        
        if (updateError) {
            console.error(`Webhook Error: Could not update payment session ${session_id} to completed.`, updateError);
            // Don't return a 500. The user can trigger credential creation manually if this fails.
            return NextResponse.json({ message: 'Failed to update session status, but webhook acknowledged.' });
        }

        console.log(`Payment session ${session_id} marked as completed.`);
        
        // Revalidate the welcome page. When the user logs in, they will now see the "Get Credentials" button.
        revalidatePath('/welcome');

        return NextResponse.json({ message: 'Session status updated to completed.' });

    } catch (error: any) {
        console.error('Error processing simplified competition webhook:', error);
        return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }
}
