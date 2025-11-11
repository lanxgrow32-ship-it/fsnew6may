
'use client';

import { useState, useEffect, useActionState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FundedStockLogo } from '@/components/ui/logo';
import { Home, FileCheck, DollarSign, LogOut, BookUser, Gift, MessageSquare, Loader2, PlusCircle } from 'lucide-react';
import { signOut } from '@/app/actions';
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

type Ticket = {
    id: number;
    created_at: string;
    subject: string;
    status: 'Open' | 'Closed';
    updated_at: string;
};

function CreateTicketForm() {
    const ref = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [state, formAction] = useActionState(createTicket, { error: null });

    useEffect(() => {
        if (state?.error) {
            toast({
                title: "Error Creating Ticket",
                description: state.error,
                variant: "destructive",
            });
        }
    }, [state, toast]);

    function SubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" disabled={pending}>
                {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Ticket'}
            </Button>
        );
    }
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Ticket
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[475px]">
                 <form ref={ref} action={formAction} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>Create Support Ticket</DialogTitle>
                        <DialogDescription>
                            Describe your issue below. Our support team will get back to you shortly.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input id="subject" name="subject" placeholder="e.g., Issue with my account" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" placeholder="Please describe your issue in detail..." required rows={6}/>
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


function TicketsTable({ tickets }: { tickets: Ticket[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tickets.length > 0 ? tickets.map((ticket) => (
                     <TableRow key={ticket.id} className="cursor-pointer">
                         <TableCell>
                            <Link href={`/tickets/${ticket.id}`} className="font-medium block w-full">
                                {ticket.subject}
                            </Link>
                         </TableCell>
                         <TableCell>
                            <Link href={`/tickets/${ticket.id}`} className="block w-full">
                                {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                            </Link>
                         </TableCell>
                         <TableCell className="text-right">
                             <Link href={`/tickets/${ticket.id}`} className="block w-full">
                                <Badge variant={ticket.status === 'Open' ? 'destructive' : 'secondary'}>
                                    {ticket.status}
                                </Badge>
                             </Link>
                         </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">You haven't created any tickets yet.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

export default function UserTicketsPage() {
    const supabase = createClient();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTickets = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .order('updated_at', { ascending: false });
            
            if (error) {
                console.error(error);
            } else {
                setTickets(data as Ticket[]);
            }
            setIsLoading(false);
        };
        fetchTickets();

        const channel = supabase.channel('realtime user tickets')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, 
                () => { fetchTickets() }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel) };

    }, []);

    const SkeletonTable = () => (
         <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
         </div>
    );

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="border-b p-4 h-[57px] flex items-center">
                    <Link href="/welcome" className="flex items-center gap-2 font-bold text-lg">
                        <FundedStockLogo className="w-8 h-8 text-primary" />
                        <span className="text-foreground group-[[data-state=collapsed]]:hidden">FundedStock</span>
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/welcome" tooltip="Dashboard">
                                <Home />
                                Dashboard
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/pricing" tooltip="Purchase New Account">
                                <DollarSign />
                                Purchase New Account
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/kyc-status" tooltip="KYC Verification">
                                <FileCheck />
                                KYC Verification
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton href="/referrals" tooltip="Referrals">
                                <Gift />
                                Referrals
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/tickets" isActive tooltip="Support">
                                <MessageSquare />
                                Support
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/guide" tooltip="Trading Guide">
                                <BookUser />
                                Trading Guide
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <form action={signOut} className="w-full">
                                <SidebarMenuButton tooltip="Logout" asChild>
                                    <button type="submit" className="w-full">
                                        <LogOut />
                                        Logout
                                    </button>
                                </SidebarMenuButton>
                            </form>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-xl font-semibold">Support Tickets</h1>
                    </div>
                     <CreateTicketForm />
                </header>
                <main className="p-4 md:p-6 bg-muted/40 min-h-[calc(100vh-57px)]">
                   <div className="max-w-4xl mx-auto">
                        <Card>
                             <CardHeader>
                                <CardTitle>My Tickets</CardTitle>
                                <CardDescription>A list of your support tickets.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               {isLoading ? <SkeletonTable /> : <TicketsTable tickets={tickets} />}
                            </CardContent>
                        </Card>
                   </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
