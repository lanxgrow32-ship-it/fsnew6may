
'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Home, Ticket, Wallet, LogOut, Banknote, LineChart, Swords, Users, Newspaper, UserCheck, History, Clock } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { approveAccount, deleteAccountRequest } from './actions';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AccountRequestsPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const fetchRequests = async () => {
        setLoading(true);
        const client = await supabase;
        // FETCH ALL (Persistent Ledger)
        const { data } = await client
            .from('user_accounts')
            .select('*, profiles(full_name, email, kyc_status)')
            .order('created_at', { ascending: false })
            .range(0, 49999);
        setRequests(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = (id: string) => {
        startTransition(async () => {
            const res = await approveAccount(id);
            if (res.error) toast({ title: "Error", description: res.error, variant: "destructive" });
            else {
                toast({ title: "Account Activated" });
                fetchRequests();
            }
        });
    };

    const handleReject = (id: string) => {
        startTransition(async () => {
            const res = await deleteAccountRequest(id);
            if (res.error) toast({ title: "Error", description: res.error, variant: "destructive" });
            else {
                toast({ title: "Request Rejected" });
                fetchRequests();
            }
        });
    };

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
                        <SidebarMenuItem><SidebarMenuButton href="/admin/dashboard"><Home />Dashboard</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/account-requests" isActive><UserCheck />Account Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/competition"><Swords />Competition</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/pay-later"><Users />Pay Later Users</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/coupons"><Ticket />Coupons</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/blog"><Newspaper />Blog</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/wallet-requests"><Wallet />Wallet Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payouts"><Banknote />Payouts</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/reports"><LineChart />Reports</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payment-settings"><Wallet />Settings</SidebarMenuButton></SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu><SidebarMenuItem><form action={signOut} className="w-full"><SidebarMenuButton asChild><button type="submit" className="w-full"><LogOut />Logout</button></SidebarMenuButton></form></SidebarMenuItem></SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4"><SidebarTrigger className="md:hidden" /><h1 className="text-xl font-bold">Activation Management Ledger</h1></div>
                    <ThemeToggle />
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Request History</CardTitle>
                                <CardDescription>Comprehensive audit trail of all manual UPI activations.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg border border-white/5">
                                <History className="w-4 h-4 text-gray-500" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Permanent Logs Active</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-8 w-8"/></div> : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[180px]">Arrival Timestamp</TableHead>
                                            <TableHead>Trader</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>UTR Reference</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.length > 0 ? requests.map((req) => (
                                            <TableRow key={req.id} className={cn("group transition-colors", req.is_approved ? "bg-green-500/[0.02]" : req.status === 'rejected' ? "bg-red-500/[0.02] opacity-70" : "hover:bg-muted/30")}>
                                                <TableCell className="text-[11px] font-bold text-muted-foreground flex items-center gap-2">
                                                    <Clock className="w-3 h-3 opacity-50"/>
                                                    {format(new Date(req.created_at), 'dd MMM yyyy, HH:mm')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-sm text-foreground">{req.profiles?.full_name}</div>
                                                    <div className="text-[10px] text-muted-foreground font-medium">{req.profiles?.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-bold bg-black/20 text-primary border-primary/20 text-[10px]">{req.plan_name}</Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs font-black text-foreground">{req.transaction_id || 'N/A'}</TableCell>
                                                <TableCell>
                                                    {req.is_approved ? (
                                                        <Badge className="bg-green-600 text-white font-bold text-[9px] uppercase tracking-widest">✓ Approved</Badge>
                                                    ) : req.status === 'rejected' ? (
                                                        <Badge variant="destructive" className="font-bold text-[9px] uppercase tracking-widest">✕ Rejected</Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-500 text-white font-bold text-[9px] uppercase tracking-widest animate-pulse">Pending</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!req.is_approved && req.status !== 'rejected' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" onClick={() => handleApprove(req.id)} className="bg-green-600 hover:bg-green-700 font-bold text-[10px] h-8" disabled={isPending}>
                                                                {isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3 mr-1"/>} Activate
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleReject(req.id)} className="text-red-600 hover:bg-red-50 h-8 w-8 p-0" disabled={isPending}>
                                                                <X className="w-4 h-4"/>
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-muted-foreground italic pr-4">Log Lock</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-medium italic">No account requests in the database.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
