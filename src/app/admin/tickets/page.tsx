
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { supabaseAdmin } from '@/lib/supabase/admin'; // Use admin client

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FundedStockLogo } from '@/components/ui/logo';
import { Home, Ticket, Wallet, LogOut, Banknote, MessageSquare, LineChart, Swords } from 'lucide-react';
import { signOut } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ui/theme-toggle';

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
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tickets.length > 0 ? tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="cursor-pointer">
                        <TableCell>
                            <Link href={`/admin/tickets/${ticket.id}`} className="block">
                                <div className="font-medium">{ticket.profiles?.full_name}</div>
                                <div className="text-sm text-muted-foreground">{ticket.profiles?.email}</div>
                            </Link>
                        </TableCell>
                        <TableCell>
                            <Link href={`/admin/tickets/${ticket.id}`} className="block">
                                {ticket.subject}
                            </Link>
                        </TableCell>
                         <TableCell>
                            <Link href={`/admin/tickets/${ticket.id}`} className="block">
                                {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                            </Link>
                         </TableCell>
                        <TableCell className="text-right">
                           <Link href={`/admin/tickets/${ticket.id}`} className="block">
                                <Badge variant={ticket.status === 'Open' ? 'destructive' : 'secondary'}>
                                    {ticket.status}
                                </Badge>
                            </Link>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">No tickets found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

export default async function AdminTicketsPage() {
    // Use the admin client to fetch data directly, bypassing RLS.
    const { data: tickets, error } = await supabaseAdmin
        .from('tickets')
        .select('*, profiles:user_id(full_name, email)')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error("Error fetching tickets:", error);
        // Handle error state if necessary
    }

    const openTickets = (tickets || []).filter(t => t.status === 'Open');
    const closedTickets = (tickets || []).filter(t => t.status === 'Closed');
    
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
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/dashboard" tooltip="Dashboard">
                                <Home />
                                Dashboard
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/competition" tooltip="Competition">
                                <Swords />
                                Competition
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/coupons" tooltip="Coupons">
                                <Ticket />
                                Coupons
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/payouts" tooltip="Payouts">
                                <Banknote />
                                Payouts
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/tickets" isActive tooltip="Support">
                                <MessageSquare />
                                Support
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/reports" tooltip="Reports">
                                <LineChart />
                                Reports
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/payment-settings" tooltip="Payment Settings">
                                <Wallet />
                                Payment Settings
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
                    <ThemeToggle />
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
                    <Card>
                        <CardContent className="p-0">
                           <Tabs defaultValue="open">
                                <TabsList className="p-2 h-auto rounded-none bg-muted w-full justify-start">
                                    <TabsTrigger value="open">Open <Badge className="ml-2">{openTickets.length}</Badge></TabsTrigger>
                                    <TabsTrigger value="closed">Closed <Badge variant="secondary" className="ml-2">{closedTickets.length}</Badge></TabsTrigger>
                                </TabsList>
                                <div className="p-4">
                                <TabsContent value="open">
                                    <TicketsTable tickets={openTickets} />
                                </TabsContent>
                                <TabsContent value="closed">
                                    <TicketsTable tickets={closedTickets} />
                                </TabsContent>
                                </div>
                           </Tabs>
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
