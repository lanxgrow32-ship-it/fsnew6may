'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Send, Paperclip, ChevronLeft, User, Headphones } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addReply } from '../actions';
import { markSupportRead } from '@/app/welcome/actions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { id } = use(params);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const [convRes, msgRes] = await Promise.all([
        supabase.from('support_conversations').select('*').eq('id', id).single(),
        supabase.from('support_messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true })
    ]);

    if (convRes.data) setTicket(convRes.data);
    if (msgRes.data) setMessages(msgRes.data);
    setIsLoading(false);
    
    // Mark as read
    markSupportRead(id, 'user');
  };

  useEffect(() => {
    fetchData();
    const sub = supabase.channel(`ticket_thread_${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${id}` }, fetchData)
        .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAttachment(file);
    if (file) setPreview(URL.createObjectURL(file));
    else setPreview(null);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && !attachment) return;

    setIsSending(true);
    const formData = new FormData();
    formData.append('reply', replyText);
    if (attachment) formData.append('image', attachment);

    const result = await addReply(id, formData);
    if (result.error) {
      toast({ title: 'Reply Failed', description: result.error, variant: 'destructive' });
    } else {
      setReplyText('');
      setAttachment(null);
      setPreview(null);
    }
    setIsSending(false);
  };

  if (isLoading) return <div className="dark min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        <main className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto h-screen flex flex-col pb-10">
            <div className="flex items-center justify-between mb-6 shrink-0">
                 <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="bg-black/20 border-white/10 text-white">
                        <Link href="/tickets"><ChevronLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">{ticket?.subject}</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Ticket ID: {id.substring(0, 8)}</p>
                    </div>
                </div>
                <Badge variant="outline" className={cn("capitalize text-[9px] font-bold border-none", ticket?.status === 'open' ? "text-green-400 bg-green-500/5" : "text-gray-500")}>
                    {ticket?.status}
                </Badge>
            </div>
            
            <GlassCard className="flex-1 flex flex-col p-0 border-white/5">
                <ScrollArea ref={scrollRef} className="flex-1 p-6">
                    <div className="space-y-8 max-w-3xl mx-auto">
                        <div className="text-center py-4 border-b border-white/5 mb-8">
                             <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Conversation started {format(new Date(ticket.created_at), 'PPP')}</p>
                        </div>

                        {messages.map((m) => (
                            <div key={m.id} className={cn("flex items-start gap-4", m.sender_role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                <div className={cn("h-8 w-8 rounded-full border border-white/10 flex items-center justify-center shrink-0", m.sender_role === 'user' ? "bg-primary/20 text-primary" : "bg-white/10 text-white")}>
                                    {m.sender_role === 'user' ? <User className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                                </div>
                                <div className={cn("max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg", m.sender_role === 'user' ? "bg-primary text-white rounded-br-none" : "bg-white/5 border border-white/5 text-gray-200 rounded-bl-none")}>
                                    <p className="whitespace-pre-wrap">{m.message}</p>
                                    {m.image_url && (
                                        <div className="mt-4 rounded-xl overflow-hidden border border-white/10 w-fit">
                                            <a href={m.image_url} target="_blank" rel="noreferrer">
                                                <Image src={m.image_url} alt="Attachment" width={300} height={300} className="object-cover" />
                                            </a>
                                        </div>
                                    )}
                                    <div className="mt-3 text-[9px] opacity-40 font-bold text-right">
                                        {format(new Date(m.created_at), 'p')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {ticket.status === 'open' && (
                    <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md">
                        <form onSubmit={handleReplySubmit} className="flex gap-4 max-w-3xl mx-auto items-end">
                            <div className="flex-1 space-y-3">
                                <Textarea 
                                    placeholder="Type your reply..." 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="bg-black/40 border-white/10 h-24 text-sm text-white rounded-xl px-4 resize-none" 
                                />
                                <div className="flex items-center gap-4">
                                    <Label htmlFor="user-attach" className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                        <Paperclip className="h-3.5 w-3.5" /> Attach Proof
                                    </Label>
                                    <Input id="user-attach" type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                                    {preview && (
                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                                            <Image src={preview} alt="Thumb" layout="fill" className="object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button type="submit" disabled={isSending || (!replyText.trim() && !attachment)} className="h-12 px-8 rounded-xl bg-primary text-white font-bold shadow-xl shadow-primary/20">
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4 mr-2" />}
                                Send Reply
                            </Button>
                        </form>
                    </div>
                )}
            </GlassCard>
        </main>
    </div>
  );
}
