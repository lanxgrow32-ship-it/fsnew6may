
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    MessageSquare, 
    Send, 
    Loader2, 
    User,
    Search,
    Inbox,
    Paperclip,
    X,
    ChevronLeft,
    ShieldCheck,
    Activity,
    BrainCircuit
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sendSupportMessage, markSupportRead } from '@/app/welcome/actions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { format } from 'date-fns';

function SpecialistChatContent() {
    const searchParams = useSearchParams();
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [agentId, setAgentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const supabase = createClient();

    const fetchConversations = async () => {
        const { data } = await supabase
            .from('support_conversations')
            .select('*, profiles:user_id(full_name, email)')
            .eq('assigned_role', 'specialist')
            .order('last_message_at', { ascending: false });
        setConversations(data || []);
        setLoading(false);
    };

    const fetchMessages = async (convId: string) => {
        const { data } = await supabase.from('support_messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true });
        setMessages(data || []);
    };

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setAgentId(user.id);
            fetchConversations();
        };
        init();
        const sub = supabase.channel('spec_chat_sync').on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations', filter: "assigned_role=eq.specialist" }, fetchConversations).subscribe();
        return () => { supabase.removeChannel(sub); };
    }, []);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
            markSupportRead(activeConversation.id, 'admin');
            const sub = supabase.channel(`spec_thread_${activeConversation.id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${activeConversation.id}` }, 
                () => { fetchMessages(activeConversation.id); markSupportRead(activeConversation.id, 'admin'); }).subscribe();
            return () => { supabase.removeChannel(sub); };
        }
    }, [activeConversation]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agentId || !activeConversation || !messageText.trim() || isSending) return;
        setIsSending(true);
        const res = await sendSupportMessage(activeConversation.id, agentId, 'admin', messageText);
        if (res.error) toast({ title: "Signal Error", variant: "destructive" });
        else setMessageText('');
        setIsSending(false);
    };

    return (
        <div className="flex h-[calc(100vh-57px)] text-white overflow-hidden bg-slate-950 font-poppins">
            {/* Sidebar */}
            <div className="w-[380px] border-r border-white/5 bg-slate-900/30 flex flex-col shrink-0">
                <div className="p-6 border-b border-white/5 space-y-4">
                    <h2 className="text-xl font-black tracking-tighter">PROTOCOL STREAM</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                        <Input 
                            placeholder="Filter ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-black/40 border-white/10 h-10 text-[10px] font-bold uppercase rounded-xl" 
                        />
                    </div>
                </div>

                <ScrollArea className="flex-grow">
                    {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20"/></div> : (
                        conversations.map(c => (
                            <button 
                                key={c.id} 
                                onClick={() => setActiveConversation(c)}
                                className={cn(
                                    "w-full p-6 border-b border-white/5 text-left transition-all hover:bg-green-500/5",
                                    activeConversation?.id === c.id && "bg-green-500/10 border-r-4 border-r-green-500"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-sm font-black truncate text-white">{c.profiles?.full_name || 'New Trader'}</p>
                                    <Badge className="bg-green-500/20 text-green-400 text-[8px] font-black border-none uppercase">{c.escalation_reason || 'Fix'}</Badge>
                                </div>
                                <p className="text-[10px] text-gray-500 truncate font-medium">{c.last_message_preview || 'Awaiting Specialist...'}</p>
                                <div className="flex items-center justify-between mt-3">
                                    <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest">{format(new Date(c.last_message_at), 'p')}</p>
                                    {c.unread_count_admin > 0 && <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(34,197,94,1)]" />}
                                </div>
                            </button>
                        ))
                    )}
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-grow flex flex-col relative bg-slate-950">
                {!activeConversation ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-12">
                        <Activity className="h-20 w-20 text-slate-900 mb-6" />
                        <h2 className="text-3xl font-black text-white tracking-tighter">PROTOCOL READY.</h2>
                        <p className="text-gray-600 text-xs font-bold uppercase tracking-[0.4em] mt-2">Select a technical mitigation to begin assistance</p>
                    </div>
                ) : (
                    <>
                        <header className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-lg leading-tight uppercase tracking-tight">{activeConversation.profiles?.full_name}</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1.5">{activeConversation.profiles?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                                    Specialist Mitigation Grid
                                </div>
                            </div>
                        </header>

                        <div ref={scrollRef} className="flex-1 p-10 overflow-y-auto bg-slate-950">
                            <div className="space-y-8 max-w-4xl mx-auto">
                                <div className="text-center py-6">
                                    <p className="text-[10px] text-gray-800 font-black uppercase tracking-[0.5em]">High-Priority Secure Tunnel Established</p>
                                </div>
                                {messages.map(m => {
                                    const isAi = m.sender_id === 'AI_SYSTEM';
                                    return (
                                        <div key={m.id} className={cn("flex items-end gap-4", m.sender_role === 'admin' ? "flex-row-reverse" : "flex-row")}>
                                            <div className={cn(
                                                "max-w-[70%] p-6 rounded-3xl text-sm leading-relaxed shadow-2xl relative", 
                                                m.sender_role === 'admin' ? (isAi ? "bg-slate-900 border border-primary/30 text-gray-200" : "bg-green-600 text-white rounded-br-none") : "bg-white/5 border border-white/5 text-gray-300 rounded-bl-none"
                                            )}>
                                                {isAi && (
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                                                        <span className="text-[8px] font-black text-primary uppercase tracking-widest">Neural Handoff</span>
                                                    </div>
                                                )}
                                                <p className="whitespace-pre-wrap font-medium">{m.message}</p>
                                                <p className="mt-4 text-[8px] opacity-30 text-right uppercase font-bold tracking-widest">{format(new Date(m.created_at), 'p')}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-8 bg-slate-900/90 border-t border-white/5 backdrop-blur-xl">
                            <form onSubmit={handleSendMessage} className="flex gap-5 max-w-5xl mx-auto">
                                <Input 
                                    placeholder="Issue response protocol..." 
                                    value={messageText} 
                                    onChange={(e) => setMessageText(e.target.value)} 
                                    className="flex-grow bg-black/40 border-white/10 h-14 text-sm text-white rounded-2xl px-6 focus:ring-green-500/50" 
                                />
                                <Button type="submit" disabled={!messageText.trim() || isSending} className="h-14 w-14 rounded-2xl bg-green-600 hover:bg-green-500 shadow-xl shadow-green-900/20 transition-all hover:scale-105 active:scale-95">
                                    {isSending ? <Loader2 className="h-6 w-6 animate-spin"/> : <Send className="h-6 w-6" />}
                                </Button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function SpecialistChat() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
            <SpecialistChatContent />
        </Suspense>
    );
}
