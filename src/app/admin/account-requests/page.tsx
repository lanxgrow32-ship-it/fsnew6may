'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Loader2, 
    Check, 
    X, 
    Home, 
    Ticket, 
    Wallet, 
    LogOut, 
    Banknote, 
    LineChart, 
    Swords, 
    Users, 
    Newspaper, 
    UserCheck, 
    Search,
    Filter,
    ShieldAlert,
    History,
    Globe,
    LayoutGrid,
    Zap
} from 'lucide-react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { approveAccount, deleteAccountRequest } from './actions';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function AccountRequestsPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    
    // Global Market Context
    const [marketType, setMarketType] = useState<'indian' | 'forex' | 'all'>('all');

    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');

    useEffect(() => {
        const saved = localStorage.getItem('fs_admin_market') as 'indian' | 'forex' | 'all';
        if (saved) setMarketType(saved);
    }, []);

    const handleMarketSwitch = (type: 'indian' | 'forex' | 'all') => {
        setMarketType(type);
        localStorage.setItem('fs_admin_market', type);
        toast({ title: `Market Switched`, description: `Context updated to ${type === 'all' ? 'Universal' : type === 'indian' ? 'Indian' : 'Forex'}` });
        fetchRequests(type);
    }

    const fetchRequests = async (targetMarket?: string) => {
        setLoading(true);
        const currentMarket = targetMarket || marketType;
        const client = await supabase;
        
        // PROTOCOL v11.0: Filter out Pro accounts (they have their own ledger)
        let query = client.from('user_accounts')
            .select('*, profiles(full_name, email, kyc_status, mobile_number)')
            .not('plan_name', 'ilike', '%pro%');
        
        if (currentMarket === 'indian') {
            query = query.or('market_type.eq.indian,market_type.is.null');
        } else if (currentMarket === 'forex') {
            query = query.eq('market_type', 'forex');
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(0, 49999);

        if (error) console.error("Fetch Failure:", error);
        setRequests(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, [marketType]);

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const profile = req.profiles || {};
            const fullName = (profile.full_name || '').toLowerCase();
            const email = (profile.email || '').toLowerCase();
            const search = searchTerm.toLowerCase();
            const matchesSearch = fullName.includes(search) || email.includes(search) || (req.transaction_id || '').toLowerCase().includes(search);

            let matchesStatus = true;
            if (statusFilter === 'pending') matchesStatus = !req.is_approved && req.status !== 'rejected';
            else if (statusFilter === 'approved') matchesStatus = req.is_approved;
            else if (statusFilter === 'rejected') matchesStatus = req.status === 'rejected';

            return matchesSearch && matchesStatus;
        });
    }, [requests, searchTerm, statusFilter]);

    const handleApprove = (id: string) => {
        startTransition(async () => {
            const res = await approveAccount(id);
            if (res.error) toast({ title: "Activation Error", description: res.error, variant: "destructive" });
            else {
                toast({ title: "Payment Verified", description: "Trader access granted." });
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
                        <SidebarMenuItem>
                            <div className="px-2 py-4 space-y-4">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Market Context</p>
                                <div className="flex flex-col gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleMarketSwitch('all')}
                                        className={cn("justify-start gap-2 h-10 px-3", marketType === 'all' ? "bg-primary text-white hover:bg-primary" : "text-muted-foreground")}
                                    >
                                        <Users className="w-4 h-4" />
                                        All Participants
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleMarketSwitch('indian')}
                                        className={cn("justify-start gap-2 h-10 px-3", marketType === 'indian' ? "bg-primary text-white hover:bg-primary" : "text-muted-foreground")}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                        Indian Market
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleMarketSwitch('forex')}
                                        className={cn("justify-start gap-2 h-10 px-3", marketType === 'forex' ? "bg-primary text-white hover:bg-primary" : "text-muted-foreground")}
                                    >
                                        <Globe className="w-4 h-4" />
                                        Forex Arena
                                    </Button>
                                </div>
                                <Separator className="opacity-50" />
                            </div>
                        </SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/dashboard"><Home />Dashboard</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/account-requests" isActive><UserCheck />Account Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/instant-pro-requests"><Zap className="text-primary"/> Instant Pro Ledger</SidebarMenuButton></SidebarMenuItem>
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
                            Standard Ledger
                            <Badge className="bg-primary/5 text-primary border-primary/20 text-[10px] font-black uppercase">
                                {marketType === 'all' ? 'Universal' : marketType === 'indian' ? 'Indian' : 'Forex'}
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
                                placeholder="Search by trader name, email, or UTR..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="pl-10 h-11 bg-card"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px] h-11 bg-card">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="All Status" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Awaiting Approval</SelectItem>
                                    <SelectItem value="approved">Activation History</SelectItem>
                                    <SelectItem value="rejected">Rejected Archives</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>{statusFilter === 'pending' ? 'Pending Requests' : 'Activation History'}</CardTitle>
                                <CardDescription>Managing {marketType.toUpperCase()} standard manual verifications.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg border border-white/5">
                                <History className="w-4 h-4 text-gray-500" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Master Ledger</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-8 w-8"/></div> : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Arrival Time</TableHead>
                                            <TableHead>Trader</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Reference (UTR)</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                                            <TableRow key={req.id} className={cn("group transition-colors h-20", req.is_approved ? "bg-green-500/[0.02]" : "hover:bg-muted/30")}>
                                                <TableCell className="text-[11px] font-bold text-muted-foreground">
                                                    {format(new Date(req.created_at), 'dd MMM, HH:mm')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-sm text-foreground">{req.profiles?.full_name || 'New User'}</div>
                                                    <div className="text-[10px] text-muted-foreground font-medium">{req.profiles?.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-bold bg-black/20 text-primary border-primary/20 text-[10px]">{req.plan_name}</Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-[10px] font-black text-gray-500 uppercase">
                                                    {req.transaction_id || 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!req.is_approved && req.status !== 'rejected' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" onClick={() => handleApprove(req.id)} className="bg-green-600 hover:bg-green-700 font-bold text-[10px] h-8" disabled={isPending}>
                                                                {isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3 mr-1"/>} Verify Payment
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleReject(req.id)} className="text-red-600 hover:bg-red-50 h-8 w-8 p-0" disabled={isPending}>
                                                                <X className="w-4 h-4"/>
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Badge variant={req.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[9px] font-black uppercase tracking-widest">
                                                            {req.status === 'rejected' ? 'Rejected' : 'Approved'}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-medium italic">No requests found matching your filters.</TableCell></TableRow>
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
