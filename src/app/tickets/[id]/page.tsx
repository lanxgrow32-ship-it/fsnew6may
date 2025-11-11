
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addReply } from '../actions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

type Reply = {
    author: string;
    author_role: 'admin' | 'user';
    message: string;
    created_at: string;
};

type Ticket = {
  id: number;
  subject: string;
  description: string;
  status: 'Open' | 'Closed';
  created_at: string;
  replies: Reply[];
};

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const { id } = use(params);

  const fetchTicket = async () => {
    const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        setError('Failed to fetch ticket. You may not have permission to view it.');
        console.error(error);
    } else {
        setTicket(data as Ticket);
    }
    setIsFetching(false);
  }

  useEffect(() => {
    if (!id) return;
    fetchTicket();

    const channel = supabase.channel(`ticket_${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${id}` }, 
        (payload) => { setTicket(payload.new as Ticket) }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel) };

  }, [id, supabase]);

  const handleReplySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reply.trim()) return;

    setIsLoading(true);
    const result = await addReply(ticket!.id, reply);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      setReply('');
      toast({ title: 'Reply sent' });
    }
    setIsLoading(false);
  };

  const ReplyCard = ({ reply }: { reply: Reply }) => (
    <div className={`flex items-start gap-4 ${reply.author_role === 'user' ? 'justify-end' : ''}`}>
        {reply.author_role === 'admin' && (
            <Avatar className="h-8 w-8 border">
                <AvatarFallback>A</AvatarFallback>
            </Avatar>
        )}
        <div className={`max-w-xl rounded-lg p-3 ${reply.author_role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <p className="text-sm">{reply.message}</p>
            <p className={`text-xs mt-2 ${reply.author_role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {reply.author} • {format(new Date(reply.created_at), 'MMM d, h:mm a')}
            </p>
        </div>
         {reply.author_role === 'user' && (
            <Avatar className="h-8 w-8 border">
                <AvatarFallback>{reply.author?.[0]}</AvatarFallback>
            </Avatar>
        )}
    </div>
  )

  if (isFetching) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (error || !ticket) {
     return <div className="flex min-h-screen items-center justify-center"><Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error || 'Ticket not found.'}</AlertDescription></Alert></div>
  }

  return (
    <div className="bg-muted/40 min-h-screen">
        <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
           <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/tickets">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">{ticket.subject}</h1>
           </div>
           <Badge variant={ticket.status === 'Open' ? 'destructive' : 'default'} className={ticket.status === 'Open' ? '' : 'bg-green-600'}>{ticket.status}</Badge>
        </header>
        <main className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                 <Card>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-start gap-4 justify-end">
                            <div className="w-full rounded-lg p-3 bg-primary text-primary-foreground">
                                <p className="text-sm font-semibold">{ticket.description}</p>
                                <p className="text-xs text-primary-foreground/70 mt-2">
                                    You • {format(new Date(ticket.created_at), 'MMM d, h:mm a')}
                                </p>
                            </div>
                            <Avatar className="h-8 w-8 border">
                                <AvatarFallback>Y</AvatarFallback>
                            </Avatar>
                        </div>

                       {ticket.replies.map((reply, index) => (
                           <ReplyCard key={index} reply={reply} />
                       ))}
                    </CardContent>
                </Card>
                
                {ticket.status === 'Open' && (
                    <Card>
                        <CardContent className="p-6">
                             <form onSubmit={handleReplySubmit} className="space-y-4">
                                <Textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder="Type your response here..."
                                    rows={5}
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isLoading || !reply.trim()}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Reply
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    </div>
  );
}
