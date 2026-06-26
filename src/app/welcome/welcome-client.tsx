'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    LifeBuoy,
    Plus
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
import { CompetitionView } from './competition-view';
import { SupportView } from './support-view';
import KycPage from '@/app/kyc/page';

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navItems = [
        { id: 'hub', label: "Account Hub", icon: LayoutDashboard },
        { id: 'get-funded', label: "Get Funded", icon: ShoppingCart },
        { id: 'wallet', label: "Wallet", icon: Wallet },
        { id: 'competition', label: "Tournaments", icon: Trophy },
        { id: 'support', label: "Support", icon: LifeBuoy },
        { id: 'kyc', label: "KYC Verification", icon: FileCheck },
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
                            <form action={signOut} className="inline-block border-l border-white/10 ml-2 pl-1">
                                <button type="submit" className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors flex items-center gap-2">
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout
                                </button>
                            </form>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Wallet Balance</span>
                            <div className="flex items-center gap-2">
                                <span className="text-primary font-black text-lg">₹{Number(profile.wallet_balance).toLocaleString('en-IN')}</span>
                                <button 
                                    onClick={() => setActiveTab('wallet')}
                                    className="p-1 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                                    title="Add Funds"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Profile Icon */}
                        <div className="relative h-10 w-10 rounded-full border border-white/10 overflow-hidden">
                            <Avatar className="h-full w-full">
                                <AvatarImage src={`https://avatar.vercel.sh/${profile.email}.png`} alt={profile.full_name || 'User'} />
                                <AvatarFallback className="bg-primary/20 text-primary font-bold">{profile.full_name?.[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                        
                        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                            <SheetTrigger asChild>
                                <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 md:hidden transition-colors">
                                    <Menu className="h-5 w-5 text-gray-300" />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-slate-950 border-white/10 text-white w-72 p-0 flex flex-col">
                                <SheetHeader className="p-6 border-b border-white/5">
                                    <SheetTitle className="flex items-center gap-3 text-left">
                                        <Logo />
                                        <span className="text-white font-bold">FundedStock</span>
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col flex-1 p-4 gap-2 overflow-y-auto">
                                    <div className="px-4 py-6 mb-6 sm:hidden bg-black/40 rounded-2xl border border-white/10">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Wallet Balance</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-primary font-black text-3xl">₹{Number(profile.wallet_balance).toLocaleString('en-IN')}</p>
                                            <button 
                                                onClick={() => {
                                                    setActiveTab('wallet');
                                                    setIsSidebarOpen(false);
                                                }}
                                                className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {navItems.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    setActiveTab(item.id);
                                                    setIsSidebarOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full px-4 py-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-3 rounded-xl",
                                                    activeTab === item.id
                                                    ? "bg-primary text-white shadow-lg shadow-primary/10"
                                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <item.icon className="w-4 h-4" />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-auto pt-8 pb-4">
                                        <div className="pt-4 border-t border-white/5">
                                            <form action={signOut}>
                                                <button 
                                                    type="submit"
                                                    className="w-full px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all rounded-xl flex items-center gap-3 group"
                                                >
                                                    <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                                    Logout
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
                    <TabsContent value="hub" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AccountsHub accounts={accounts} profile={profile} onSwitchToGetFunded={() => setActiveTab('get-funded')} />
                    </TabsContent>

                    <TabsContent value="get-funded" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <ArenaView profile={profile} onSwitchToWallet={() => setActiveTab('wallet')} />
                    </TabsContent>

                    <TabsContent value="wallet" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <WalletView profile={profile} transactions={walletTransactions} paymentSettings={paymentSettings} />
                    </TabsContent>

                    <TabsContent value="competition" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <CompetitionView registrations={competitions} profile={profile} onSwitchToWallet={() => setActiveTab('wallet')} />
                    </TabsContent>

                    <TabsContent value="support" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <SupportView profile={profile} conversations={supportConversations} />
                    </TabsContent>

                    <TabsContent value="kyc" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <KycPage />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
