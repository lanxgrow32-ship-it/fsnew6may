
'use client';

import { useState, useEffect } from 'react';
import { getWalletReportData } from './actions';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FundedStockLogo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Home, Wallet, LogOut, Loader2, IndianRupee, TrendingUp, ShoppingCart, Gift, UserCheck, Swords, Users, Newspaper, Banknote, LineChart, Ticket } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) => (
    <Card className="bg-card">
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                    <p className="text-3xl font-black mt-1">{value}</p>
                </div>
                <div className={cn("p-3 rounded-2xl bg-muted/50", color)}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </CardContent>
    </Card>
);

import { cn } from '@/lib/utils';

export default function WalletReportsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getWalletReportData().then(d => { setData(d); setLoading(false); });
    }, []);

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
                        <SidebarMenuItem><SidebarMenuButton href="/admin/reports" tooltip="Reports"><LineChart />Reports</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/reports/wallet" isActive tooltip="Wallet Reports"><Wallet />Wallet Reports</SidebarMenuButton></SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu><SidebarMenuItem><form action={signOut} className="w-full"><SidebarMenuButton tooltip="Logout" asChild><button type="submit" className="w-full"><LogOut />Logout</button></SidebarMenuButton></form></SidebarMenuItem></SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4"><SidebarTrigger className="md:hidden" /><h1 className="text-xl font-semibold">Wallet Internal Reports</h1></div>
                    <ThemeToggle />
                </header>
                <main className="p-4 md:p-8 bg-muted/40 space-y-8">
                    {loading ? <div className="h-60 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div> : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard title="Total Deposits" value={`₹${data.totalDeposited.toLocaleString()}`} icon={IndianRupee} color="text-green-500" />
                                <StatCard title="Wallet Spend" value={`₹${data.totalSpent.toLocaleString()}`} icon={ShoppingCart} color="text-primary" />
                                <StatCard title="Total Bonuses" value={`₹${data.totalBonuses.toLocaleString()}`} icon={Gift} color="text-purple-500" />
                                <StatCard title="Net Circulation" value={`₹${data.netCirculation.toLocaleString()}`} icon={TrendingUp} color="text-blue-500" />
                            </div>

                            <Card>
                                <CardHeader><CardTitle>Audit Ledger</CardTitle><CardDescription>All internal wallet movements (Last 50 entries).</CardDescription></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow><TableHead>Date</TableHead><TableHead>User ID</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.recentActivity.map((tx: any) => (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="text-xs">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                                                    <TableCell className="font-mono text-[10px]">{tx.user_id}</TableCell>
                                                    <TableCell><Badge variant="outline" className="capitalize">{tx.type}</Badge></TableCell>
                                                    <TableCell className={cn("text-right font-bold", tx.amount > 0 ? "text-green-500" : "text-foreground")}>₹{Math.abs(tx.amount).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
