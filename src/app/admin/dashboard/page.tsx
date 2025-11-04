
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, Ticket, User, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserTable } from './user-table';
import { ClientOnly } from '@/components/ui/client-only';
import { Skeleton } from '@/components/ui/skeleton';
import { FundedStockLogo } from '@/components/ui/logo';

function AdminNav() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage src={`https://avatar.vercel.sh/admin.png`} alt="Admin" />
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
                <DropdownMenuItem>
                     <LogOut className="mr-2 h-4 w-4" />
                     <span>Log out</span>
                </DropdownMenuItem>
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
              <div className="relative w-full max-w-sm">
                <Skeleton className="h-10 w-full" />
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


export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: profiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

  const stats = [
    { title: "Total Users", value: profiles?.length || 0, icon: User },
    { title: "Pending Approval", value: profiles?.filter(p => !p.is_approved).length || 0, icon: User },
    { title: "KYC Submitted", value: profiles?.filter(p => p.kyc_status === 'submitted').length || 0, icon: User },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b p-2">
           <div className="h-12 flex items-center justify-center">
                <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg">
                    <FundedStockLogo className="w-8 h-8 text-primary" />
                    <span className="text-foreground group-[[data-state=collapsed]]:hidden">FundedStock 2.0</span>
                </Link>
           </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="/admin/dashboard" isActive tooltip="Dashboard">
                <Home />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/admin/coupons" tooltip="Coupons">
                <Ticket />
                Coupons
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t p-2">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Logout">
                        <LogOut />
                        Logout
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
           <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <h1 className="text-xl font-semibold">User Management</h1>
           </div>
           <ClientOnly fallback={<Skeleton className="h-10 w-10 rounded-full" />}>
            <AdminNav />
           </ClientOnly>
        </header>
        <main className="p-4 md:p-8 bg-muted/40">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {stats.map(stat => (
                    <Card key={stat.title} className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <ClientOnly fallback={<UserTableSkeleton />}>
                <UserTable profiles={profiles || []} />
            </ClientOnly>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
