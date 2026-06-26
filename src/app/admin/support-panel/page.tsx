'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    MessageSquare, 
    LifeBuoy, 
    Send, 
    Loader2, 
    User,
    Headphones,
    Search,
    CheckCircle,
    Inbox,
    ArrowRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sendSupportMessage } from '@/app/welcome/actions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SupportAgentPanel() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const fetchConversations = async () => {
        const { data } = await supabase
            .from('support_conversations')
            .select('*, profiles:user_id(full_name, email)')
            .order('last_message_at', { ascending: false });
        setConversations(data || []);
        setLoading(false);
    };

    const fetchMessages = async (convId: string) => {
        const { data } = await supabase
            .from('support_messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });
        setMessages(data || []);
    };

    useEffect(() => {
        fetchConversations();
        const sub = supabase
            .channel('global_support')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations' }, fetchConversations)
            .subscribe();
        return () => { supabase.removeChannel(sub); };
    }, []);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
            const sub = supabase
                .channel(`admin_conv_${activeConversation.id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${activeConversation.id}` }, 
                () => fetchMessages(activeConversation.id))
                .subscribe();
            return () => { supabase.removeChannel(sub); };
        }
    }, [activeConversation]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const msg = new FormData(form).get('message') as string;
        if (!msg.trim()) return;
        form.reset();
        await sendSupportMessage(activeConversation.id, 'AGENT_SYSTEM', 'admin', msg);
    };

    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 border-r border-white/5 bg-slate-900/50 flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <h1 className="text-xl font-black tracking-tighter">Support Agent Panel</h1>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
                        <Input placeholder="Search sessions..." className="pl-8 bg-black/20 border-white/10 h-9 text-xs" />
                    </div>
                </div>
                <ScrollArea className="flex-grow">
                    {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto opacity-20"/></div> : (
                        conversations.map(c => (
                            <button 
                                key={c.id} 
                                onClick={() => setActiveConversation(c)}
                                className={cn(
                                    "w-full p-4 border-b border-white/5 text-left transition-all hover:bg-white/5",
                                    activeConversation?.id === c.id && "bg-primary/10 border-r-2 border-r-primary"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-sm font-bold truncate max-w-[140px]">{c.profiles?.full_name}</p>
                                    <Badge variant="outline" className={cn("text-[8px] px-1", c.status === 'open' ? "text-green-400 border-green-500/20" : "text-gray-500")}>{c.status}</Badge>
                                </div>
                                <p className="text-[10px] text-gray-500 truncate mb-2">{c.subject === 'LIVE_CHAT' ? 'LIVE ASSISTANCE' : c.subject}</p>
                                <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest">{new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </button>
                        ))
                    )}
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-grow flex flex-col relative">
                {!activeConversation ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-12">
                        <Inbox className="h-16 w-16 text-gray-800 mb-4" />
                        <h2 className="text-2xl font-black text-white">Inbox Zero.</h2>
                        <p className="text-gray-600 text-sm max-w-xs mt-2">Select a support session from the sidebar to begin helping your users.</p>
                    </div>
                ) : (
                    <>
                        <header className="p-4 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">{activeConversation.profiles?.full_name}</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{activeConversation.profiles?.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="bg-black/20 border-white/10 text-xs h-8">Close Session</Button>
                            </div>
                        </header>

                        <ScrollArea ref={scrollRef} className="flex-grow p-8">
                            <div className="space-y-6 max-w-3xl mx-auto">
                                <div className="text-center py-4">
                                    <p className="text-[9px] text-gray-800 font-black uppercase tracking-[0.4em]">Protocol Session Initiated</p>
                                </div>
                                {messages.map(m => (
                                    <div key={m.id} className={cn("flex items-end gap-3", m.sender_role === 'admin' ? "flex-row-reverse" : "flex-row")}>
                                        <div className={cn("max-w-[75%] p-4 rounded-2xl text-sm", m.sender_role === 'admin' ? "bg-primary text-white rounded-br-none" : "bg-white/5 border border-white/5 text-gray-300 rounded-bl-none")}>
                                            {m.message}
                                            <p className="mt-2 text-[8px] opacity-30 font-black uppercase tracking-widest">{new Date(m.created_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="p-6 bg-slate-900/80 border-t border-white/5 backdrop-blur-md">
                            <form onSubmit={handleSendMessage} className="flex gap-4 max-w-4xl mx-auto">
                                <Input name="message" autoComplete="off" placeholder="Type your response..." className="flex-grow bg-black/40 border-white/10 h-12" />
                                <Button type="submit" className="h-12 w-12 rounded-xl">
                                    <Send className="h-5 w-5" />
                                </Button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}