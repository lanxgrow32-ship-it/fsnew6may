import { createClient } from '@/lib/supabase/server';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, Ticket, Mountain, LogOut } from 'lucide-react';
import { CouponClientPage } from './coupon-client-page';
import Link from 'next/link';

export default async function CouponsPage() {
  const supabase = createClient();
  const { data: coupons } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b">
           <div className="h-14 flex items-center px-4">
                <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg">
                    <Mountain className="w-6 h-6 text-primary" />
                    <span className="text-foreground">PropStar</span>
                </Link>
           </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="/admin/dashboard">
                <Home />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton href="/admin/coupons" isActive>
                <Ticket />
                Coupons
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton>
                        <LogOut />
                        Logout
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
         <header className="flex h-14 items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
           <div className="flex items-center gap-4">
             <SidebarTrigger className="md:hidden" />
             <h1 className="text-xl font-semibold">Coupon Management</h1>
           </div>
        </header>
        <CouponClientPage coupons={coupons || []} />
      </SidebarInset>
    </SidebarProvider>
  );
}
