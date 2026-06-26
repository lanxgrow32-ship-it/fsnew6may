'use client';

import { useState, useEffect, useRef } from 'react';
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
    X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sendSupportMessage, markSupportRead } from '@/app/welcome/actions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function AgentLiveChat() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [agentId, setAgentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const supabase = createClient();

    // Isolated container auto-scroll logic
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

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
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setAgentId(user.id);
            }
            fetchConversations();
        };
        init();

        const sub = supabase
            .channel('global_agent_support')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations' }, fetchConversations)
            .subscribe();
        return () => { supabase.removeChannel(sub); };
    }, []);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
            // Clear unread count for admin when chat is opened
            markSupportRead(activeConversation.id, 'admin');

            const sub = supabase
                .channel(`agent_conv_${activeConversation.id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${activeConversation.id}` }, 
                () => {
                    fetchMessages(activeConversation.id);
                    markSupportRead(activeConversation.id, 'admin');
                })
                .subscribe();
            return () => { supabase.removeChannel(sub); };
        }
    }, [activeConversation]);

    // Triggers isolated scroll whenever messages update
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
        const finalAgentId = agentId;
        if (!finalAgentId || !activeConversation || (!messageText.trim() && !selectedImage) || isSending) return;

        setIsSending(true);
        const textToSend = messageText;
        const imageToSend = selectedImage;
        
        setMessageText('');
        clearImage();

        const res = await sendSupportMessage(activeConversation.id, finalAgentId, 'admin', textToSend, imageToSend || undefined);
        
        if (res.error) {
            setMessageText(textToSend);
            setSelectedImage(imageToSend);
            if (imageToSend) setImagePreview(URL.createObjectURL(imageToSend));
            toast({ title: "Failed to send message", description: res.error, variant: "destructive" });
        } else {
            // Force isolated scroll after sending
            setTimeout(scrollToBottom, 50);
        }
        setIsSending(false);
    };

    return (
        <div className="flex h-[calc(100vh-57px)] text-white overflow-hidden bg-slate-950 font-poppins">
            {/* Conversations Sidebar */}
            <div className="w-80 border-r border-white/5 bg-slate-900/30 flex flex-col shrink-0">
                <div className="p-6 border-b border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
                        <Input placeholder="Search chats..." className="pl-9 bg-black/40 border-white/10 h-10 text-xs font-semibold rounded-xl" />
                    </div>
                </div>
                <ScrollArea className="flex-grow">
                    {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20"/></div> : (
                        conversations.map(c => (
                            <button 
                                key={c.id} 
                                onClick={() => setActiveConversation(c)}
                                className={cn(
                                    "w-full p-4 border-b border-white/5 text-left transition-all hover:bg-white/5 flex items-center justify-between group",
                                    activeConversation?.id === c.id && "bg-primary/10 border-r-2 border-r-primary"
                                )}
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-bold truncate max-w-[140px] text-white group-hover:text-primary transition-colors">{c.profiles?.full_name || 'New Trader'}</p>
                                    <p className="text-[11px] text-gray-500 font-medium truncate italic mt-0.5">
                                        {c.last_message_preview || 'No messages yet...'}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                                    {c.unread_count_admin > 0 && (
                                        <Badge className="bg-primary text-white font-bold h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] animate-pulse">
                                            {c.unread_count_admin}
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className={cn("text-[9px] font-bold px-2 py-0 border-none", c.status === 'open' ? "text-green-400 bg-green-500/5" : "text-gray-500")}>{c.status === 'open' ? 'Active' : 'Closed'}</Badge>
                                </div>
                            </button>
                        ))
                    )}
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-grow flex flex-col relative bg-slate-950 overflow-hidden">
                {!activeConversation ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-12">
                        <Inbox className="h-16 w-16 text-gray-900 mb-6" />
                        <h2 className="text-2xl font-bold text-white tracking-tight">Chat Desk</h2>
                        <p className="text-gray-500 text-sm font-medium max-w-xs mt-2">Select a chat session to start messaging.</p>
                    </div>
                ) : (
                    <>
                        <header className="p-5 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-base leading-none">{activeConversation.profiles?.full_name || 'Trader'}</h3>
                                    <p className="text-[11px] text-gray-500 font-medium mt-1.5">{activeConversation.profiles?.email}</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="bg-black/20 border-white/10 text-xs font-bold h-8 px-4 rounded-lg">Close Chat</Button>
                        </header>

                        <div 
                            ref={scrollRef}
                            className="flex-grow p-6 overflow-y-auto bg-slate-950 scroll-smooth"
                        >
                            <div className="space-y-6 max-w-3xl mx-auto">
                                <div className="text-center py-4 border-b border-white/5 mb-8">
                                    <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Protocol connection established</p>
                                </div>
                                {messages.map(m => (
                                    <div key={m.id} className={cn("flex items-end gap-3", m.sender_role === 'admin' ? "flex-row-reverse" : "flex-row")}>
                                        <div className={cn("max-w-[75%] p-4 rounded-2xl text-xs leading-relaxed shadow-lg", m.sender_role === 'admin' ? "bg-primary text-white rounded-br-none" : "bg-white/5 border border-white/5 text-gray-300 rounded-bl-none")}>
                                            {m.image_url && (
                                                <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                                                    <Image src={m.image_url} alt="Agent Attachment" width={250} height={250} className="object-cover" />
                                                </div>
                                            )}
                                            <p className="whitespace-pre-wrap">{m.message}</p>
                                            <p className="mt-2 text-[8px] opacity-30 font-bold text-right uppercase tracking-tighter">
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {imagePreview && (
                            <div className="px-5 py-3 bg-black/60 border-t border-white/10 flex items-center gap-4 animate-in slide-in-from-bottom-2 shrink-0">
                                <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-white/20">
                                    <Image src={imagePreview} alt="Preview" layout="fill" className="object-cover" />
                                    <button onClick={clearImage} className="absolute top-0.5 right-0.5 bg-red-500 rounded-full p-0.5"><X className="h-3 w-3 text-white"/></button>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image attachment ready</p>
                            </div>
                        )}

                        <div className="p-5 bg-slate-900/80 border-t border-white/5 backdrop-blur-xl shrink-0">
                            <form onSubmit={handleSendMessage} className="flex gap-4 max-w-4xl mx-auto">
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-12 w-12 text-gray-500 hover:text-white rounded-xl bg-black/40 border border-white/10">
                                    <Paperclip className="h-5 w-5" />
                                </Button>
                                <Input 
                                    autoComplete="off" 
                                    placeholder="Type a response..." 
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    disabled={isSending}
                                    className="flex-grow bg-black/40 border-white/10 h-12 text-sm text-white rounded-xl px-5 focus:ring-primary/50" 
                                />
                                <Button type="submit" size="icon" disabled={(!messageText.trim() && !selectedImage) || isSending} className="h-12 w-12 rounded-xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary">
                                    {isSending ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5 text-white" />}
                                </Button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
