
import { createClient } from '@/lib/supabase/server';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, Ticket, Mountain, LogOut, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { CouponClientPage } from './coupon-client-page';
import { Button } from '@/components/ui/button';

export default async function CouponsPage() {
  const supabase = createClient();
  const { data: coupons, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching coupons: ", error);
    // You could render an error message here
  }

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
           <Button asChild>
                <Link href="/admin/coupons/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Coupon
                </Link>
           </Button>
        </header>
        <main className="p-4 md:p-8">
            <CouponClientPage coupons={coupons || []} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
