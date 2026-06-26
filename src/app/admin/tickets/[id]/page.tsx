
'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Paperclip, ChevronLeft, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { sendSupportMessage, markSupportRead } from '@/app/welcome/actions';
import { updateTicketStatus } from '../actions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminTicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [adminId, setAdminId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { id } = use(params);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setAdminId(user.id);

    const [convRes, msgRes] = await Promise.all([
        supabase.from('support_conversations').select('*, profiles:user_id(full_name, email)').eq('id', id).single(),
        supabase.from('support_messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true })
    ]);

    if (convRes.data) setTicket(convRes.data);
    if (msgRes.data) setMessages(msgRes.data);
    setIsLoading(false);
    
    // Mark as read for admin
    markSupportRead(id, 'admin');
  };

  useEffect(() => {
    fetchData();
    const sub = supabase.channel(`admin_ticket_thread_${id}`)
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
    const res = await sendSupportMessage(id, adminId!, 'admin', replyText);
    
    if (res.error) {
      toast({ title: 'Reply Failed', description: res.error, variant: 'destructive' });
    } else {
      setReplyText('');
      setAttachment(null);
      setPreview(null);
    }
    setIsSending(false);
  };

  const handleStatusToggle = async () => {
      const newStatus = ticket?.status === 'open' ? 'closed' : 'open';
      setIsLoading(true);
      await updateTicketStatus(id, newStatus);
      fetchData();
      toast({ title: `Ticket marked as ${newStatus}` });
  }

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="bg-slate-950 min-h-screen font-poppins flex flex-col h-screen overflow-hidden">
        <header className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-50 shrink-0">
           <div className="flex items-center gap-5">
                <Button variant="outline" size="icon" asChild className="bg-black/20 border-white/10 hover:bg-white/5">
                    <Link href="/admin/tickets"><ChevronLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">{ticket?.subject}</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{ticket?.profiles?.full_name} · {ticket?.profiles?.email}</p>
                </div>
           </div>
           <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn("capitalize text-[9px] font-bold border-none", ticket?.status === 'open' ? "text-green-400 bg-green-500/5" : "text-gray-500")}>
                    {ticket?.status}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleStatusToggle} className="bg-white/5 hover:bg-white/10 border-white/10 text-white font-bold text-[10px] uppercase rounded-xl h-10 px-6">
                    {ticket?.status === 'open' ? <><Check className="mr-2 h-3.5 w-3.5" /> Resolve</> : <><RefreshCw className="mr-2 h-3.5 w-3.5" /> Reopen</>}
                </Button>
           </div>
        </header>

        <ScrollArea ref={scrollRef} className="flex-1 p-6 md:p-10 bg-slate-950">
            <div className="max-w-4xl mx-auto space-y-8">
                {messages.map((m, i) => (
                    <div key={i} className={cn("flex items-start gap-4", m.sender_role === 'admin' ? "flex-row-reverse text-right" : "flex-row text-left")}>
                        <Avatar className={cn("h-10 w-10 border-2 shadow-sm", m.sender_role === 'admin' ? "border-primary/20" : "border-white/10")}>
                            <AvatarFallback className={m.sender_role === 'admin' ? "bg-primary text-primary-foreground font-bold" : "bg-slate-800 text-gray-400"}>
                                {m.sender_role === 'admin' ? 'A' : 'T'}
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn("max-w-xl rounded-2xl p-5 shadow-sm", m.sender_role === 'admin' ? "bg-primary text-white" : "bg-white/5 border border-white/5 text-gray-200")}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
                            {m.image_url && (
                                <div className="mt-4 rounded-xl overflow-hidden border border-white/10 w-fit shadow-lg">
                                    <Image src={m.image_url} alt="Attachment" width={400} height={400} className="object-cover" />
                                </div>
                            )}
                            <div className={cn("mt-4 pt-3 border-t text-[8px] font-bold uppercase tracking-widest", m.sender_role === 'admin' ? "border-white/10 text-white/40" : "border-white/5 text-gray-600")}>
                                {format(new Date(m.created_at), 'PPP · p')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
        
        {ticket?.status === 'open' && (
            <div className="p-6 bg-slate-900/80 border-t border-white/5 backdrop-blur-xl shrink-0">
                <form onSubmit={handleReplySubmit} className="max-w-4xl mx-auto space-y-4">
                    <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your response to the trader..."
                        rows={3}
                        className="bg-black/40 border-white/10 text-white text-sm focus:ring-primary/50"
                    />
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <Label htmlFor="admin-attach" className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                <Paperclip className="h-3.5 w-3.5" /> Attach Proof
                            </Label>
                            <Input id="admin-attach" type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                            {preview && (
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                                    <Image src={preview} alt="Thumb" layout="fill" className="object-cover" />
                                </div>
                            )}
                        </div>
                        <Button type="submit" disabled={isSending || (!replyText.trim() && !attachment)} className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-10 rounded-xl shadow-xl shadow-primary/20">
                            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Send Reply
                        </Button>
                    </div>
                </form>
            </div>
        )}
    </div>
  );
}
