'use client';

import { useState, useEffect, useActionState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Loader2, Paperclip, Search, ArrowRight, MessageSquare, History, LifeBuoy } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { createTicket } from './actions';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg', className)}>
        {children}
    </div>
);

function CreateTicketForm() {
    const { toast } = useToast();
    const [state, formAction] = useActionState(createTicket, { error: null });
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (state?.error) {
            toast({ title: "Error Creating Ticket", description: state.error, variant: "destructive" });
        }
    }, [state, toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPreview(URL.createObjectURL(file));
        else setPreview(null);
    };

    function SubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" disabled={pending} className="bg-primary text-white font-bold h-11 rounded-xl w-full">
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LifeBuoy className="mr-2 h-4 w-4" />}
                Submit Support Request
            </Button>
        );
    }
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="bg-primary text-white font-bold rounded-xl shadow-lg h-10 px-6">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Ticket
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[475px] bg-slate-950 border-white/10 text-white font-poppins">
                 <form action={formAction} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">New Support Ticket</DialogTitle>
                        <DialogDescription className="text-gray-400">Our team will get back to you within 24 hours.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="subject" className="text-[11px] font-bold text-gray-500 uppercase">Subject</Label>
                            <Input id="subject" name="subject" placeholder="e.g. KYC Verification Delay" required className="bg-black/20 border-white/10 h-12" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="description" className="text-[11px] font-bold text-gray-500 uppercase">Description</Label>
                            <Textarea id="description" name="description" placeholder="Explain your issue in detail..." required rows={5} className="bg-black/20 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="image" className="text-[11px] font-bold text-gray-500 uppercase cursor-pointer flex items-center gap-2 hover:text-white transition-colors">
                                <Paperclip className="h-3.5 w-3.5" /> Attach Screenshot
                            </Label>
                            <Input id="image" name="image" type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                            {preview && (
                                <div className="mt-2 rounded-xl overflow-hidden border border-white/10 w-24 h-24">
                                    <Image src={preview} alt="Attachment" width={96} height={96} className="object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function UserTicketsPage() {
    const supabase = createClient();
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchTickets = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const { data } = await supabase
            .from('support_conversations')
            .select('*')
            .neq('subject', 'LIVE_CHAT')
            .order('last_message_at', { ascending: false });
        
        setTickets(data || []);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTickets();
        const sub = supabase.channel('tickets_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations' }, fetchTickets)
            .subscribe();
        return () => { supabase.removeChannel(sub); };
    }, []);

    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <main className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
                 <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Support Tickets</h1>
                        <p className="text-gray-400 text-sm font-medium">Manage your formal requests and account escalations.</p>
                    </div>
                    <CreateTicketForm />
                 </div>

                <GlassCard>
                    <div className="overflow-hidden">
                        {isLoading ? (
                            <div className="p-8 space-y-4">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full bg-white/5" />)}
                            </div>
                        ) : tickets.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {tickets.map((t) => (
                                    <Link key={t.id} href={`/tickets/${t.id}`} className="group block p-5 hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-white group-hover:text-primary transition-colors">{t.subject}</h3>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                    Updated {formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {t.unread_count_user > 0 && (
                                                    <Badge className="bg-red-500 text-white h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] animate-pulse">
                                                        {t.unread_count_user}
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className={cn("capitalize text-[9px] font-bold border-none", t.status === 'open' ? "text-green-400 bg-green-500/5" : "text-gray-500")}>
                                                    {t.status}
                                                </Badge>
                                                <ArrowRight className="h-4 w-4 text-gray-700 group-hover:text-white transition-colors" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 text-center">
                                <History className="h-12 w-12 text-gray-800 mx-auto mb-4" />
                                <h3 className="text-white font-bold">No active tickets</h3>
                                <p className="text-gray-500 text-sm mt-1">Submit a ticket if you need help with your account.</p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </main>
        </div>
    );
}
