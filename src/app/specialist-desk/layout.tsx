import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { FundedStockLogo } from '@/components/ui/logo';
import { ShieldCheck, LogOut, LayoutDashboard, Activity, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/app/actions';

export default function SpecialistDeskLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar className="border-r border-white/5">
        <SidebarHeader className="border-b border-white/5 p-4 h-[57px] flex items-center bg-green-500/5">
            <Link href="/specialist-desk" className="flex items-center gap-2 font-bold text-lg">
                <ShieldCheck className="w-8 h-8 text-green-400" />
                <span className="text-white">Specialist Protocol</span>
            </Link>
        </SidebarHeader>
        <SidebarContent className="bg-slate-950">
          <SidebarMenu className="p-2 gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton href="/specialist-desk" tooltip="Command Dashboard">
                <LayoutDashboard className="text-green-400" /> Command Center
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/specialist-desk/chat" tooltip="Protocol Stream">
                <Activity className="text-green-400" /> Protocol Stream
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-white/5 p-2 bg-slate-950">
            <SidebarMenu>
                <SidebarMenuItem>
                    <form action={signOut} className="w-full">
                        <SidebarMenuButton asChild tooltip="Logout">
                            <button type="submit" className="w-full text-red-400 hover:text-red-300">
                                <LogOut /> Terminate Session
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
                <h1 className="text-xs font-black text-green-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Specialist Mitigation Grid
                </h1>
           </div>
           <ThemeToggle />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
