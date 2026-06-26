import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { supabaseAdmin } from '@/lib/supabase/admin';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const dynamic = 'force-dynamic';

type Ticket = {
    id: number;
    created_at: string;
    subject: string;
    status: 'Open' | 'Closed';
    profiles: {
        full_name: string;
        email: string;
    } | null;
    updated_at: string;
};

function TicketsTable({ tickets }: { tickets: Ticket[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow className="border-white/5">
                    <TableHead className="text-[10px] font-bold uppercase text-gray-500">Trader</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-gray-500">Subject</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-gray-500">Updated</TableHead>
                    <TableHead className="text-right text-[10px] font-bold uppercase text-gray-500">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tickets.length > 0 ? tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <TableCell>
                            <Link href={`/support-agent/tickets/${ticket.id}`} className="block py-1">
                                <div className="font-bold text-white text-sm">{ticket.profiles?.full_name}</div>
                                <div className="text-[10px] text-gray-500 font-medium">{ticket.profiles?.email}</div>
                            </Link>
                        </TableCell>
                        <TableCell>
                            <Link href={`/support-agent/tickets/${ticket.id}`} className="block font-medium text-gray-300 hover:text-primary transition-colors">
                                {ticket.subject}
                            </Link>
                        </TableCell>
                         <TableCell>
                            <Link href={`/support-agent/tickets/${ticket.id}`} className="block text-xs text-gray-500">
                                {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                            </Link>
                         </TableCell>
                        <TableCell className="text-right">
                           <Link href={`/support-agent/tickets/${ticket.id}`} className="block">
                                <Badge variant={ticket.status === 'Open' ? 'destructive' : 'secondary'} className={ticket.status === 'Open' ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"}>
                                    {ticket.status}
                                </Badge>
                            </Link>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-40 text-center text-gray-600 font-medium italic">No tickets found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

export default async function SupportAgentTicketsPage() {
    const { data: tickets, error } = await supabaseAdmin
        .from('tickets')
        .select('*, profiles:user_id(full_name, email)')
        .order('updated_at', { ascending: false });

    const openTickets = (tickets || []).filter(t => t.status === 'Open');
    const closedTickets = (tickets || []).filter(t => t.status === 'Closed');
    
    return (
        <main className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Tickets</h2>
                    <p className="text-gray-400 text-sm font-medium">Manage and resolve trader inquiries.</p>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Help Desk</span>
                </div>
            </div>

            <Card className="bg-white/5 border-white/10 overflow-hidden">
                <Tabs defaultValue="open">
                    <TabsList className="bg-black/40 border-b border-white/5 w-full justify-start rounded-none h-auto p-0">
                        <TabsTrigger value="open" className="py-4 px-8 rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-r border-white/5 font-bold text-xs uppercase tracking-widest">
                            Open Tickets <Badge className="ml-3 bg-primary/20 text-primary border-primary/20">{openTickets.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="closed" className="py-4 px-8 rounded-none data-[state=active]:bg-white/5 data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
                            Resolved <Badge variant="outline" className="ml-3 border-white/10 text-gray-500">{closedTickets.length}</Badge>
                        </TabsTrigger>
                    </TabsList>
                    <div className="p-6">
                        <TabsContent value="open" className="mt-0">
                            <TicketsTable tickets={openTickets} />
                        </TabsContent>
                        <TabsContent value="closed" className="mt-0">
                            <TicketsTable tickets={closedTickets} />
                        </TabsContent>
                    </div>
                </Tabs>
            </Card>
        </main>
    );
}
