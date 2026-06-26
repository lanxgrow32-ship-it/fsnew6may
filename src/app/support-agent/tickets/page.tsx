
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { supabaseAdmin } from '@/lib/supabase/admin';

import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function TicketsTable({ tickets }: { tickets: any[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow className="border-white/5">
                    <TableHead className="text-[10px] font-bold uppercase text-gray-500">Trader</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-gray-500">Subject</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-gray-500">Last Message</TableHead>
                    <TableHead className="text-right text-[10px] font-bold uppercase text-gray-500">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tickets.length > 0 ? tickets.map((t) => (
                    <TableRow key={t.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <TableCell>
                            <Link href={`/support-agent/tickets/${t.id}`} className="block py-1">
                                <div className="font-bold text-white text-sm">{t.profiles?.full_name || 'New Trader'}</div>
                                <div className="text-[10px] text-gray-500 font-medium">{t.profiles?.email}</div>
                            </Link>
                        </TableCell>
                        <TableCell>
                            <Link href={`/support-agent/tickets/${t.id}`} className="block font-medium text-gray-300 group-hover:text-primary transition-colors">
                                {t.subject}
                            </Link>
                        </TableCell>
                         <TableCell>
                            <Link href={`/support-agent/tickets/${t.id}`} className="block text-xs text-gray-500">
                                {formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}
                            </Link>
                         </TableCell>
                        <TableCell className="text-right">
                           <Link href={`/support-agent/tickets/${t.id}`} className="flex items-center justify-end gap-3">
                                {t.unread_count_admin > 0 && (
                                    <Badge className="bg-primary text-white text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full animate-pulse">
                                        {t.unread_count_admin}
                                    </Badge>
                                )}
                                <Badge variant="outline" className={cn("capitalize text-[9px] font-bold border-none", t.status === 'open' ? "text-green-400 bg-green-500/5" : "text-gray-500")}>
                                    {t.status}
                                </Badge>
                                <ArrowRight className="h-3.5 w-3.5 text-gray-700 group-hover:text-white" />
                            </Link>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-60 text-center">
                            <Inbox className="h-10 w-10 text-gray-900 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium italic">No tickets in this category.</p>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

export default async function SupportAgentTicketsPage() {
    const { data: tickets } = await supabaseAdmin
        .from('support_conversations')
        .select('*, profiles:user_id(full_name, email)')
        .neq('subject', 'LIVE_CHAT')
        .order('last_message_at', { ascending: false });

    const openTickets = (tickets || []).filter(t => t.status === 'open');
    const closedTickets = (tickets || []).filter(t => t.status === 'closed');
    
    return (
        <main className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Support Tickets</h2>
                    <p className="text-gray-400 text-sm font-medium">Manage and resolve formal trader requests.</p>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Protocol Desk Active</span>
                </div>
            </div>

            <Card className="bg-white/5 border-white/10 overflow-hidden">
                <Tabs defaultValue="open">
                    <TabsList className="bg-black/40 border-b border-white/5 w-full justify-start rounded-none h-auto p-0">
                        <TabsTrigger value="open" className="py-4 px-8 rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-r border-white/5 font-bold text-xs uppercase tracking-widest">
                            Open <Badge className="ml-3 bg-primary/20 text-primary border-primary/20">{openTickets.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="closed" className="py-4 px-8 rounded-none data-[state=active]:bg-white/5 data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
                            Closed <Badge variant="outline" className="ml-3 border-white/10 text-gray-500">{closedTickets.length}</Badge>
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
