'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    MessageSquare, 
    Send, 
    Loader2, 
    User,
    ArrowRight,
    Headphones,
    Paperclip,
    X
} from 'lucide-react';
import { createSupportConversation, sendSupportMessage, markSupportRead } from './actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

export function SupportView({ profile, conversations }: { profile: any, conversations: any[] }) {
    const [view, setView] = useState<'options' | 'chat'>('options');
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // Automatically open the most recent active live chat if it exists
    useEffect(() => {
        const liveChat = conversations.find(c => c.subject === 'LIVE_CHAT' && c.status === 'open');
        if (liveChat && view === 'options') {
            setActiveConversation(liveChat);
            setView('chat');
        }
    }, [conversations, view]);

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
            markSupportRead(activeConversation.id, 'user');

            const channel = supabase
                .channel(`conv_${activeConversation.id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${activeConversation.id}` }, 
                () => {
                    fetchMessages(activeConversation.id);
                    markSupportRead(activeConversation.id, 'user');
                })
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeConversation || (!messageText.trim() && !selectedImage) || isSending) return;

        setIsSending(true);
        const textToSend = messageText;
        const imageToSend = selectedImage;
        
        setMessageText('');
        clearImage();

        const res = await sendSupportMessage(activeConversation.id, profile.id, 'user', textToSend, imageToSend || undefined);
        
        if (res.error) {
            setMessageText(textToSend);
            setSelectedImage(imageToSend);
            if (imageToSend) setImagePreview(URL.createObjectURL(imageToSend));
            toast({ title: "Failed to send", description: res.error, variant: "destructive" });
        }
        setIsSending(false);
    };

    if (view === 'options') {
        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 font-poppins max-w-4xl mx-auto">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Live Chat</h2>
                    <p className="text-gray-400 text-sm font-medium">Chat directly with our support desk for instant assistance.</p>
                </div>

                <div className="pt-8">
                    <GlassCard className="p-12 flex flex-col items-center text-center space-y-6 hover:border-primary transition-all group">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-[0_0_50px_rgba(139,44,245,0.1)]">
                            <Headphones className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white">Need a helping hand?</h3>
                            <p className="text-gray-400 text-sm font-medium max-w-[300px]">Our agents are available to help you with your account, payments, or trading rules.</p>
                        </div>
                        <Button onClick={handleStartChat} disabled={isPending} size="lg" className="px-12 h-14 font-bold rounded-2xl shadow-xl shadow-primary/20 text-base">
                            {isPending ? <Loader2 className="animate-spin mr-2" /> : <MessageSquare className="mr-2 h-5 w-5" />}
                            Start Live Chat
                        </Button>
                    </GlassCard>
                </div>

                {conversations.length > 0 && (
                    <div className="pt-12">
                        <h4 className="text-[10px] font-bold text-gray-600 mb-4 uppercase tracking-widest">Chat History</h4>
                        <div className="grid gap-3">
                            {conversations.map(c => (
                                <button key={c.id} onClick={() => { setActiveConversation(c); setView('chat'); }} className="w-full text-left bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-white/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center">
                                            <MessageSquare className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Support Session</p>
                                            <p className="text-[10px] text-gray-500">{new Date(c.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {c.unread_count_user > 0 && (
                                            <Badge className="bg-red-500 text-white font-bold h-5 min-w-5 flex items-center justify-center rounded-full text-[10px]">
                                                {c.unread_count_user}
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className={cn("text-[9px] font-bold px-2.5 border-none", c.status === 'open' ? "text-green-400 bg-green-500/5" : "text-gray-500")}>{c.status === 'open' ? 'Active' : 'Closed'}</Badge>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto h-[65vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 font-poppins">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setView('options')} className="text-gray-500 hover:text-white">
                        <ArrowRight className="rotate-180 h-5 w-5" />
                    </Button>
                    <div>
                        <h3 className="font-bold text-white text-base leading-none">Live Chat</h3>
                    </div>
                </div>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20 font-bold text-[9px] px-2.5">Agent Live</Badge>
            </div>

            <GlassCard className="flex-grow flex flex-col p-0 border-white/10 shadow-2xl">
                <ScrollArea ref={scrollRef} className="flex-1 p-6">
                    <div className="space-y-6">
                        <div className="text-center py-8 border-b border-white/5 mb-6">
                             <p className="text-[10px] text-gray-700 font-bold uppercase tracking-[0.3em]">Secure connection established</p>
                        </div>
                        {messages.map((m) => (
                            <div key={m.id} className={cn("flex items-end gap-3", m.sender_role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                <div className={cn("h-7 w-7 rounded-full border border-white/10 flex items-center justify-center shrink-0", m.sender_role === 'user' ? "bg-primary/20 text-primary" : "bg-white/10 text-white")}>
                                    {m.sender_role === 'user' ? <User className="h-3.5 w-3.5" /> : <Headphones className="h-3.5 w-3.5" />}
                                </div>
                                <div className={cn("max-w-[75%] p-4 rounded-2xl text-xs leading-relaxed", m.sender_role === 'user' ? "bg-primary text-white rounded-br-none" : "bg-white/5 border border-white/5 text-gray-300 rounded-bl-none shadow-lg")}>
                                    {m.image_url && (
                                        <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                                            <Image src={m.image_url} alt="Support Attachment" width={250} height={250} className="object-cover" />
                                        </div>
                                    )}
                                    <p className="whitespace-pre-wrap">{m.message}</p>
                                    <div className="mt-2 text-[8px] opacity-30 font-bold text-right">
                                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {imagePreview && (
                    <div className="px-5 py-3 bg-black/60 border-t border-white/10 flex items-center gap-4">
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-white/20">
                            <Image src={imagePreview} alt="Preview" layout="fill" className="object-cover" />
                            <button onClick={clearImage} className="absolute top-0.5 right-0.5 bg-red-500 rounded-full p-0.5"><X className="h-3 w-3 text-white"/></button>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image attached for query</p>
                    </div>
                )}

                <div className="p-5 bg-slate-900/90 border-t border-white/5 backdrop-blur-xl">
                    <form onSubmit={handleSendMessage} className="flex gap-4">
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-12 w-12 text-gray-500 hover:text-white rounded-xl bg-black/40 border border-white/10">
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <Input 
                            autoComplete="off" 
                            placeholder="Type your message..." 
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            disabled={isSending}
                            className="flex-grow bg-black/40 border-white/10 h-12 text-sm text-white rounded-xl px-5 focus:ring-primary/50" 
                        />
                        <Button type="submit" size="icon" disabled={(!messageText.trim() && !selectedImage) || isSending} className="h-12 w-12 rounded-xl bg-primary text-white shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            {isSending ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
                        </Button>
                    </form>
                </div>
            </GlassCard>
        </div>
    );
}
