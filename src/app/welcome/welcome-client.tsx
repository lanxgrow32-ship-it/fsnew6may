
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from '@/app/actions';
import Link from 'next/link';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Wallet, 
    Trophy, 
    FileCheck, 
    LogOut, 
    Menu,
    History,
    MessageSquare,
    CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger 
} from '@/components/ui/sheet';

// Sub-views
import { AccountsHub } from './accounts-hub';
import { ArenaView } from './arena-view';
import { WalletView } from './wallet-view';
import { TransactionsView } from './transactions-view';
import { SupportView } from './support-view';
import { CompetitionView } from './competition-view';

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

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // FIX: Ensure page scrolls to top when tab changes or on initial load
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    // Calculate total unread messages for the notification badge
    const totalUnread = supportConversations.reduce((sum, conv) => sum + (conv.unread_count_user || 0), 0);

    const navItems = [
        { id: 'hub', label: "Portfolio", mobileLabel: "Portfolio", icon: LayoutDashboard },
        { id: 'marketplace', label: "Get Funded", mobileLabel: "Get Funded", icon: ShoppingCart },
        { id: 'competition', label: "Competition", mobileLabel: "Competition", icon: Trophy },
        { id: 'wallet', label: "Wallet", mobileLabel: "Wallet", icon: Wallet },
        { id: 'transactions', label: "History", mobileLabel: "History", icon: History },
        { id: 'support', label: "Live Chat", mobileLabel: "Live Chat", icon: MessageSquare, hasBadge: totalUnread > 0 },
        { id: 'kyc', label: "KYC", mobileLabel: "KYC", icon: FileCheck },
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
                {/* Unified Compact Header */}
                <header className="flex items-center justify-between mb-12 z-20 relative">
                    <div className="flex items-center gap-6">
                        <Logo />
                        <nav className="hidden lg:flex items-center gap-0.5 bg-black/40 backdrop-blur-md border border-white/10 p-1 rounded-full shadow-2xl h-[40px]">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={cn(
                                        "px-4 py-1.5 text-[12px] font-bold transition-all rounded-full h-[32px] whitespace-nowrap shrink-0 flex items-center gap-2",
                                        activeTab === item.id
                                        ? "bg-white/10 text-white border border-white/10 shadow-sm"
                                        : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    {item.label}
                                    {item.hasBadge && (
                                        <span className="w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full animate-pulse">
                                            {totalUnread > 9 ? '9+' : totalUnread}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[9px] font-bold text-gray-600 mb-0.5 uppercase tracking-wider">Balance</span>
                            <span className="text-primary font-bold text-base">₹{Number(profile.wallet_balance).toLocaleString('en-IN')}</span>
                        </div>
                        
                        <div className="relative h-9 w-9 rounded-full border border-white/10 overflow-hidden shadow-xl bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-bold text-xs">
                                {profile.full_name?.[0].toUpperCase()}
                            </span>
                        </div>
                        
                        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                            <SheetTrigger asChild>
                                <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-black/40 border border-white/10 lg:hidden transition-colors shadow-lg relative">
                                    <Menu className="h-4 w-4 text-gray-300" />
                                    {totalUnread > 0 && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-950" />
                                    )}
                                </button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-slate-950 border-white/10 text-white w-72 p-0 flex flex-col font-poppins">
                                <SheetHeader className="p-6 border-b border-white/5">
                                    <SheetTitle className="sr-only">Navigation Drawer</SheetTitle>
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="bg-primary h-8 w-8 flex items-center justify-center rounded-lg">
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
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    setActiveTab(item.id);
                                                    setIsSidebarOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full px-5 py-4 text-sm font-bold transition-all flex items-center gap-4 rounded-2xl relative",
                                                    activeTab === item.id
                                                    ? "bg-primary text-white border border-white shadow-xl shadow-primary/20"
                                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "text-gray-500")} />
                                                {item.mobileLabel}
                                                {item.hasBadge && (
                                                    <span className="absolute right-5 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                                                        {totalUnread}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-auto pt-8 pb-8">
                                        <div className="pt-4 border-t border-white/5">
                                            <form action={signOut}>
                                                <button 
                                                    type="submit"
                                                    className="w-full px-5 py-4 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all rounded-2xl flex items-center gap-4 group"
                                                >
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

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsContent value="hub" className="animate-in fade-in duration-300">
                        <AccountsHub accounts={accounts} profile={profile} onSwitchToGetFunded={() => setActiveTab('marketplace')} />
                    </TabsContent>

                    <TabsContent value="marketplace" className="animate-in fade-in duration-300">
                        <ArenaView 
                            profile={profile} 
                            paymentSettings={paymentSettings}
                            onSwitchToWallet={() => setActiveTab('wallet')} 
                        />
                    </TabsContent>

                    <TabsContent value="competition" className="animate-in fade-in duration-300">
                        <CompetitionView 
                            profile={profile} 
                            registrations={competitions} 
                            onSwitchToWallet={() => setActiveTab('wallet')}
                        />
                    </TabsContent>

                    <TabsContent value="wallet" className="animate-in fade-in duration-300">
                        <WalletView profile={profile} paymentSettings={paymentSettings} />
                    </TabsContent>

                    <TabsContent value="transactions" className="animate-in fade-in duration-300">
                        <TransactionsView transactions={walletTransactions} />
                    </TabsContent>

                    <TabsContent value="support" className="animate-in fade-in duration-300">
                        <SupportView profile={profile} conversations={supportConversations} />
                    </TabsContent>

                    <TabsContent value="kyc" className="animate-in fade-in duration-300">
                        {profile.kyc_status === 'verified' ? (
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold text-white tracking-tight">KYC Status</h2>
                                    <p className="text-gray-400 text-sm font-medium">Your identity verification has been confirmed.</p>
                                </div>
                                <GlassCard className="p-8 border-green-500/20 bg-green-500/5">
                                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                                        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                                            <CheckCircle className="h-10 w-10" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Identity Verified</h3>
                                            <p className="text-gray-400 text-sm mt-1">You are fully eligible for Performance Rewards and payouts.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-10 pt-10 border-t border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Full Name</p>
                                            <p className="text-white font-bold">{profile.full_name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">PAN Number</p>
                                            <p className="text-white font-mono font-bold">{profile.pan_number || '••••••••••'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Mobile Number</p>
                                            <p className="text-white font-bold">{profile.mobile_number}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">System Identifier</p>
                                            <p className="text-white font-mono text-xs">{profile.id}</p>
                                        </div>
                                    </div>
                                    {profile.selfie_url && (
                                        <div className="mt-8 pt-8 border-t border-white/5">
                                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4">Verification Document</p>
                                            <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-white/10 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer shadow-lg bg-black/40">
                                                <Image src={profile.selfie_url} alt="KYC Document" layout="fill" className="object-cover" />
                                            </div>
                                        </div>
                                    )}
                                </GlassCard>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
                                <h2 className="text-2xl font-bold text-white tracking-tight">KYC Verification</h2>
                                <p className="text-gray-400 text-sm font-medium">Complete your identity verification to activate your funded status and payouts.</p>
                                <Button asChild size="lg" className="mt-8 rounded-2xl px-12 h-14 font-bold text-lg shadow-xl shadow-primary/20">
                                    <Link href="/kyc">Start KYC</Link>
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
