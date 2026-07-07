'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
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
    ChevronLeft,
    Trash2,
    CheckSquare,
    Square,
    BrainCircuit,
    AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sendSupportMessage, markSupportRead, deleteSupportConversation } from '@/app/welcome/actions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    const [searchTerm, setSearchTerm] = useState('');
    
    // Bulk Delete State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
        const sub = supabase.channel('agent_realtime_v7').on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations' }, fetchConversations).subscribe();
        return () => { supabase.removeChannel(sub); };
    }, []);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
            fetchUserDetails(activeConversation.user_id);
            markSupportRead(activeConversation.id, 'admin');
            const sub = supabase.channel(`agent_conv_v7_${activeConversation.id}`)
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

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        try {
            await Promise.all(selectedIds.map(id => deleteSupportConversation(id)));
            toast({ title: `${selectedIds.length} conversations purged.` });
            setSelectedIds([]);
            if (selectedIds.includes(activeConversation?.id)) {
                setActiveConversation(null);
                setMessages([]);
            }
            fetchConversations();
        } catch (e) {
            toast({ title: "Bulk delete failed", variant: "destructive" });
        }
        setIsBulkDeleting(false);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = (filteredList: any[]) => {
        if (selectedIds.length === filteredList.length) setSelectedIds([]);
        else setSelectedIds(filteredList.map(c => c.id));
    };

    const filteredConversations = conversations.filter(c => 
        c.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const humanQueue = filteredConversations.filter(c => c.assigned_role === 'human');
    const aiSessions = filteredConversations.filter(c => c.assigned_role === 'ai');

    const handleSelectConversation = (c: any) => {
        setActiveConversation(c);
        if (isMobile) setMobileView('chat');
    };

    return (
        <div className="flex h-[calc(100vh-57px)] text-white overflow-hidden bg-slate-950 font-poppins">
            {/* Sidebar (List View) */}
            <div className={cn(
                "w-full md:w-[400px] border-r border-white/5 bg-slate-900/30 flex flex-col shrink-0 transition-all",
                isMobile && mobileView === 'chat' && "hidden md:flex"
            )}>
                <Tabs defaultValue="all" className="flex flex-col h-full">
                    <div className="px-6 pt-6 pb-2 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                            <Input 
                                placeholder="Search traders..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-black/40 border-white/10 h-11 text-xs font-semibold rounded-xl" 
                            />
                        </div>
                        <TabsList className="bg-black/40 border border-white/5 w-full rounded-xl h-11 p-1">
                            <TabsTrigger value="all" className="flex-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">All</TabsTrigger>
                            <TabsTrigger value="human" className="flex-1 rounded-lg text-[10px] font-bold uppercase tracking-widest gap-2">
                                Human 
                                {humanQueue.length > 0 && <span className="h-2 w-2 rounded-full bg-primary animate-pulse"/>}
                            </TabsTrigger>
                            <TabsTrigger value="ai" className="flex-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">Neural</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-grow">
                        {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20"/></div> : (
                            <>
                                <TabsContent value="all" className="mt-0">
                                    <ConversationList list={filteredConversations} activeId={activeConversation?.id} onSelect={handleSelectConversation} selectedIds={selectedIds} onToggleSelect={toggleSelect} />
                                </TabsContent>
                                <TabsContent value="human" className="mt-0">
                                    <ConversationList list={humanQueue} activeId={activeConversation?.id} onSelect={handleSelectConversation} selectedIds={selectedIds} onToggleSelect={toggleSelect} emptyText="No human escalations in queue." />
                                </TabsContent>
                                <TabsContent value="ai" className="mt-0">
                                    <ConversationList list={aiSessions} activeId={activeConversation?.id} onSelect={handleSelectConversation} selectedIds={selectedIds} onToggleSelect={toggleSelect} />
                                </TabsContent>
                            </>
                        )}
                    </ScrollArea>

                    <div className="p-4 border-t border-white/5 flex items-center justify-between">
                        {selectedIds.length > 0 && (
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="w-full font-bold text-[10px] uppercase tracking-widest h-9">
                                {isBulkDeleting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-2"/> : <Trash2 className="h-3.5 w-3.5 mr-2" />}
                                Purge {selectedIds.length} Sessions
                            </Button>
                        )}
                    </div>
                </Tabs>
            </div>

            {/* Main Chat Area */}
            <div className={cn(
                "flex-grow flex flex-col relative bg-slate-950 overflow-hidden transition-all",
                isMobile && mobileView === 'list' && "hidden md:flex"
            )}>
                {!activeConversation ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-12">
                        <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                            <Inbox className="h-10 w-10 text-gray-700" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">Terminal Standby</h2>
                        <p className="text-gray-500 text-sm max-w-xs mt-3 font-medium">Select a trader session to begin assistance protocol.</p>
                    </div>
                ) : (
                    <>
                        <header className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-5">
                                {isMobile && <Button variant="ghost" size="icon" onClick={() => setMobileView('list')} className="text-gray-500"><ChevronLeft className="h-6 w-6"/></Button>}
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_30px_rgba(139,44,245,0.1)]"><User className="h-6 w-6" /></div>
                                <div>
                                    <h3 className="font-black text-white text-lg leading-tight tracking-tight">{activeConversation.profiles?.full_name}</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1.5">{activeConversation.profiles?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {activeConversation.assigned_role === 'human' && (
                                    <Badge className="bg-primary/20 text-primary border border-primary/30 text-[9px] font-black uppercase tracking-widest px-3 py-1">Escalated Priority</Badge>
                                )}
                                <Badge variant="outline" className={cn("px-4 py-1.5 border-white/10 bg-black/40 text-[10px] font-black uppercase tracking-widest", activeConversation.status === 'open' ? "text-green-400" : "text-gray-500")}>
                                    {activeConversation.status}
                                </Badge>
                            </div>
                        </header>

                        <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto bg-slate-950 scroll-smooth">
                            <div className="space-y-8 max-w-4xl mx-auto">
                                <div className="text-center py-4">
                                    <p className="text-[9px] text-gray-800 font-black uppercase tracking-[0.5em]">Secure Terminal Connection Established</p>
                                </div>
                                {messages.map(m => {
                                    const isAi = m.sender_id === 'AI_SYSTEM';
                                    return (
                                        <div key={m.id} className={cn("flex items-end gap-4", m.sender_role === 'admin' ? "flex-row-reverse" : "flex-row")}>
                                            <div className={cn(
                                                "max-w-[70%] p-5 rounded-3xl text-sm leading-relaxed shadow-2xl relative", 
                                                m.sender_role === 'admin' ? (isAi ? "bg-slate-900 border border-primary/40 text-gray-100" : "bg-primary text-white rounded-br-none") : "bg-white/5 border border-white/5 text-gray-300 rounded-bl-none"
                                            )}>
                                                {isAi && (
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                                                        <span className="text-[8px] font-black text-primary uppercase tracking-widest">Neural Agent</span>
                                                    </div>
                                                )}
                                                {m.image_url && (
                                                    <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                                                        <Image src={m.image_url} alt="Attachment" width={400} height={400} className="object-cover" />
                                                    </div>
                                                )}
                                                <p className="whitespace-pre-wrap font-medium">{m.message}</p>
                                                <p className="mt-3 text-[8px] opacity-30 text-right uppercase font-bold tracking-widest">{format(new Date(m.created_at), 'p')}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900/90 border-t border-white/5 backdrop-blur-xl shrink-0">
                            <form onSubmit={handleSendMessage} className="flex gap-4 max-w-5xl mx-auto">
                                <Input 
                                    placeholder="Type response protocol..." 
                                    value={messageText} 
                                    onChange={(e) => setMessageText(e.target.value)} 
                                    className="flex-grow bg-black/40 border-white/10 h-14 text-sm text-white rounded-2xl px-6 focus:ring-primary/50" 
                                />
                                <Button type="submit" disabled={(!messageText.trim() && !selectedImage) || isSending} className="h-14 w-14 rounded-2xl bg-primary shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
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

function ConversationList({ list, activeId, onSelect, selectedIds, onToggleSelect, emptyText = "No active sessions found." }: any) {
    if (list.length === 0) return <div className="p-10 text-center text-gray-700 text-xs font-bold uppercase tracking-widest">{emptyText}</div>;
    return list.map((c: any) => (
        <div key={c.id} className={cn(
            "relative flex items-center border-b border-white/5 transition-all hover:bg-white/5 group",
            activeId === c.id && "bg-primary/10",
            selectedIds.includes(c.id) && "bg-primary/5"
        )}>
            <div className="pl-4 shrink-0">
                <Checkbox 
                    checked={selectedIds.includes(c.id)} 
                    onCheckedChange={() => onToggleSelect(c.id)}
                    className="border-white/20 data-[state=checked]:bg-primary"
                />
            </div>
            <button onClick={() => onSelect(c)} className="flex-grow p-5 text-left flex items-center justify-between min-w-0">
                <div className="min-w-0 pr-4 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-black truncate text-white group-hover:text-primary transition-colors">{c.profiles?.full_name || 'New Trader'}</p>
                        {c.unread_count_admin > 0 && (
                            <div className="bg-primary text-white h-4.5 min-w-[18px] px-1 flex items-center justify-center rounded-full text-[9px] font-black shadow-lg shadow-primary/20 animate-in zoom-in">
                                {c.unread_count_admin}
                            </div>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-1 leading-relaxed">{c.last_message_preview || 'No messages...'}</p>
                    <div className="flex items-center gap-2 mt-2">
                         {c.assigned_role === 'human' && <AlertCircle className="w-3 h-3 text-primary" />}
                         <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest">
                            {format(new Date(c.last_message_at), 'MMM dd · p')}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                    <Badge variant="outline" className={cn("text-[9px] font-black px-2 py-0.5 border-none uppercase tracking-tighter", c.status === 'open' ? "text-green-400 bg-green-500/5" : "text-gray-600 bg-white/5")}>
                        {c.status}
                    </Badge>
                </div>
            </button>
        </div>
    ));
}
