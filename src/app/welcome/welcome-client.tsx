
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
    Search, 
    Settings, 
    Bell, 
    Menu,
    PlusCircle,
    ArrowRight,
    ShieldAlert,
    Clock,
    CheckCircle,
    Grid3x3,
    IndianRupee
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Sub-views
import { AccountsHub } from './accounts-hub';
import { ArenaView } from './arena-view';
import { WalletView } from './wallet-view';
import { CompetitionView } from './competition-view';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

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

export function WelcomeClient({ profile, accounts, walletTransactions, paymentSettings }: { profile: any, accounts: any[], walletTransactions: any[], paymentSettings: any }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('hub');

    const navItems = [
        { id: 'hub', label: "Account Hub", icon: LayoutDashboard },
        { id: 'arena', label: "Arena", icon: ShoppingCart },
        { id: 'wallet', label: "Wallet", icon: Wallet },
        { id: 'competition', label: "Tournaments", icon: Trophy },
    ];

    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden pb-20">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-25%] left-[10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full filter blur-3xl opacity-20 " />
                <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-pink-600 rounded-full filter blur-3xl opacity-10" />
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
                                        "px-4 py-1.5 text-sm transition-colors flex items-center gap-2",
                                        activeTab === item.id
                                        ? "font-medium bg-white/10 rounded-full text-white shadow-md"
                                        : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    <item.icon className="w-3.5 h-3.5" />
                                    {item.label}
                                </button>
                            ))}
                            <Link href="/guide" className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Guide</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Balance</span>
                            <span className="text-primary font-bold text-lg">₹{Number(profile.wallet_balance).toLocaleString('en-IN')}</span>
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
                        <div className="max-w-4xl mx-auto">
                            <CompetitionView registrations={[]} /> {/* This would ideally fetch actual competition data */}
                        </div>
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
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={`https://avatar.vercel.sh/${profile.email}.png`} alt={profile.full_name || 'User'} />
                        <AvatarFallback>{profile.full_name?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild><Link href="/profile"><User className="mr-2 h-4 w-4" /><span>My Profile</span></Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/kyc"><FileCheck className="mr-2 h-4 w-4" /><span>KYC Status</span></Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/tickets"><MessageSquare className="mr-2 h-4 w-4" /><span>Support</span></Link></DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                 <form action={signOut}>
                    <DropdownMenuItem asChild><button type="submit" className="w-full"><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></button></DropdownMenuItem>
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
