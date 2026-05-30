import { createClient } from '@/lib/supabase/server';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { Home, Ticket, Wallet, LogOut, Banknote, MessageSquare, LineChart, Swords, Users, Newspaper, UserCheck, Plus, History } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventManager } from './event-manager';
import { RegistrationManager } from './registration-manager';
import { ResultsManager } from './results-manager';

export default async function AdminCompetitionPage() {
  const supabase = createClient();
  
  const { data: events } = await supabase
    .from('competition_events')
    .select('*')
    .order('start_date', { ascending: false });

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b p-4 h-[57px] flex items-center">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <FundedStockLogo className="w-8 h-8 text-primary" />
            <span>FundedStock 2.0</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem><SidebarMenuButton href="/admin/dashboard"><Home />Dashboard</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/account-requests"><UserCheck />Account Requests</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/competition" isActive><Swords />Competition</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/pay-later"><Users />Pay Later Users</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/coupons"><Ticket />Coupons</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/blog"><Newspaper />Blog</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/payouts"><Banknote />Payouts</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/tickets"><MessageSquare />Support</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/reports"><LineChart />Reports</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/payment-settings"><Wallet />Payment Settings</SidebarMenuButton></SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t p-2">
          <SidebarMenu><SidebarMenuItem><form action={signOut} className="w-full"><SidebarMenuButton asChild><button type="submit" className="w-full"><LogOut />Logout</button></SidebarMenuButton></form></SidebarMenuItem></SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4"><SidebarTrigger className="md:hidden" /><h1 className="text-xl font-semibold">Competition Tournament Manager</h1></div>
          <ThemeToggle />
        </header>
        <main className="p-4 md:p-8 bg-muted/40 space-y-8">
            <Tabs defaultValue="registrations">
                <TabsList className="mb-4">
                    <TabsTrigger value="registrations">Registrations</TabsTrigger>
                    <TabsTrigger value="events">Tournament Events</TabsTrigger>
                    <TabsTrigger value="results" className="gap-2"><History className="w-4 h-4"/> Results & Archive</TabsTrigger>
                </TabsList>
                
                <TabsContent value="events">
                    <EventManager initialEvents={events || []} />
                </TabsContent>
                
                <TabsContent value="registrations">
                    <RegistrationManager events={events || []} />
                </TabsContent>

                <TabsContent value="results">
                    <ResultsManager events={events || []} />
                </TabsContent>
            </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}