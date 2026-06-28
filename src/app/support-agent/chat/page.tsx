
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
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
    ShieldCheck,
    Briefcase,
    Calendar,
    Upload,
    CheckCircle,
    Info,
    ExternalLink,
    ChevronLeft
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sendSupportMessage, markSupportRead } from '@/app/welcome/actions';
import { manualVerifyKyc } from '../actions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AgentLiveChat() {
    const isMobile = useIsMobile();
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [userAccounts, setUserAccounts] = useState<any[]>([]);
    const [agentId, setAgentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    const [kycImg1, setKycImg1] = useState<File | null>(null);
    const [kycImg2, setKycImg2] = useState<File | null>(null);
    const [isKycPending, startKycTransition] = useTransition();

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const supabase = createClient();

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const fetchConversations = async () => {
        const { data } = await supabase.from('support_conversations').select('*, profiles:user_id(full_name, email)').order('last_message_at', { ascending: false });
        setConversations(data || []);
        setLoading(false);
    };

    const fetchMessages = async (convId: string) => {
        const { data } = await supabase.from('support_messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true });
        setMessages(data || []);
    };

    const fetchUserDetails = async (userId: string) => {
        const [profileRes, accountsRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId).single(),
            supabase.from('user_accounts').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        ]);
        setUserInfo(profileRes.data);
        setUserAccounts(accountsRes.data || []);
    };

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setAgentId(user.id);
            fetchConversations();
        };
        init();
        const sub = supabase.channel('agent_realtime_v3').on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations' }, fetchConversations).subscribe();
        return () => { supabase.removeChannel(sub); };
    }, []);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
            fetchUserDetails(activeConversation.user_id);
            markSupportRead(activeConversation.id, 'admin');
            const sub = supabase.channel(`agent_conv_${activeConversation.id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${activeConversation.id}` }, 
                () => { fetchMessages(activeConversation.id); markSupportRead(activeConversation.id, 'admin'); }).subscribe();
            return () => { supabase.removeChannel(sub); };
        }
    }, [activeConversation]);

    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agentId || !activeConversation || (!messageText.trim() && !selectedImage) || isSending) return;
        setIsSending(true);
        const res = await sendSupportMessage(activeConversation.id, agentId, 'admin', messageText, selectedImage || undefined);
        if (res.error) toast({ title: "Failed to send", variant: "destructive" });
        else { setMessageText(''); setSelectedImage(null); setImagePreview(null); }
        setIsSending(false);
    };

    const handleManualKyc = async () => {
        if (!kycImg1 || !kycImg2 || !userInfo) return;
        startKycTransition(async () => {
            const formData = new FormData();
            formData.append('id', userInfo.id);
            formData.append('aadhaar_photo', kycImg1);
            formData.append('selfie_photo', kycImg2);
            const res = await manualVerifyKyc(formData);
            if (res.success) {
                toast({ title: "Verified", description: "User account live." });
                fetchUserDetails(userInfo.id);
                setKycImg1(null); setKycImg2(null);
            } else toast({ title: "Error", description: res.error, variant: "destructive" });
        });
    };

    const handleSelectConversation = (c: any) => {
        setActiveConversation(c);
        if (isMobile) setMobileView('chat');
    };

    return (
        <div className="flex h-[calc(100vh-57px)] text-white overflow-hidden bg-slate-950 font-poppins">
            {/* Sidebar (List View) */}
            <div className={cn(
                "w-full md:w-80 border-r border-white/5 bg-slate-900/30 flex flex-col shrink-0 transition-all",
                isMobile && mobileView === 'chat' && "hidden md:flex"
            )}>
                <div className="p-6 border-b border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
                        <Input placeholder="Search chats..." className="pl-9 bg-black/40 border-white/10 h-10 text-xs font-semibold rounded-xl" />
                    </div>
                </div>
                <ScrollArea className="flex-grow">
                    {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20"/></div> : (
                        conversations.map(c => (
                            <button key={c.id} onClick={() => handleSelectConversation(c)} className={cn("w-full p-4 border-b border-white/5 text-left transition-all hover:bg-white/5 flex items-center justify-between group", activeConversation?.id === c.id && "bg-primary/10 border-r-2 border-r-primary")}>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold truncate text-white group-hover:text-primary">{c.profiles?.full_name || 'New Trader'}</p>
                                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{c.last_message_preview || 'No messages...'}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                    {c.unread_count_admin > 0 && <Badge className="bg-primary text-white h-4 min-w-4 flex items-center justify-center rounded-full text-[9px]">{c.unread_count_admin}</Badge>}
                                    <Badge variant="outline" className={cn("text-[8px] font-bold px-1.5 border-none", c.status === 'open' ? "text-green-400 bg-green-500/5" : "text-gray-500")}>{c.status}</Badge>
                                </div>
                            </button>
                        ))
                    )}
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className={cn(
                "flex-grow flex flex-col relative bg-slate-950 overflow-hidden transition-all",
                isMobile && mobileView === 'list' && "hidden md:flex"
            )}>
                {!activeConversation ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-12">
                        <Inbox className="h-16 w-16 text-gray-900 mb-6" />
                        <h2 className="text-2xl font-bold text-white tracking-tight">Agent Desk</h2>
                        <p className="text-gray-500 text-sm max-w-xs mt-2">Select a session to start assistance.</p>
                    </div>
                ) : (
                    <>
                        <header className="p-5 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                {isMobile && <Button variant="ghost" size="icon" onClick={() => setMobileView('list')} className="text-gray-500"><ChevronLeft className="h-5 w-5"/></Button>}
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20"><User className="h-5 w-5" /></div>
                                <div>
                                    <h3 className="font-bold text-white text-base leading-none">{activeConversation.profiles?.full_name}</h3>
                                    <p className="text-[11px] text-gray-500 font-medium mt-1.5">{activeConversation.profiles?.email}</p>
                                </div>
                            </div>
                        </header>

                        <div ref={scrollRef} className="flex-grow p-5 overflow-y-auto bg-slate-950 scroll-smooth">
                            <div className="space-y-6 max-w-3xl mx-auto">
                                {messages.map(m => (
                                    <div key={m.id} className={cn("flex items-end gap-3", m.sender_role === 'admin' ? "flex-row-reverse" : "flex-row")}>
                                        <div className={cn("max-w-[85%] p-4 rounded-2xl text-xs shadow-lg", m.sender_role === 'admin' ? "bg-primary text-white rounded-br-none" : "bg-white/5 border border-white/5 text-gray-300 rounded-bl-none")}>
                                            {m.image_url && <div className="mb-2 rounded-lg overflow-hidden border border-white/10"><Image src={m.image_url} alt="Support" width={250} height={250} className="object-cover" /></div>}
                                            <p className="whitespace-pre-wrap">{m.message}</p>
                                            <p className="mt-2 text-[8px] opacity-30 text-right uppercase">{format(new Date(m.created_at), 'p')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-900/80 border-t border-white/5 backdrop-blur-xl shrink-0">
                            <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
                                <Input placeholder="Type response..." value={messageText} onChange={(e) => setMessageText(e.target.value)} className="flex-grow bg-black/40 border-white/10 h-12 text-sm text-white rounded-xl" />
                                <Button type="submit" size="icon" disabled={(!messageText.trim() && !selectedImage) || isSending} className="h-12 w-12 rounded-xl bg-primary"><Send className="h-5 w-5" /></Button>
                            </form>
                        </div>
                    </>
                )}
            </div>

            {/* Info Sidepanel (Desktop Only) */}
            {activeConversation && !isMobile && (
                <div className="w-80 border-l border-white/5 bg-slate-900/30 flex flex-col shrink-0 overflow-y-auto">
                    <div className="p-6 space-y-8">
                        <section className="space-y-4">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Info className="w-3.5 h-3.5"/> Trader Intelligence</h4>
                            <div className="space-y-3">
                                <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                                    <p className="text-[10px] text-gray-600 font-bold uppercase">KYC Status</p>
                                    <Badge variant="outline" className={cn("mt-1.5 border-none font-bold uppercase text-[9px]", userInfo?.kyc_status === 'verified' ? "bg-green-500/10 text-green-400" : "bg-amber-400/10 text-amber-400")}>{userInfo?.kyc_status || 'Pending'}</Badge>
                                </div>
                                <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                                    <p className="text-[10px] text-gray-600 font-bold uppercase">Contact</p>
                                    <p className="text-xs font-bold text-white mt-1">{userInfo?.mobile_number || 'No Phone'}</p>
                                </div>
                            </div>
                        </section>
                        <section className="space-y-4">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Briefcase className="w-3.5 h-3.5"/> Portfolio</h4>
                            <div className="space-y-3">
                                {userAccounts.map(acc => (
                                    <div key={acc.id} className="p-4 bg-black/20 rounded-2xl border border-white/5 group hover:bg-black/40">
                                        <p className="text-[11px] font-bold text-white truncate">{acc.plan_name}</p>
                                        <div className="flex items-center justify-between mt-3">
                                            <Badge variant="outline" className="text-[8px] uppercase px-1.5">{acc.status}</Badge>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" asChild><Link href={`/admin/profile/${userInfo.id}`}><ExternalLink className="w-3 h-3 text-primary"/></Link></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}
