'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
    MessageSquare, 
    LifeBuoy, 
    Send, 
    Loader2, 
    Clock, 
    User,
    CheckCircle,
    Paperclip,
    ArrowRight,
    Headphones
} from 'lucide-react';
import { createSupportConversation, sendSupportMessage } from './actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

export function SupportView({ profile, conversations }: { profile: any, conversations: any[] }) {
    const [view, setView] = useState<'options' | 'chat' | 'ticket-form'>('options');
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const fetchMessages = async (convId: string) => {
        const { data } = await supabase
            .from('support_messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });
        setMessages(data || []);
    };

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
            const channel = supabase
                .channel(`conv_${activeConversation.id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${activeConversation.id}` }, 
                () => fetchMessages(activeConversation.id))
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [activeConversation]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleStartChat = () => {
        const existingLiveChat = conversations.find(c => c.subject === 'LIVE_CHAT' && c.status === 'open');
        if (existingLiveChat) {
            setActiveConversation(existingLiveChat);
            setView('chat');
        } else {
            startTransition(async () => {
                const res = await createSupportConversation(profile.id, 'LIVE_CHAT');
                if (res.error) toast({ title: "Error", description: res.error, variant: "destructive" });
                else {
                    setActiveConversation(res.data);
                    setView('chat');
                }
            });
        }
    };

    const handleNewTicket = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const subject = formData.get('subject') as string;
        const message = formData.get('message') as string;

        startTransition(async () => {
            const res = await createSupportConversation(profile.id, subject, message);
            if (res.error) toast({ title: "Error", description: res.error, variant: "destructive" });
            else {
                toast({ title: "Ticket Created", description: "Our team will review your request shortly." });
                setActiveConversation(res.data);
                setView('chat');
            }
        });
    };

    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const message = new FormData(form).get('message') as string;
        if (!message.trim()) return;

        form.reset();
        await sendSupportMessage(activeConversation.id, profile.id, 'user', message);
    };

    if (view === 'options') {
        return (
            <div className="space-y-8 animate-in fade-in zoom-in-95">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Support Hub</h2>
                    <p className="text-gray-400 text-lg mt-1 font-medium">How can we assist your trading journey today?</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 pt-8">
                    <GlassCard className="p-8 flex flex-col items-center text-center space-y-6 hover:border-primary transition-all group">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Headphones className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white">Live Assistance</h3>
                            <p className="text-gray-400 text-sm font-medium max-w-xs">Direct encrypted line to our senior support desk.</p>
                        </div>
                        <Button onClick={handleStartChat} disabled={isPending} size="lg" className="w-full h-12 font-bold rounded-xl shadow-xl shadow-primary/20">
                            {isPending ? <Loader2 className="animate-spin mr-2" /> : <MessageSquare className="mr-2" />}
                            Start Chat
                        </Button>
                    </GlassCard>

                    <GlassCard className="p-8 flex flex-col items-center text-center space-y-6 hover:border-primary transition-all group">
                        <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <LifeBuoy className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white">Raise a Ticket</h3>
                            <p className="text-gray-400 text-sm font-medium max-w-xs">Formal request for technical or account escalations.</p>
                        </div>
                        <Button onClick={() => setView('ticket-form')} variant="outline" size="lg" className="w-full h-12 font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl">
                            New Support Ticket
                        </Button>
                    </GlassCard>
                </div>

                {conversations.length > 0 && (
                    <div className="pt-12">
                        <h4 className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider">Active Interactions</h4>
                        <div className="grid gap-4">
                            {conversations.map(c => (
                                <button key={c.id} onClick={() => { setActiveConversation(c); setView('chat'); }} className="w-full text-left bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-white/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                                            {c.subject === 'LIVE_CHAT' ? <MessageSquare className="w-5 h-5 text-primary" /> : <LifeBuoy className="w-5 h-5 text-purple-400" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{c.subject === 'LIVE_CHAT' ? 'Live Session' : c.subject}</p>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={cn("text-[10px] font-bold px-3", c.status === 'open' ? "text-green-400 border-green-500/20 bg-green-500/5" : "text-gray-500")}>{c.status}</Badge>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (view === 'ticket-form') {
        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <Button variant="ghost" onClick={() => setView('options')} className="text-gray-500 hover:text-white font-bold"><ArrowRight className="rotate-180 mr-2 h-4 w-4" /> Back to Hub</Button>
                <GlassCard>
                    <form onSubmit={handleNewTicket}>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white">Create Support Ticket</CardTitle>
                            <CardDescription className="font-medium">Detail your request below for official escalation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500">Subject</Label>
                                <Input name="subject" placeholder="e.g. KYC Verification Hold" required className="bg-black/20 border-white/10 h-12 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500">Detailed Description</Label>
                                <Textarea name="message" rows={5} placeholder="Provide full context for our team..." required className="bg-black/20 border-white/10 text-white" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isPending} className="w-full h-12 font-bold rounded-xl shadow-lg shadow-primary/20">
                                {isPending ? <Loader2 className="animate-spin mr-2" /> : <LifeBuoy className="mr-2 h-4 w-4" />}
                                Submit Protocol
                            </Button>
                        </CardFooter>
                    </form>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto h-[70vh] flex flex-col animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setView('options')} className="text-gray-500 hover:text-white">
                        <ArrowRight className="rotate-180" />
                    </Button>
                    <div>
                        <h3 className="font-bold text-white text-lg leading-none">{activeConversation.subject === 'LIVE_CHAT' ? 'Direct Terminal Chat' : activeConversation.subject}</h3>
                        <p className="text-[10px] text-gray-600 font-bold mt-2">Active Encrypted Session</p>
                    </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/20 font-bold text-[10px] px-3">Agent Connected</Badge>
            </div>

            <GlassCard className="flex-grow flex flex-col p-0">
                <ScrollArea ref={scrollRef} className="flex-grow p-6 h-[400px]">
                    <div className="space-y-6">
                        <div className="text-center py-8">
                             <LifeBuoy className="h-10 w-10 text-gray-800 mx-auto mb-2" />
                             <p className="text-[10px] text-gray-700 font-bold">Protocol Session Initiated</p>
                        </div>
                        {messages.map((m) => (
                            <div key={m.id} className={cn("flex items-end gap-3", m.sender_role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                <div className={cn("h-8 w-8 rounded-full border border-white/10 flex items-center justify-center shrink-0", m.sender_role === 'user' ? "bg-primary/20 text-primary" : "bg-white/10 text-white")}>
                                    {m.sender_role === 'user' ? <User className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                                </div>
                                <div className={cn("max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed", m.sender_role === 'user' ? "bg-primary text-white rounded-br-none" : "bg-black/40 border border-white/5 text-gray-300 rounded-bl-none")}>
                                    {m.message}
                                    <div className="mt-2 text-[9px] opacity-40 font-bold">
                                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md">
                    <form onSubmit={handleSendMessage} className="flex gap-4">
                        <Input name="message" autoComplete="off" placeholder="Type your response..." className="flex-grow bg-black/40 border-white/10 h-12 text-white" />
                        <Button type="submit" size="icon" className="h-12 w-12 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            </GlassCard>
        </div>
    );
}