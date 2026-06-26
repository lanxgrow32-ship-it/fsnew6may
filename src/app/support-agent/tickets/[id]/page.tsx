'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Send, Check, RefreshCw, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addAdminReply, updateTicketStatus, getTicketById } from '@/app/admin/tickets/actions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Reply = {
    author: string;
    author_role: 'admin' | 'user';
    message: string;
    created_at: string;
    image_url?: string;
};

type Ticket = {
  id: number;
  subject: string;
  description: string;
  image_url?: string;
  status: 'Open' | 'Closed';
  created_at: string;
  replies: Reply[];
  profiles: {
    full_name: string;
    email: string;
  } | null;
};

export default function AgentTicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { id } = use(params);

  const fetchTicket = async () => {
    if (!id) return;
    setIsFetching(true);
    const { data, error: fetchError } = await getTicketById(Number(id));
    if (fetchError) setError(fetchError);
    else setTicket(data as Ticket);
    setIsFetching(false);
  }

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAttachment(file);
    if (file) setPreview(URL.createObjectURL(file));
    else setPreview(null);
  };

  const handleReplySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reply.trim() && !attachment) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('reply', reply);
    if (attachment) formData.append('image', attachment);

    const result = await addAdminReply(ticket!.id, formData);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      setReply('');
      setAttachment(null);
      setPreview(null);
      (e.target as HTMLFormElement).reset();
      toast({ title: 'Reply sent' });
      fetchTicket();
    }
    setIsLoading(false);
  };

  const handleStatusChange = async (status: 'Open' | 'Closed') => {
      setIsLoading(true);
      const result = await updateTicketStatus(ticket!.id, status);
      if (result.error) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
          toast({ title: `Ticket ${status === 'Closed' ? 'Resolved' : 'Reopened'}` });
          fetchTicket();
      }
      setIsLoading(false);
  }

  if (isFetching) return <div className="flex h-screen items-center justify-center bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (error || !ticket) return <div className="p-8"><Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error || 'Ticket not found.'}</AlertDescription></Alert></div>

  return (
    <div className="bg-slate-950 min-h-screen">
        <header className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
           <div className="flex items-center gap-5">
                <Button variant="outline" size="icon" asChild className="bg-black/20 border-white/10 hover:bg-white/5">
                    <Link href="/support-agent/tickets"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">{ticket.subject}</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">ID: {ticket.id} · {ticket.profiles?.full_name}</p>
                </div>
           </div>
           <div className="flex items-center gap-3">
                <Badge variant={ticket.status === 'Open' ? 'destructive' : 'secondary'} className={ticket.status === 'Open' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}>{ticket.status}</Badge>
                {ticket.status === 'Open' ? (
                     <Button size="sm" onClick={() => handleStatusChange('Closed')} disabled={isLoading} className="bg-green-600 hover:bg-green-700 font-bold text-xs rounded-xl px-5 h-10">
                        <Check className="mr-2 h-4 w-4" /> Resolve
                    </Button>
                ) : (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange('Open')} disabled={isLoading} className="border-white/10 bg-black/20 text-white font-bold text-xs rounded-xl h-10 px-5">
                        <RefreshCw className="mr-2 h-4 w-4" /> Reopen
                    </Button>
                )}
           </div>
        </header>

        <main className="p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-10">
                 <div className="space-y-6">
                    <div className="flex items-start gap-4">
                         <Avatar className="h-10 w-10 border-2 border-white/10 shadow-xl">
                            <AvatarFallback className="bg-slate-800 text-gray-400 font-bold">{ticket.profiles?.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-6 shadow-2xl">
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">User Message</p>
                            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                            {ticket.image_url && (
                                <div className="mt-6 rounded-xl overflow-hidden border border-white/10 w-fit">
                                    <Image src={ticket.image_url} alt="Attachment" width={400} height={400} className="object-cover" />
                                </div>
                            )}
                            <div className="mt-6 pt-4 border-t border-white/5 text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                                {format(new Date(ticket.created_at), 'PPPP · p')}
                            </div>
                        </div>
                    </div>

                    {ticket.replies.map((r, i) => (
                        <div key={i} className={cn("flex items-start gap-4", r.author_role === 'admin' ? "flex-row-reverse" : "flex-row")}>
                            <Avatar className={cn("h-10 w-10 border-2 shadow-xl", r.author_role === 'admin' ? "border-primary/20" : "border-white/10")}>
                                <AvatarFallback className={r.author_role === 'admin' ? "bg-primary/20 text-primary font-bold" : "bg-slate-800 text-gray-400"}>{r.author[0]}</AvatarFallback>
                            </Avatar>
                            <div className={cn("max-w-xl rounded-2xl p-5 shadow-2xl", r.author_role === 'admin' ? "bg-primary text-white" : "bg-white/5 border border-white/5 text-gray-200")}>
                                <p className="text-xs leading-relaxed whitespace-pre-wrap">{r.message}</p>
                                {r.image_url && (
                                    <div className="mt-4 rounded-lg overflow-hidden border border-white/10 w-fit">
                                        <Image src={r.image_url} alt="Reply Image" width={300} height={300} className="object-cover" />
                                    </div>
                                )}
                                <div className={cn("mt-4 pt-3 border-t text-[8px] font-bold uppercase tracking-widest", r.author_role === 'admin' ? "border-white/10 text-white/40" : "border-white/5 text-gray-600")}>
                                    {r.author} · {format(new Date(r.created_at), 'p')}
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
                
                {ticket.status === 'Open' && (
                    <Card className="bg-white/5 border-white/10 shadow-2xl overflow-hidden">
                        <CardHeader className="bg-black/20 border-b border-white/5">
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2"><Send className="w-4 h-4 text-primary" /> Send Response</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <Textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                placeholder="Type your response to the trader..."
                                rows={6}
                                className="bg-black/40 border-white/10 text-white text-sm focus:ring-primary/50"
                            />
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="agent-upload" className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                        <Paperclip className="w-3.5 h-3.5"/> Attach Image
                                    </Label>
                                    <Input id="agent-upload" name="image" type="file" accept="image/*" onChange={handleFileChange} className="sr-only"/>
                                    {preview && (
                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                                            <Image src={preview} alt="Preview" layout="fill" className="object-cover"/>
                                        </div>
                                    )}
                                </div>
                                <Button onClick={handleReplySubmit} disabled={isLoading || (!reply.trim() && !attachment)} className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-10 rounded-xl shadow-xl shadow-primary/20">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Send Reply
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    </div>
  );
}
