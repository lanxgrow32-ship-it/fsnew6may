'use client';

import { useState } from 'react';
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
    LifeBuoy
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
import { CompetitionView } from './competition-view';
import { SupportView } from './support-view';

const Logo = () => (
    <div className="flex items-center gap-2">
        <div className="bg-primary h-8 w-8 flex items-center justify-center rounded-lg shadow-lg shadow-primary/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
        <span className="font-poppins font-black text-lg tracking-tighter text-white hidden lg:block">FundedStock</span>
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

    // Shorter labels for a more compact dashboard
    const navItems = [
        { id: 'hub', label: "Portfolio", mobileLabel: "Account Hub", icon: LayoutDashboard },
        { id: 'get-funded', label: "Arena", mobileLabel: "Get Funded", icon: ShoppingCart },
        { id: 'wallet', label: "Wallet", mobileLabel: "Wallet", icon: Wallet },
        { id: 'transactions', label: "History", mobileLabel: "Transactions", icon: History },
        { id: 'competition', label: "Battles", mobileLabel: "Tournaments", icon: Trophy },
        { id: 'support', label: "Help", mobileLabel: "Support", icon: LifeBuoy },
        { id: 'kyc', label: "Verify", mobileLabel: "KYC", icon: FileCheck },
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
                        <nav className="hidden md:flex items-center gap-0.5 bg-black/40 backdrop-blur-md border border-white/10 p-1 rounded-full shadow-2xl h-[44px]">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={cn(
                                        "px-4 py-1.5 text-[13px] font-bold transition-all rounded-full h-[36px] whitespace-nowrap shrink-0",
                                        activeTab === item.id
                                        ? "bg-white/10 text-white border border-white/10 shadow-sm"
                                        : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                            <form action={signOut} className="inline-block border-l border-white/10 ml-1.5 pl-1.5">
                                <button type="submit" className="px-3 py-1.5 text-[13px] font-bold text-red-400 hover:text-red-300 transition-colors">
                                    Logout
                                </button>
                            </form>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Wallet</span>
                            <span className="text-primary font-black text-xl tracking-tighter">₹{Number(profile.wallet_balance).toLocaleString('en-IN')}</span>
                        </div>
                        
                        <div className="relative h-10 w-10 rounded-full border border-white/10 overflow-hidden shadow-xl">
                            <Avatar className="h-full w-full">
                                <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                                    {profile.full_name?.[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        
                        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                            <SheetTrigger asChild>
                                <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/40 border border-white/10 md:hidden transition-colors shadow-lg">
                                    <Menu className="h-5 w-5 text-gray-300" />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-slate-950 border-white/10 text-white w-72 p-0 flex flex-col font-poppins">
                                <SheetHeader className="p-6 border-b border-white/5">
                                    <SheetTitle className="sr-only">Navigation Protocol</SheetTitle>
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="bg-primary h-8 w-8 flex items-center justify-center rounded-lg">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <span className="text-white font-black text-lg tracking-tight">FundedStock</span>
                                    </div>
                                </SheetHeader>
                                <div className="flex flex-col flex-1 p-5 gap-2 overflow-y-auto">
                                    <div className="px-6 py-8 mb-6 bg-black/60 rounded-3xl border border-white/5 text-center shadow-2xl">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-2">BALANCE</p>
                                        <p className="text-primary font-black text-4xl tracking-tighter">₹{Number(profile.wallet_balance).toLocaleString('en-IN')}</p>
                                    </div>

                                    <div className="space-y-2">
                                        {navItems.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    setActiveTab(item.id);
                                                    setIsSidebarOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full px-5 py-4 text-sm font-bold transition-all flex items-center gap-4 rounded-2xl",
                                                    activeTab === item.id
                                                    ? "bg-primary text-white border border-white shadow-xl shadow-primary/20"
                                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "text-gray-500")} />
                                                {item.mobileLabel}
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

                {/* Main Content Areas */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsContent value="hub" className="animate-in fade-in duration-300">
                        <AccountsHub accounts={accounts} profile={profile} onSwitchToGetFunded={() => setActiveTab('get-funded')} />
                    </TabsContent>

                    <TabsContent value="get-funded" className="animate-in fade-in duration-300">
                        <ArenaView profile={profile} onSwitchToWallet={() => setActiveTab('wallet')} />
                    </TabsContent>

                    <TabsContent value="wallet" className="animate-in fade-in duration-300">
                        <WalletView profile={profile} paymentSettings={paymentSettings} />
                    </TabsContent>

                    <TabsContent value="transactions" className="animate-in fade-in duration-300">
                        <TransactionsView transactions={walletTransactions} />
                    </TabsContent>

                    <TabsContent value="competition" className="animate-in fade-in duration-300">
                        <CompetitionView registrations={competitions} profile={profile} onSwitchToWallet={() => setActiveTab('wallet')} />
                    </TabsContent>

                    <TabsContent value="support" className="animate-in fade-in duration-300">
                        <SupportView profile={profile} conversations={supportConversations} />
                    </TabsContent>

                    <TabsContent value="kyc" className="animate-in fade-in duration-300">
                        <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
                            <h2 className="text-3xl font-black text-white tracking-tight">KYC Verification</h2>
                            <p className="text-gray-400 text-lg font-medium">Complete your identity verification protocol.</p>
                            <Button asChild size="lg" className="mt-8 rounded-2xl px-12 h-14 font-black text-lg shadow-xl shadow-primary/20">
                                <Link href="/kyc">Start Verification Process</Link>
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
