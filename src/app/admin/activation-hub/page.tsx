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
    History, 
    Clock, 
    Search,
    Filter,
    AlertTriangle,
    ShieldAlert
} from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { approveAccount } from '../account-requests/actions';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ActivationHubPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    
    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchRequests = async () => {
        setLoading(true);
        const client = await supabase;
        const { data } = await client
            .from('user_accounts')
            .select('*, profiles(full_name, email, kyc_status, mobile_number)')
            .order('created_at', { ascending: false })
            .range(0, 49999);
        setRequests(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const profile = req.profiles || {};
            const fullName = (profile.full_name || '').toLowerCase();
            const email = (profile.email || '').toLowerCase();
            const search = searchTerm.toLowerCase();
            const matchesSearch = fullName.includes(search) || email.includes(search) || (req.transaction_id || '').toLowerCase().includes(search);

            let matchesStatus = true;
            if (statusFilter === 'error') matchesStatus = !!req.activation_error;
            else if (statusFilter === 'active') matchesStatus = req.status === 'active';
            else if (statusFilter === 'pending') matchesStatus = req.is_approved && !req.credentials_provided;

            return matchesSearch && matchesStatus;
        });
    }, [requests, searchTerm, statusFilter]);

    const handleRetrySync = (id: string) => {
        startTransition(async () => {
            const res = await approveAccount(id);
            if (res.error) toast({ title: "Sync Failed", description: res.error, variant: "destructive" });
            else {
                toast({ title: "Sync Successful", description: "Account provisioned on Hub." });
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
                        <SidebarMenuItem><SidebarMenuButton href="/admin/account-requests"><UserCheck />Account Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/activation-hub" isActive><ShieldAlert />Activation Hub</SidebarMenuButton></SidebarMenuItem>
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
                    <div className="flex items-center gap-4"><SidebarTrigger className="md:hidden" /><h1 className="text-xl font-bold">Activation Hub Ledger</h1></div>
                    <ThemeToggle />
                </header>
                <main className="p-4 md:p-8 bg-muted/40 space-y-6">
                    {/* Search and Filters Bar */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by trader name or email..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="pl-10 h-11 bg-card"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px] h-11 bg-card">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="All Activity" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sync Logs</SelectItem>
                                    <SelectItem value="error" className="text-red-500 font-bold">Failed Syncs</SelectItem>
                                    <SelectItem value="active">Active Accounts</SelectItem>
                                    <SelectItem value="pending">Awaiting KYC</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Sync History</CardTitle>
                                <CardDescription>Showing {filteredRequests.length} technical logs from the Stockmint handshake.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg border border-white/5">
                                <History className="w-4 h-4 text-gray-500" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Hub Stream</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-8 w-8"/></div> : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[180px]">Arrival</TableHead>
                                            <TableHead>Trader Identity</TableHead>
                                            <TableHead>Requested Plan</TableHead>
                                            <TableHead>Sync Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                                            <TableRow key={req.id} className={cn("group transition-colors h-20", req.activation_error ? "bg-red-500/[0.02]" : "hover:bg-muted/30")}>
                                                <TableCell className="text-[11px] font-bold text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3 opacity-50"/>
                                                        {format(new Date(req.created_at), 'dd MMM, HH:mm')}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-sm text-foreground">{req.profiles?.full_name || 'Incomplete Profile'}</div>
                                                    <div className="text-[10px] text-muted-foreground font-medium">{req.profiles?.email}</div>
                                                    <div className="text-[9px] text-primary font-bold">{req.profiles?.mobile_number || 'Missing Mobile'}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-bold bg-black/20 text-primary border-primary/20 text-[10px]">{req.plan_name}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {req.activation_error ? (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex items-center gap-2 text-red-500 cursor-help">
                                                                        <AlertTriangle className="h-4 w-4 animate-pulse" />
                                                                        <span className="text-[10px] font-black uppercase underline decoration-dotted">Sync Failed</span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="bg-slate-900 text-white border-white/10 max-w-xs">
                                                                    <p className="text-[11px] font-medium leading-relaxed">{req.activation_error}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ) : req.credentials_provided ? (
                                                        <div className="flex items-center gap-2 text-green-500">
                                                            <Check className="h-4 w-4" />
                                                            <span className="text-[10px] font-black uppercase">Hub Provisioned</span>
                                                        </div>
                                                    ) : req.is_approved ? (
                                                        <div className="flex items-center gap-2 text-amber-500">
                                                            <Clock className="h-4 w-4" />
                                                            <span className="text-[10px] font-black uppercase">Awaiting KYC Gate</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase">Pre-Approval</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end">
                                                        <Button size="sm" variant="outline" onClick={() => handleRetrySync(req.id)} className="h-8 text-[9px] font-black uppercase tracking-widest" disabled={isPending || !req.is_approved}>
                                                            {isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3 mr-1"/>}
                                                            Manual Sync
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-medium italic">No sync records found matching your filters.</TableCell></TableRow>
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

function RefreshCw({ className }: { className?: string }) {
    return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.8273 3 17.3387 4.3039 19 6.33333M21 3V9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
