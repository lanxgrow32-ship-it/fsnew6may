
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Send, Check, RefreshCw, Paperclip, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addAdminReply, updateTicketStatus, getTicketById } from '../actions';
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

export default function AdminTicketDetailsPage({ params }: { params: { id: string } }) {
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

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) return;
      setIsFetching(true);
      const { data, error: fetchError } = await getTicketById(Number(id));
      
      if (fetchError) {
          setError(fetchError);
          console.error(fetchError);
      } else {
          setTicket(data as Ticket);
      }
      setIsFetching(false);
    }

    fetchTicket();

    // The realtime subscription will need to be re-evaluated as it might not work
    // correctly with the new RLS policies for admins without a token.
    // For now, key actions revalidate the path, causing a re-fetch.

  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAttachment(file);
    if (file) {
        setPreview(URL.createObjectURL(file));
    } else {
        setPreview(null);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reply.trim() && !attachment) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('reply', reply);
    if (attachment) {
        formData.append('image', attachment);
    }

    const result = await addAdminReply(ticket!.id, formData);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      setReply('');
      setAttachment(null);
      setPreview(null);
      (e.target as HTMLFormElement).reset();
      toast({ title: 'Reply sent' });
      // Re-fetch data after submitting a reply
      const { data, error: fetchError } = await getTicketById(Number(id));
      if (data) setTicket(data as Ticket);
    }
    setIsLoading(false);
  };

  const handleStatusChange = async (status: 'Open' | 'Closed') => {
      setIsLoading(true);
      const result = await updateTicketStatus(ticket!.id, status);
      if (result.error) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
          toast({ title: `Ticket ${status.toLowerCase()}` });
          // Re-fetch to show updated status
          const { data, error: fetchError } = await getTicketById(Number(id));
          if (data) setTicket(data as Ticket);
      }
      setIsLoading(false);
  }

  const MessageImage = ({ src, alt }: { src: string, alt: string }) => (
    <div className="mt-2">
        <a href={src} target="_blank" rel="noopener noreferrer">
            <Image src={src} alt={alt} width={200} height={200} className="rounded-md object-cover"/>
        </a>
    </div>
  );

  const ReplyCard = ({ reply }: { reply: Reply }) => (
    <div className={`flex items-start gap-4 ${reply.author_role === 'admin' ? 'justify-end' : ''}`}>
        {reply.author_role === 'user' && (
            <Avatar className="h-8 w-8 border">
                <AvatarFallback>{reply.author?.[0]}</AvatarFallback>
            </Avatar>
        )}
        <div className={`max-w-xl rounded-lg p-3 ${reply.author_role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
            {reply.image_url && <MessageImage src={reply.image_url} alt="Reply attachment" />}
            <p className={`text-xs mt-2 ${reply.author_role === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {reply.author} • {format(new Date(reply.created_at), 'MMM d, h:mm a')}
            </p>
        </div>
         {reply.author_role === 'admin' && (
            <Avatar className="h-8 w-8 border">
                <AvatarFallback>A</AvatarFallback>
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
                    <Link href="/admin/tickets">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-xl font-semibold leading-none">{ticket.subject}</h1>
                    <p className="text-sm text-muted-foreground">{ticket.profiles?.full_name}</p>
                </div>
           </div>
           <div className="flex items-center gap-2">
                <Badge variant={ticket.status === 'Open' ? 'destructive' : 'default'} className={ticket.status === 'Open' ? '' : 'bg-green-600'}>{ticket.status}</Badge>
                {ticket.status === 'Open' ? (
                     <Button size="sm" variant="outline" onClick={() => handleStatusChange('Closed')} disabled={isLoading}>
                        <Check className="mr-2 h-4 w-4" /> Mark as Closed
                    </Button>
                ) : (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange('Open')} disabled={isLoading}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Re-open Ticket
                    </Button>
                )}
           </div>
        </header>
        <main className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                 <Card>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-start gap-4">
                             <Avatar className="h-8 w-8 border">
                                <AvatarFallback>{ticket.profiles?.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="w-full rounded-lg p-3 bg-muted">
                                <p className="text-sm font-semibold">{ticket.subject}</p>
                                <p className="text-sm whitespace-pre-wrap mt-2">{ticket.description}</p>
                                {ticket.image_url && <MessageImage src={ticket.image_url} alt="Ticket attachment" />}
                                <p className="text-xs text-muted-foreground mt-2">
                                    {ticket.profiles?.full_name} • {format(new Date(ticket.created_at), 'MMM d, h:mm a')}
                                </p>
                            </div>
                        </div>

                       {ticket.replies.map((reply, index) => (
                           <ReplyCard key={index} reply={reply} />
                       ))}
                    </CardContent>
                </Card>
                
                {ticket.status === 'Open' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Add a Reply</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <form onSubmit={handleReplySubmit} className="space-y-4">
                                <Textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder="Type your response here..."
                                    rows={5}
                                />
                                 <div className="space-y-2">
                                    <Label htmlFor="image-upload" className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                        <Paperclip className="w-4 h-4"/>
                                        Attach an image (optional)
                                    </Label>
                                    <Input id="image-upload" name="image" type="file" accept="image/*" onChange={handleFileChange} className="sr-only"/>
                                    {preview && (
                                        <div className="relative w-24 h-24">
                                            <Image src={preview} alt="Preview" layout="fill" className="object-cover rounded-md"/>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isLoading || (!reply.trim() && !attachment)}>
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
