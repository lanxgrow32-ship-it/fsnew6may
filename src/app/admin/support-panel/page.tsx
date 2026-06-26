'use client';

import { useState, useEffect, useRef } from 'react';
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
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
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
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-poppins">
            {/* Sidebar */}
            <div className="w-85 border-r border-white/5 bg-slate-900/50 flex flex-col">
                <div className="p-8 border-b border-white/5">
                    <h1 className="text-2xl font-black tracking-tighter">Support Terminal</h1>
                    <div className="relative mt-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                        <Input placeholder="Filter sessions..." className="pl-10 bg-black/40 border-white/10 h-11 text-xs font-bold uppercase tracking-widest" />
                    </div>
                </div>
                <ScrollArea className="flex-grow">
                    {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20"/></div> : (
                        conversations.map(c => (
                            <button 
                                key={c.id} 
                                onClick={() => setActiveConversation(c)}
                                className={cn(
                                    "w-full p-5 border-b border-white/5 text-left transition-all hover:bg-white/5",
                                    activeConversation?.id === c.id && "bg-primary/10 border-r-4 border-r-primary"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-sm font-black truncate max-w-[150px]">{c.profiles?.full_name}</p>
                                    <Badge variant="outline" className={cn("text-[9px] px-2 font-black uppercase tracking-widest", c.status === 'open' ? "text-green-400 border-green-500/20 bg-green-500/5" : "text-gray-500")}>{c.status}</Badge>
                                </div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate mb-3">{c.subject === 'LIVE_CHAT' ? 'DIRECT LIVE CHAT' : c.subject}</p>
                                <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.3em]">{new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </button>
                        ))
                    )}
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-grow flex flex-col relative">
                {!activeConversation ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-12">
                        <Inbox className="h-20 w-20 text-gray-900 mb-6" />
                        <h2 className="text-3xl font-black text-white tracking-tighter">Terminal Ready.</h2>
                        <p className="text-gray-600 text-lg font-medium max-w-sm mt-2">Select a protocol session from the sidebar to begin assistance.</p>
                    </div>
                ) : (
                    <>
                        <header className="p-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-xl tracking-tight">{activeConversation.profiles?.full_name}</h3>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-1">{activeConversation.profiles?.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" size="sm" className="bg-black/20 border-white/10 text-[10px] font-black uppercase tracking-widest h-10 px-6">Archive Protocol</Button>
                            </div>
                        </header>

                        <ScrollArea ref={scrollRef} className="flex-grow p-10 bg-slate-950">
                            <div className="space-y-8 max-w-4xl mx-auto">
                                <div className="text-center py-6">
                                    <p className="text-[9px] text-gray-800 font-black uppercase tracking-[0.5em]">Secure Agent Connection Established</p>
                                </div>
                                {messages.map(m => (
                                    <div key={m.id} className={cn("flex items-end gap-4", m.sender_role === 'admin' ? "flex-row-reverse" : "flex-row")}>
                                        <div className={cn("max-w-[70%] p-5 rounded-3xl text-sm leading-relaxed shadow-lg", m.sender_role === 'admin' ? "bg-primary text-white rounded-br-none" : "bg-white/5 border border-white/5 text-gray-300 rounded-bl-none")}>
                                            {m.message}
                                            <p className="mt-3 text-[9px] opacity-40 font-black uppercase tracking-[0.2em]">{new Date(m.created_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="p-8 bg-slate-900/90 border-t border-white/5 backdrop-blur-xl">
                            <form onSubmit={handleSendMessage} className="flex gap-5 max-w-5xl mx-auto">
                                <Input name="message" autoComplete="off" placeholder="Type agent response..." className="flex-grow bg-black/40 border-white/10 h-14 text-white rounded-2xl px-6" />
                                <Button type="submit" className="h-14 w-14 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                    <Send className="h-6 w-6" />
                                </Button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}