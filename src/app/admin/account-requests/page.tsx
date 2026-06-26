'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Home, Ticket, Wallet, LogOut, Banknote, LineChart, Swords, Users, Newspaper, UserCheck } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { approveAccount, deleteAccountRequest } from './actions';

export default function AccountRequestsPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const fetchRequests = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('user_accounts')
            .select('*, profiles(full_name, email, kyc_status)')
            .eq('is_approved', false)
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
                toast({ title: "Account Approved" });
                fetchRequests();
            }
        });
    };

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const res = await deleteAccountRequest(id);
            if (res.error) toast({ title: "Error", description: res.error, variant: "destructive" });
            else {
                toast({ title: "Request Deleted" });
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
                        <SidebarMenuItem><SidebarMenuButton href="/admin/dashboard" tooltip="Dashboard"><Home />Dashboard</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/account-requests" isActive tooltip="Account Requests"><UserCheck />Account Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/competition" tooltip="Competition"><Swords />Competition</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/pay-later" tooltip="Pay Later Users"><Users />Pay Later Users</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/coupons" tooltip="Coupons"><Ticket />Coupons</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/blog" tooltip="Blog"><Newspaper />Blog</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/wallet-requests" tooltip="Wallet Requests"><Wallet />Wallet Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payouts" tooltip="Payouts"><Banknote />Payouts</SidebarMenuButton></SidebarMenuItem>
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
                    <div className="flex items-center gap-4"><SidebarTrigger className="md:hidden" /><h1 className="text-xl font-semibold">Account Purchase Requests</h1></div>
                    <ThemeToggle />
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Secondary Purchases</CardTitle>
                            <CardDescription>Approve new account requests from existing users.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin"/></div> : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>UTR / Transaction</TableHead>
                                            <TableHead>KYC Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.length > 0 ? requests.map((req) => (
                                            <TableRow key={req.id}>
                                                <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{req.profiles?.full_name}</div>
                                                    <div className="text-xs text-muted-foreground">{req.profiles?.email}</div>
                                                </TableCell>
                                                <TableCell>{req.plan_name}</TableCell>
                                                <TableCell className="font-mono text-xs">{req.transaction_id}</TableCell>
                                                <TableCell>
                                                    <Badge variant={req.profiles?.kyc_status === 'verified' ? 'default' : 'secondary'}>
                                                        {req.profiles?.kyc_status || 'pending'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleApprove(req.id)} className="text-green-600 border-green-600 hover:bg-green-50" disabled={isPending}>
                                                        <Check className="w-4 h-4 mr-1"/> Approve
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(req.id)} className="text-red-600 hover:bg-red-50" disabled={isPending}>
                                                        <X className="w-4 h-4"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No pending account requests.</TableCell></TableRow>
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