import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { FundedStockLogo } from '@/components/ui/logo';
import { MessageSquare, LifeBuoy, LogOut, LayoutDashboard, User } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/app/actions';

export default function SupportAgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar className="border-r border-white/5">
        <SidebarHeader className="border-b border-white/5 p-4 h-[57px] flex items-center">
            <Link href="/support-agent" className="flex items-center gap-2 font-bold text-lg">
                <FundedStockLogo className="w-8 h-8 text-primary" />
                <span className="text-white">Support Desk</span>
            </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="p-2 gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton href="/support-agent" tooltip="Dashboard">
                <LayoutDashboard /> Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/support-agent/chat" tooltip="Live Chat">
                <MessageSquare /> Live Chat
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/support-agent/tickets" tooltip="Tickets">
                <LifeBuoy /> Support Tickets
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-white/5 p-2">
            <SidebarMenu>
                <SidebarMenuItem>
                    <form action={signOut} className="w-full">
                        <SidebarMenuButton asChild tooltip="Logout">
                            <button type="submit" className="w-full text-red-400 hover:text-red-300">
                                <LogOut /> Logout
                            </button>
                        </SidebarMenuButton>
                    </form>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-slate-950">
        <header className="flex h-[57px] items-center justify-between p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
           <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <h1 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Support Dashboard</h1>
           </div>
           <ThemeToggle />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
