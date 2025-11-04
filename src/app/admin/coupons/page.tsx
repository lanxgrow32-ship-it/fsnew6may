
import { createClient } from '@/lib/supabase/server';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, Ticket } from 'lucide-react';
import { CouponClientPage } from './coupon-client-page';

export default async function CouponsPage() {
  const supabase = createClient();
  const { data: coupons } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
           <h2 className="text-xl font-bold">PropStar Admin</h2>
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
        <SidebarFooter />
      </Sidebar>
      <SidebarInset>
         <header className="flex items-center justify-between p-4 border-b">
           <div>
            <h1 className="text-2xl font-bold">Coupon Management</h1>
            <p className="text-muted-foreground">Create and manage promotional coupons.</p>
          </div>
          <SidebarTrigger className="md:hidden" />
        </header>
        <CouponClientPage coupons={coupons || []} />
      </SidebarInset>
    </SidebarProvider>
  );
}
