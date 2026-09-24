'use client';
import { useState, useEffect, useRef, useActionState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { 
    Home, 
    Ticket, 
    User, 
    LogOut, 
    Wallet, 
    UserPlus, 
    Loader2, 
    Banknote, 
    LineChart, 
    Swords, 
    Users, 
    Newspaper, 
    UserCheck, 
    ShieldAlert, 
    Globe, 
    LayoutGrid, 
    Database, 
    RefreshCw, 
    Package, 
    Zap,
    ShieldCheck,
    XCircle,
    FileBarChart
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { createAdmin, getSignupHourlyStats } from './actions';
import { UserTable } from './user-table';
import { ClientOnly } from '@/components/ui/client-only';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';

function CreateAdminForm({ className }: { className?: string }) {
    const ref = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [state, formAction] = useActionState(createAdmin, { error: null, success: false });
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (state.error) toast({ title: "Error", description: state.error, variant: "destructive" });
        if (state.success) {
            toast({ title: "Admin created" });
            ref.current?.reset();
            setIsOpen(false);
        }
    }, [state, toast]);

    function SubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" disabled={pending}>
                {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Working...</> : 'Create admin'}
            </Button>
        );
    }

    return (
       <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className={className} variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    New admin
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                 <form ref={ref} action={formAction} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>Add new admin</DialogTitle>
                        <DialogDescription>Enter details for the new staff member.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full name</Label>
                            <Input id="full_name" name="full_name" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="password">Temporary password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                    </div>
                    <DialogFooter><SubmitButton /></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminDashboardClient({ 
    initialProfiles, 
    initialCount, 
    isBridgeConfigured
}: { 
    initialProfiles: any[], 
    initialCount: number, 
    isBridgeConfigured: boolean
}) {
  const supabase = createClient();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [totalDbCount, setTotalDbCount] = useState(initialCount);
  const [marketType, setMarketType] = useState<'indian' | 'forex' | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingHourly, setIsGeneratingHourly] = useState(false);
  const { toast } = useToast();
  
  const fetchProfiles = async (targetMarket?: string) => {
    setIsRefreshing(true);
    const client = await supabase;
    const currentMarket = targetMarket || marketType;

    let allFetchedProfiles: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    let finalCount = 0;

    try {
        while (hasMore) {
            let query = client.from('profiles').select('*', { count: 'exact' });
            query = query.or('role.neq.admin,role.is.null');
            
            if (currentMarket === 'indian') query = query.or('market_type.eq.indian,market_type.is.null');
            else if (currentMarket === 'forex') query = query.eq('market_type', 'forex');

            const { data: chunk, error, count } = await query
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) throw error;
            if (chunk) {
                allFetchedProfiles = [...allFetchedProfiles, ...chunk];
                finalCount = count || allFetchedProfiles.length;
                if (chunk.length < pageSize) hasMore = false;
                else page++;
            } else hasMore = false;
        }
        setProfiles(allFetchedProfiles);
        setTotalDbCount(finalCount);
    } catch (error: any) {
        console.error(error);
    } finally {
        setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('fs_admin_market') as any;
    if (saved) setMarketType(saved);
    fetchProfiles(saved);
  }, []);

  const handleMarketSwitch = (type: any) => {
      setMarketType(type);
      localStorage.setItem('fs_admin_market', type);
      fetchProfiles(type);
  };

  const downloadHourlyReport = async () => {
    setIsGeneratingHourly(true);
    const res = await getSignupHourlyStats();
    if (res.data) {
        const csv = Papa.unparse(res.data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `hourly_signups_ist.csv`;
        link.click();
        toast({ title: "Report downloaded" });
    }
    setIsGeneratingHourly(false);
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
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Market context</p>
                    <div className="flex flex-col gap-1">
                         <Button variant="ghost" size="sm" onClick={() => handleMarketSwitch('all')} className={cn("justify-start gap-2 h-10 px-3", marketType === 'all' ? "bg-primary text-white" : "text-muted-foreground")}><Users className="w-4 h-4" /> All traders</Button>
                         <Button variant="ghost" size="sm" onClick={() => handleMarketSwitch('indian')} className={cn("justify-start gap-2 h-10 px-3", marketType === 'indian' ? "bg-primary text-white" : "text-muted-foreground")}><LayoutGrid className="w-4 h-4" /> Indian market</Button>
                         <Button variant="ghost" size="sm" onClick={() => handleMarketSwitch('forex')} className={cn("justify-start gap-2 h-10 px-3", marketType === 'forex' ? "bg-primary text-white" : "text-muted-foreground")}><Globe className="w-4 h-4" /> Forex arena</Button>
                    </div>
                    <Separator className="opacity-50" />
                </div>
            </SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/dashboard" isActive tooltip="Dashboard"><Home />Dashboard</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/plans" tooltip="Plans"><Package />Plan manager</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/account-requests" tooltip="Requests"><UserCheck />Account requests</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/activation-hub" tooltip="Hub"><ShieldAlert />Activation hub</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/competition" tooltip="Competitions"><Swords />Competition</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/coupons" tooltip="Coupons"><Ticket />Coupons</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/blog" tooltip="Blog"><Newspaper />Blog</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/wallet-requests" tooltip="Wallet"><Wallet />Wallet requests</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/payouts" tooltip="Payouts"><Banknote />Payouts</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/reports" tooltip="Reports"><LineChart />Reports</SidebarMenuButton></SidebarMenuItem>
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
                <h1 className="text-xl font-bold tracking-tight">User management</h1>
           </div>
           <div className="flex items-center gap-3">
            {isRefreshing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            <Button variant="outline" size="sm" onClick={downloadHourlyReport} disabled={isGeneratingHourly} className="hidden lg:flex h-9 text-[10px] font-bold uppercase tracking-widest border-amber-500/20 text-amber-600">
                {isGeneratingHourly ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : <FileBarChart className="mr-2 h-3 w-3" />} Hourly report (IST)
            </Button>
            <ThemeToggle />
            <CreateAdminForm />
           </div>
        </header>
        <main className="p-4 md:p-8 bg-muted/40 space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card><CardHeader className="pb-2"><CardDescription className="uppercase text-[10px] font-bold">Total traders</CardDescription></CardHeader><CardContent><div className="text-3xl font-bold">{totalDbCount}</div></CardContent></Card>
                <Card className={cn(isBridgeConfigured ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20")}><CardHeader className="pb-2"><CardDescription className="uppercase text-[10px] font-bold">Hub sync status</CardDescription></CardHeader><CardContent><div className={cn("text-lg font-bold uppercase", isBridgeConfigured ? "text-green-500" : "text-red-500")}>{isBridgeConfigured ? "Connected" : "Offline"}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardDescription className="uppercase text-[10px] font-bold">Active view</CardDescription></CardHeader><CardContent><div className="text-lg font-bold capitalize">{marketType} participants</div></CardContent></Card>
            </div>
            
            <ClientOnly fallback={<div className="h-96 w-full animate-pulse bg-card rounded-xl" />}>
                <UserTable 
                    profiles={profiles || []} 
                    onUserDelete={() => fetchProfiles()} 
                    onUserUpdate={() => fetchProfiles()} 
                />
            </ClientOnly>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}