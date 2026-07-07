
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { LiveChatClient } from './live-chat-client';

export const dynamic = 'force-dynamic';

export default async function LiveChatPage() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) redirect('/login');

    const userId = session.user.id;

    // Fetch initial state for the chat
    const [profileRes, supportRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
        supabaseAdmin.from('support_conversations').select('*').eq('user_id', userId).order('last_message_at', { ascending: false })
    ]);

    if (!profileRes.data) {
        return <div className="flex h-screen items-center justify-center bg-slate-950 text-white font-poppins">System Protocol Error.</div>;
    }

    return (
        <LiveChatClient 
            profile={profileRes.data} 
            initialConversations={supportRes.data || []} 
        />
    );
}
