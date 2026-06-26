
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { supabaseAdmin } from '@/lib/supabase/admin';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { FundedStockLogo } from '@/components/ui/logo';
import { Home, Ticket, Wallet, LogOut, Banknote, MessageSquare, LineChart, Swords, Users, Newspaper, UserCheck, Inbox } from 'lucide-react';
import { signOut } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function TicketsTable({ tickets }: { tickets: any[] }) {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="border-white/5">
                        <TableHead className="text-xs font-bold text-gray-500">Trader</TableHead>
                        <TableHead className="text-xs font-bold text-gray-500">Subject</TableHead>
                        <TableHead className="text-xs font-bold text-gray-500">Last Activity</TableHead>
                        <TableHead className="text-right text-xs font-bold text-gray-500">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tickets.length > 0 ? tickets.map((t) => (
                        <TableRow key={t.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                            <TableCell>
                                <Link href={`/admin/tickets/${t.id}`} className="block py-1">
                                    <div className="font-bold text-white text-sm">{t.profiles?.full_name || 'New Trader'}</div>
                                    <div className="text-[10px] text-gray-500 font-medium">{t.profiles?.email}</div>
                                </Link>
                            </TableCell>
                            <TableCell>
                                <Link href={`/admin/tickets/${t.id}`} className="block font-medium text-gray-300 hover:text-primary transition-colors">
                                    {t.subject}
                                </Link>
                            </TableCell>
                             <TableCell>
                                <Link href={`/admin/tickets/${t.id}`} className="block text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}
                                </Link>
                             </TableCell>
                            <TableCell className="text-right">
                               <Link href={`/admin/tickets/${t.id}`} className="flex items-center justify-end gap-3">
                                    {t.unread_count_admin > 0 && (
                                        <Badge className="bg-primary text-white text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full">
                                            {t.unread_count_admin}
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className={cn("capitalize text-[9px] font-bold border-none", t.status === 'open' ? "text-green-400 bg-green-500/5" : "text-gray-500")}>
                                        {t.status}
                                    </Badge>
                                </Link>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-60 text-center">
                                <Inbox className="h-10 w-10 text-gray-900 mx-auto mb-4" />
                                <p className="text-gray-600 font-medium italic">No tickets found.</p>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

export default async function AdminTicketsPage() {
    const { data: tickets } = await supabaseAdmin
        .from('support_conversations')
        .select('*, profiles:user_id(full_name, email)')
        .neq('subject', 'LIVE_CHAT')
        .order('last_message_at', { ascending: false });

    const openTickets = (tickets || []).filter(t => t.status === 'open');
    const closedTickets = (tickets || []).filter(t => t.status === 'closed');
    
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="border-b p-4 h-[57px] flex items-center">
                    <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg">
                        <FundedStockLogo className="w-8 h-8 text-primary" />
                        <span className="text-foreground group-[[data-state=collapsed]]:hidden">FundedStock 2.0</span>
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/dashboard" tooltip="Dashboard"><Home />Dashboard</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/account-requests" tooltip="Account Requests"><UserCheck />Account Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/competition" tooltip="Competition"><Swords />Competition</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/pay-later" tooltip="Pay Later Users"><Users />Pay Later Users</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/coupons" tooltip="Coupons"><Ticket />Coupons</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/blog" tooltip="Blog"><Newspaper />Blog</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/wallet-requests" tooltip="Wallet Requests"><Wallet />Wallet Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payouts" tooltip="Payouts"><Banknote />Payouts</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/tickets" isActive tooltip="Support"><MessageSquare />Support</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/reports" tooltip="Reports"><LineChart />Reports</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payment-settings" tooltip="Payment Settings"><Wallet />Payment Settings</SidebarMenuButton></SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu><SidebarMenuItem><form action={signOut} className="w-full"><SidebarMenuButton tooltip="Logout" asChild><button type="submit" className="w-full"><LogOut />Logout</button></SidebarMenuButton></form></SidebarMenuItem></SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4"><SidebarTrigger className="md:hidden" /><h1 className="text-xl font-bold tracking-tight">Support Desk</h1></div>
                    <ThemeToggle />
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
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
            </SidebarInset>
        </SidebarProvider>
    );
}
