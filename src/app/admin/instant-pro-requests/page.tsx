
'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    Loader2, 
    Check, 
    X, 
    Home, 
    Wallet, 
    LogOut, 
    Zap, 
    Search,
    ShieldAlert,
    Timer,
    LayoutGrid,
    Globe,
    UserCheck,
    Swords,
    Users,
    Ticket,
    Newspaper,
    Banknote,
    LineChart
} from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { approveProAccount, rejectProAccount } from './actions';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function InstantProLedger() {
    const supabase = createClient();
    const { toast } = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState('');
    const [marketType, setMarketType] = useState<'indian' | 'forex'>('indian');

    useEffect(() => {
        const saved = localStorage.getItem('fs_admin_market') as 'indian' | 'forex';
        if (saved) setMarketType(saved);
    }, []);

    const fetchRequests = async (targetMarket?: string) => {
        setLoading(true);
        const currentMarket = targetMarket || marketType;
        const client = await supabase;
        
        let query = client.from('user_accounts')
            .select('*, profiles(full_name, email)')
            .ilike('plan_name', '%pro%')
            .range(0, 4999);
        
        if (currentMarket === 'indian') {
            query = query.or('market_type.eq.indian,market_type.is.null');
        } else {
            query = query.eq('market_type', 'forex');
        }

        const { data } = await query.order('created_at', { ascending: false });
        setRequests(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchRequests(); }, [marketType]);

    const handleApprove = (id: string) => {
        startTransition(async () => {
            const res = await approveProAccount(id);
            if (res.error) toast({ title: "Error", description: res.error, variant: "destructive" });
            else {
                toast({ title: "Pro Account Activated", description: "7-Day cycle initialized." });
                fetchRequests();
            }
        });
    };

    const handleReject = (id: string) => {
        startTransition(async () => {
            const res = await rejectProAccount(id);
            if (res.error) toast({ title: "Error", description: res.error, variant: "destructive" });
            else {
                toast({ title: "Request Rejected" });
                fetchRequests();
            }
        });
    };

    const filtered = requests.filter(r => 
        (r.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.profiles?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <SidebarMenuItem><SidebarMenuButton href="/admin/account-requests"><UserCheck />Account Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/instant-pro-requests" isActive><Zap className="text-primary"/> Instant Pro Ledger</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/activation-hub"><ShieldAlert />Activation Hub</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/competition"><Swords />Competition</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/pay-later"><Users />Pay Later Users</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/coupons"><Ticket />Coupons</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/blog"><Newspaper />Blog</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/wallet-requests"><Wallet />Wallet Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payouts"><Banknote />Payouts</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/reports"><LineChart />Reports</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payment-settings" tooltip="Payment Settings"><Wallet />Settings</SidebarMenuButton></SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu><SidebarMenuItem><form action={signOut} className="w-full"><SidebarMenuButton asChild><button type="submit" className="w-full"><LogOut />Logout</button></SidebarMenuButton></form></SidebarMenuItem></SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                            Instant Pro Ledger
                            <Badge className="bg-primary/5 text-primary border-primary/20 text-[10px] font-black uppercase">
                                {marketType === 'indian' ? 'Indian' : 'Forex'}
                            </Badge>
                        </h1>
                    </div>
                    <ThemeToggle />
                </header>
                <main className="p-4 md:p-8 bg-muted/40 space-y-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Filter pro requests..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="pl-10 h-11 bg-card"
                            />
                        </div>
                    </div>

                    <Card className="border-primary/20 bg-primary/[0.01]">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2"><Timer className="w-5 h-5 text-primary"/> Pending Pro Activations</CardTitle>
                                <CardDescription>Verification for 7-Day high intensity accounts.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-8 w-8"/></div> : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Arrival</TableHead>
                                            <TableHead>Trader</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>UTR</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filtered.length > 0 ? filtered.map((req) => (
                                            <TableRow key={req.id} className={cn("group h-20", req.is_approved ? "opacity-50" : "hover:bg-primary/5")}>
                                                <TableCell className="text-[11px] font-bold text-muted-foreground">
                                                    {format(new Date(req.created_at), 'dd MMM, HH:mm')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-sm">{req.profiles?.full_name}</div>
                                                    <div className="text-[10px] text-muted-foreground">{req.profiles?.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-black bg-primary/10 text-primary border-primary/20 text-[9px] uppercase tracking-widest">{req.plan_name}</Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-[10px] font-black text-gray-500 uppercase">{req.transaction_id || 'N/A'}</TableCell>
                                                <TableCell className="text-right">
                                                    {!req.is_approved && req.status !== 'rejected' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" onClick={() => handleApprove(req.id)} className="bg-primary hover:bg-primary/90 font-bold text-[10px] h-8" disabled={isPending}>
                                                                {isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3 mr-1"/>} Verify Pro
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleReject(req.id)} className="text-red-600 hover:bg-red-50 h-8 w-8 p-0" disabled={isPending}>
                                                                <X className="w-4 h-4"/>
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[9px] font-black uppercase">{req.status}</Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-medium italic">No Pro requests found.</TableCell></TableRow>
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
