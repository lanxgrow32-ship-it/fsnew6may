'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    LayoutDashboard, 
    LogOut, 
    Menu,
    MessageSquare,
    User,
    Users,
    ShoppingCart,
    Trophy,
    History,
    FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from '@/app/actions';
import { cn } from '@/lib/utils';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger 
} from '@/components/ui/sheet';
import { SupportView } from '../welcome/support-view';
import { createClient } from '@/lib/supabase/client';
import { markSupportRead } from '../welcome/actions';

const Logo = () => (
    <div className="flex items-center gap-2">
        <div className="bg-primary h-7 w-7 flex items-center justify-center rounded-lg shadow-lg shadow-primary/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
        <span className="font-poppins font-bold text-base tracking-tight text-white hidden lg:block">FundedStock</span>
    </div>
);

const navItems = [
    { id: 'hub', href: "/welcome", label: "Portfolio", icon: LayoutDashboard },
    { id: 'marketplace', href: "/welcome?tab=marketplace", label: "Get Funded", icon: ShoppingCart },
    { id: 'competition', href: "/welcome?tab=competition", label: "Competition", icon: Trophy },
    { id: 'wallet', href: "/welcome?tab=wallet", label: "Wallet", icon: WalletIcon },
    { id: 'referrals', href: "/referrals", label: "Referrals", icon: Users },
    { id: 'transactions', href: "/welcome?tab=transactions", label: "History", icon: History },
    { id: 'support', href: "/live-chat", label: "Live Chat", icon: MessageSquare, active: true },
    { id: 'kyc', href: "/welcome?tab=kyc", label: "KYC", icon: FileCheck },
];

function WalletIcon({ className }: { className?: string }) {
    return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 7V11M1 7V17C1 18.1046 1.89543 19 3 19H19C20.1046 19 21 18.1046 21 17V16.25C21 15.1454 21.8954 14.25 23 14.25V9.75C21.8954 9.75 21 8.85457 21 7.75V7C21 5.89543 20.1046 5 19 5H3C1.89543 5 1 5.89543 1 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function LiveChatClient({ profile, initialConversations }: { profile: any, initialConversations: any[] }) {
    const [conversations, setConversations] = useState(initialConversations);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    // Auto-clear unread on load
    useEffect(() => {
        const liveChat = conversations.find(c => c.subject === 'LIVE_CHAT' && c.unread_count_user > 0);
        if (liveChat) {
            markSupportRead(liveChat.id, 'user');
        }
    }, [conversations]);

    useEffect(() => {
        const channel = supabase
            .channel('chat-page-realtime')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'support_conversations', 
                filter: `user_id=eq.${profile.id}` 
            }, async () => {
                const { data } = await supabase
                    .from('support_conversations')
                    .select('*')
                    .eq('user_id', profile.id)
                    .order('last_message_at', { ascending: false });
                if (data) setConversations(data);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [profile.id, supabase]);

    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            
            <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="flex items-center justify-between mb-12 z-20 relative border-b border-white/5 pb-6">
                    <div className="flex items-center gap-6">
                        <Logo />
                        <nav className="hidden lg:flex items-center gap-0.5 bg-black/40 backdrop-blur-md border border-white/10 p-1 rounded-full shadow-2xl h-[40px]">
                            {navItems.filter(item => item.id !== 'kyc').map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={cn(
                                        "px-4 py-1.5 text-[11px] font-bold transition-all rounded-full h-[32px] whitespace-nowrap shrink-0 flex items-center gap-2",
                                        item.active
                                        ? "bg-white/10 text-white border border-white/10 shadow-sm"
                                        : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    <item.icon className="w-3.5 h-3.5" />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Link href="/profile" className="relative group">
                                <div className="h-9 w-9 rounded-full border border-white/10 overflow-hidden shadow-xl bg-primary/20 flex items-center justify-center group-hover:border-primary transition-all">
                                    <span className="text-primary font-bold text-xs">
                                        {profile.full_name?.[0].toUpperCase()}
                                    </span>
                                </div>
                            </Link>
                            <form action={signOut} className="hidden lg:block">
                                <Button variant="ghost" type="submit" size="sm" className="text-gray-500 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest gap-2 h-9">
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout
                                </Button>
                            </form>
                        </div>
                        
                        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                            <SheetTrigger asChild>
                                <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-black/40 border border-white/10 lg:hidden transition-colors shadow-lg relative">
                                    <Menu className="h-4 w-4 text-gray-300" />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-slate-950 border-white/10 text-white w-72 p-0 flex flex-col font-poppins">
                                <SheetHeader className="p-6 border-b border-white/5">
                                    <SheetTitle className="sr-only">Navigation Drawer</SheetTitle>
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="bg-primary h-8 w-8 flex items-center justify-center rounded-lg shadow-lg">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <span className="text-white font-bold text-lg tracking-tight">FundedStock</span>
                                    </div>
                                </SheetHeader>
                                <div className="flex flex-col flex-1 p-5 gap-2 overflow-y-auto">
                                    <div className="space-y-2">
                                        {navItems.map((item) => (
                                            <Link 
                                                key={item.id} 
                                                href={item.href} 
                                                className={cn(
                                                    "w-full px-5 py-4 text-sm font-bold transition-all flex items-center gap-4 rounded-2xl relative",
                                                    item.active
                                                    ? "bg-primary text-white border border-white shadow-xl shadow-primary/20"
                                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                                )}
                                                onClick={() => setIsSidebarOpen(false)}
                                            >
                                                <item.icon className={cn("w-5 h-5", item.active ? "text-white" : "text-gray-500")} />
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                    <div className="mt-auto pt-8 pb-8">
                                        <div className="pt-4 border-t border-white/5">
                                            <form action={signOut}>
                                                <button type="submit" className="w-full px-5 py-4 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all rounded-2xl flex items-center gap-4 group">
                                                    <LogOut className="w-5 h-5" />
                                                    Logout Session
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </header>

                <div className="animate-in fade-in duration-500">
                    <SupportView profile={profile} conversations={conversations} />
                </div>
            </main>
        </div>
    );
}
