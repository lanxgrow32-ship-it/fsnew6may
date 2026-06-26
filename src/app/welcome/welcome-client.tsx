'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut } from '@/app/actions';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Wallet, 
    Trophy, 
    User, 
    FileCheck, 
    MessageSquare, 
    LogOut, 
    Menu,
    PlusCircle,
    ArrowRight,
    ShieldAlert,
    Clock,
    CheckCircle,
    Grid3x3,
    IndianRupee,
    Search,
    Settings,
    Bell,
    LifeBuoy
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Sub-views
import { AccountsHub } from './accounts-hub';
import { ArenaView } from './arena-view';
import { WalletView } from './wallet-view';
import { CompetitionView } from './competition-view';
import { SupportView } from './support-view';

const Logo = () => (
    <div className="bg-slate-900 h-10 w-10 flex items-center justify-center rounded-lg text-2xl font-bold border border-white/10 shadow-inner shadow-black/50">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 7L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 7L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    </div>
);

export function WelcomeClient({ 
    profile, 
    accounts, 
    walletTransactions, 
    paymentSettings,
    competitions,
    supportConversations
}: { 
    profile: any, 
    accounts: any[], 
    walletTransactions: any[], 
    paymentSettings: any,
    competitions: any[],
    supportConversations: any[]
}) {
    const [activeTab, setActiveTab] = useState('hub');

    const navItems = [
        { id: 'hub', label: "Account Hub", icon: LayoutDashboard },
        { id: 'arena', label: "Arena", icon: ShoppingCart },
        { id: 'wallet', label: "Wallet", icon: Wallet },
        { id: 'competition', label: "Tournaments", icon: Trophy },
        { id: 'support', label: "Support", icon: LifeBuoy },
    ];

    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden pb-20">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-25%] left-[10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full filter blur-3xl opacity-20 " />
                <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-purple-600 rounded-full filter blur-3xl opacity-10" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <header className="flex items-center justify-between mb-12 z-20 relative">
                    <div className="flex items-center gap-8">
                        <Logo />
                        <nav className="hidden md:flex items-center gap-1 bg-black/20 backdrop-blur-sm border border-white/10 p-1 rounded-full shadow-lg">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={cn(
                                        "px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2",
                                        activeTab === item.id
                                        ? "bg-primary rounded-full text-white shadow-md"
                                        : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    <item.icon className="w-3.5 h-3.5" />
                                    {item.label}
                                </button>
                            ))}
                            <Link href="/guide" className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Guide</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Balance</span>
                            <span className="text-primary font-black text-lg">₹{Number(profile.wallet_balance).toLocaleString('en-IN')}</span>
                        </div>
                        <UserNav profile={profile} />
                        <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 md:hidden transition-colors"><Menu className="h-5 w-5 text-gray-300" /></button>
                    </div>
                </header>

                {/* Main Content Areas */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsContent value="hub" className="animate-in fade-in slide-in-from-bottom-2">
                        <AccountsHub accounts={accounts} profile={profile} onSwitchToArena={() => setActiveTab('arena')} />
                    </TabsContent>

                    <TabsContent value="arena" className="animate-in fade-in slide-in-from-bottom-2">
                        <ArenaView profile={profile} onSwitchToWallet={() => setActiveTab('wallet')} />
                    </TabsContent>

                    <TabsContent value="wallet" className="animate-in fade-in slide-in-from-bottom-2">
                        <WalletView profile={profile} transactions={walletTransactions} paymentSettings={paymentSettings} />
                    </TabsContent>

                    <TabsContent value="competition" className="animate-in fade-in slide-in-from-bottom-2">
                        <CompetitionView registrations={competitions} profile={profile} onSwitchToWallet={() => setActiveTab('wallet')} />
                    </TabsContent>

                    <TabsContent value="support" className="animate-in fade-in slide-in-from-bottom-2">
                        <SupportView profile={profile} conversations={supportConversations} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

function UserNav({ profile }: { profile: any}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative h-10 w-10 rounded-full border border-white/10 overflow-hidden hover:opacity-80 transition-opacity">
                    <Avatar className="h-full w-full">
                        <AvatarImage src={`https://avatar.vercel.sh/${profile.email}.png`} alt={profile.full_name || 'User'} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">{profile.full_name?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-white/10 text-white" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold leading-none">{profile.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer"><Link href="/profile" className="flex items-center"><User className="mr-2 h-4 w-4" /><span>My Profile</span></Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer"><Link href="/kyc" className="flex items-center"><FileCheck className="mr-2 h-4 w-4" /><span>KYC Status</span></Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer"><Link href="/tickets" className="flex items-center"><MessageSquare className="mr-2 h-4 w-4" /><span>My Tickets</span></Link></DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-white/5" />
                 <form action={signOut}>
                    <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer focus:bg-destructive focus:text-destructive-foreground">
                        <button type="submit" className="w-full flex items-center">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </button>
                    </DropdownMenuItem>
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}