import { createClient } from '@/lib/supabase/server';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { Home, Ticket, Wallet, LogOut, Banknote, MessageSquare, LineChart, Swords, Users, Newspaper, UserCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { CompetitionUserList } from './user-list';

export default async function AdminCompetitionPage() {
  const supabase = createClient();
  const { data: profiles, error } = await supabase.from('profiles')
    .select('*')
    .eq('account_type', 'competition')
    .order('created_at', { ascending: false });


  if (error) {
    console.error("Error fetching competition profiles:", error);
  }

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
            <SidebarMenuItem><SidebarMenuButton href="/admin/competition" isActive tooltip="Competition"><Swords />Competition</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/pay-later" tooltip="Pay Later Users"><Users />Pay Later Users</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/coupons" tooltip="Coupons"><Ticket />Coupons</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/blog" tooltip="Blog"><Newspaper />Blog</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/payouts" tooltip="Payouts"><Banknote />Payouts</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/tickets" tooltip="Support"><MessageSquare />Support</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/reports" tooltip="Reports"><LineChart />Reports</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton href="/admin/payment-settings" tooltip="Payment Settings"><Wallet />Payment Settings</SidebarMenuButton></SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <form action={signOut} className="w-full">
                <SidebarMenuButton tooltip="Logout" asChild>
                  <button type="submit" className="w-full">
                    <LogOut />
                    Logout
                  </button>
                </SidebarMenuButton>
              </form>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-xl font-semibold">Competition Management</h1>
          </div>
          <ThemeToggle />
        </header>
        <main className="p-4 md:p-8 bg-muted/40">
           <CompetitionUserList initialProfiles={profiles || []} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
