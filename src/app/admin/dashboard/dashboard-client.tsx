'use client';
import { useState, useEffect, useRef, useActionState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, Ticket, User, LogOut, Wallet, UserPlus, Loader2, Banknote, LineChart, Swords, Users, Newspaper, UserCheck, Megaphone, ShieldAlert, Globe, LayoutGrid } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { createAdmin } from './actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserTable } from './user-table';
import { ClientOnly } from '@/components/ui/client-only';
import { Skeleton } from '@/components/ui/skeleton';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

function CreateAdminForm({ className }: { className?: string }) {
    const ref = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [state, formAction] = useActionState(createAdmin, { error: null, success: false });
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (state.error) {
            toast({
                title: "Error Creating Admin",
                description: state.error,
                variant: "destructive",
            });
        }
        if (state.success) {
            toast({
                title: "Success",
                description: "Admin user created successfully.",
            });
            ref.current?.reset();
            setIsOpen(false);
        }
    }, [state, toast]);

    function SubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" disabled={pending}>
                {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Admin User'}
            </Button>
        );
    }

    return (
       <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className={className}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create New Admin
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                 <form ref={ref} action={formAction} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>Create New Admin User</DialogTitle>
                        <DialogDescription>
                            Enter the details for the new admin. They will be able to log in with this email and password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input id="full_name" name="full_name" placeholder="Jane Doe" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="password">Temporary Password</Label>
                            <Input id="password" name="password" type="password" required />
                             <p className="text-xs text-muted-foreground">Must be at least 6 characters long.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


function AdminNav() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border">
                        <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Admin</p>
                        <p className="text-xs leading-none text-muted-foreground">admin@fundedstock.com</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <form action={signOut}>
                    <DropdownMenuItem asChild>
                        <button type="submit" className="w-full">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </button>
                    </DropdownMenuItem>
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function UserTableSkeleton() {
    return (
        <Card className="shadow-sm">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-64 mt-2" />
              </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                   <div className="space-y-4">
                       <Skeleton className="h-12 w-full" />
                       <Skeleton className="h-12 w-full" />
                       <Skeleton className="h-12 w-full" />
                       <Skeleton className="h-12 w-full" />
                   </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function AdminDashboardClient({ initialProfiles, initialCount, masterView }: { initialProfiles: any[], initialCount: number, masterView: boolean }) {
  const supabase = createClient();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [totalDbCount, setTotalDbCount] = useState(initialCount);
  const [marketType, setMarketType] = useState<'indian' | 'forex'>('indian');
  const { toast } = useToast();
  
  // Persist market selection
  useEffect(() => {
    const saved = localStorage.getItem('fs_admin_market') as 'indian' | 'forex';
    if (saved) setMarketType(saved);
  }, []);

  const handleMarketSwitch = (type: 'indian' | 'forex') => {
      setMarketType(type);
      localStorage.setItem('fs_admin_market', type);
      toast({ title: `Context Switched`, description: `Viewing ${type === 'indian' ? 'Indian Market' : 'Forex Arena'}` });
  }
  
  useEffect(() => {
    setProfiles(initialProfiles);
    setTotalDbCount(initialCount);
  }, [initialProfiles, initialCount]);

  const fetchProfiles = async () => {
    const client = await supabase;
    let query = client.from('profiles').select('*', { count: 'exact' }).eq('account_type', 'standard').or('account_model.is.null,account_model.neq.passthrupay');
    if (masterView) {
      query = query.eq('is_hidden', true);
    } else {
      query = query.or('is_hidden.is.false,is_hidden.is.null');
    }
    
    const { data: updatedProfiles, error, count } = await query
        .order('created_at', { ascending: false })
        .range(0, 49999);

    if (error) {
        toast({ title: 'Error fetching profiles', description: error.message, variant: 'destructive' });
    } else if (updatedProfiles) {
        setProfiles(updatedProfiles);
        setTotalDbCount(count || updatedProfiles.length);
    }
  }

  useEffect(() => {
    const initSub = async () => {
        const client = await supabase;
        const channel = client
          .channel('realtime profiles')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, 
            () => { fetchProfiles(); }
          )
          .subscribe();

        return () => {
          client.removeChannel(channel);
        };
    }
    initSub();
  }, [supabase, masterView]);
  
  const onUserDelete = (deletedUserId: string) => {
    setProfiles(prevProfiles => prevProfiles.filter(p => p.id !== deletedUserId));
    setTotalDbCount(prev => prev - 1);
    toast({ title: 'User deleted successfully' });
  };

  const handleUserDeleteError = (errorMessage: string) => {
    toast({ title: 'Error Deleting User', description: errorMessage, variant: 'destructive' });
  };
  
  const handleUserUpdate = () => {
      toast({ title: 'User data updated successfully' });
      fetchProfiles();
  }

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => p.market_type === marketType || (!p.market_type && marketType === 'indian'));
  }, [profiles, marketType]);

  const stats = [
    { title: "Total Traders", value: filteredProfiles.length || 0, icon: User },
    { title: "Pending Approval", value: filteredProfiles.filter(p => !p.is_approved).length || 0, icon: User },
    { title: "KYC Submitted", value: filteredProfiles.filter(p => p.kyc_status === 'submitted').length || 0, icon: User },
  ];

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
            <SidebarMenuItem><SidebarMenuButton href="/admin/dashboard" isActive tooltip="Dashboard"><Home />Dashboard</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/account-requests" tooltip="Account Requests"><UserCheck />Account Requests</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/activation-hub" tooltip="Activation Hub"><ShieldAlert />Activation Hub</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/competition" tooltip="Competition"><Swords />Competition</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/pay-later" tooltip="Pay Later Users"><Users />Pay Later Users</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/coupons" tooltip="Coupons"><Ticket />Coupons</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/blog" tooltip="Blog"><Newspaper />Blog</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/wallet-requests" tooltip="Wallet Requests"><Wallet />Wallet Requests</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/payouts" tooltip="Payouts"><Banknote />Payouts</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/reports" tooltip="Reports"><LineChart />Reports</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/payment-settings" tooltip="Payment Settings"><Wallet />Settings</SidebarMenuButton></SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t p-2">
            <SidebarMenu><SidebarMenuItem><form action={signOut} className="w-full"><SidebarMenuButton tooltip="Logout" asChild><button type="submit" className="w-full"><LogOut />Logout</button></SidebarMenuButton></form></SidebarMenuItem></SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
           <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <h1 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                    User Management
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-black uppercase">
                        {marketType === 'indian' ? 'Indian' : 'Forex'}
                    </Badge>
                </h1>
           </div>
           <div className="flex items-center gap-4"><ThemeToggle /><CreateAdminForm className="hidden md:flex"/><ClientOnly fallback={<Skeleton className="h-10 w-10 rounded-full" />}><AdminNav /></ClientOnly></div>
        </header>
        <main className="p-4 md:p-8 bg-muted/40">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {stats.map(stat => (
                    <Card key={stat.title} className="shadow-sm border-white/5 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</CardTitle><stat.icon className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-3xl font-black text-foreground">{stat.value}</div></CardContent>
                    </Card>
                ))}
            </div>
            <CreateAdminForm className="w-full md:hidden mb-6" />
            <ClientOnly fallback={<UserTableSkeleton />}><UserTable profiles={filteredProfiles || []} onUserDelete={onUserDelete} onUserDeleteError={handleUserDeleteError} onUserUpdate={handleUserUpdate} /></ClientOnly>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
