'use client';

import { useState, useEffect, Suspense, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
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
    User,
    ShieldCheck,
    CheckCircle,
    Users,
    BookOpen,
    UserPlus,
    Loader2,
    ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger 
} from '@/components/ui/sheet';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfileDetails, cleanupGracePeriods } from './actions';
import { useToast } from '@/hooks/use-toast';

// Sub-views
import { AccountsHub } from './accounts-hub';
import { ArenaView } from './arena-view';
import { WalletView } from './wallet-view';
import { TransactionsView } from './transactions-view';
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

function WelcomeContent({ 
    profile, 
    accounts, 
    walletTransactions, 
    paymentSettings,
    competitions,
    supportConversations: initialSupportConversations
}: { 
    profile: any, 
    accounts: any[], 
    walletTransactions: any[], 
    paymentSettings: any,
    competitions: any[],
    supportConversations: any[]
}) {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState('hub');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [supportConversations, setSupportConversations] = useState(initialSupportConversations);
    const supabase = createClient();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [onboardingName, setOnboardingName] = useState(profile.full_name || '');
    const [onboardingMobile, setOnboardingMobile] = useState(profile.mobile_number || '');

    useEffect(() => {
        if (!profile.full_name || !profile.mobile_number) {
            setIsDetailModalOpen(true);
        }
    }, [profile]);

    // PASSIVE SWEEP PROTOCOL (v7.0)
    useEffect(() => {
        cleanupGracePeriods();
    }, []);

    const handleOnboardingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!onboardingName.trim() || !onboardingMobile.trim()) return;
        startTransition(async () => {
            const res = await updateProfileDetails(profile.id, onboardingName, onboardingMobile);
            if (res.error) toast({ title: "Update Failed", description: res.error, variant: "destructive" });
            else {
                toast({ title: "Profile Ready", description: "Your details have been registered." });
                setIsDetailModalOpen(false);
            }
        });
    }

    useEffect(() => {
        const validTabs = ['hub', 'marketplace', 'competition', 'wallet', 'transactions', 'kyc'];
        if (tabParam && validTabs.includes(tabParam)) setActiveTab(tabParam);
    }, [tabParam]);

    useEffect(() => {
        const channel = supabase
            .channel('user-support-global')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations', filter: `user_id=eq.${profile.id}` }, async () => {
                const { data } = await supabase.from('support_conversations').select('*').eq('user_id', profile.id).order('last_message_at', { ascending: false });
                if (data) setSupportConversations(data);
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [profile.id, supabase]);

    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [activeTab]);

    const totalUnread = supportConversations.reduce((sum, conv) => sum + (conv.unread_count_user || 0), 0);

    const navItems = [
        { id: 'hub', label: "Portfolio", icon: LayoutDashboard },
        { id: 'marketplace', label: "Get Funded", icon: ShoppingCart },
        { id: 'competition', label: "Competition", icon: Trophy },
        { id: 'wallet', label: "Wallet", icon: Wallet },
        { id: 'referrals', label: "Referrals", icon: Users, href: '/referrals' },
        { id: 'transactions', label: "History", icon: History },
        { id: 'support', label: "Live Chat", icon: MessageSquare, href: '/live-chat', hasBadge: totalUnread > 0 },
        { id: 'kyc', label: "KYC", icon: FileCheck },
    ];

    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden pb-20">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="flex items-center justify-between mb-12 z-20 relative border-b border-white/5 pb-6">
                    <div className="flex items-center gap-6"><Logo /><nav className="hidden lg:flex items-center gap-0.5 bg-black/40 backdrop-blur-md border border-white/10 p-1 rounded-full shadow-2xl h-[40px]">{navItems.filter(item => item.id !== 'kyc').map((item) => { const commonClasses = cn("px-4 py-1.5 text-[11px] font-bold transition-all rounded-full h-[32px] whitespace-nowrap shrink-0 flex items-center gap-2", activeTab === item.id ? "bg-white/10 text-white border border-white/10 shadow-sm" : "text-gray-400 hover:text-white"); if (item.href) { return ( <Link key={item.id} href={item.href} className={cn(commonClasses, "relative")}> <item.icon className="w-3.5 h-3.5" /> {item.label} {item.hasBadge && ( <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" /> )} </Link> ); } return ( <button key={item.id} onClick={() => setActiveTab(item.id)} className={commonClasses} > <item.icon className="w-3.5 h-3.5" /> {item.label} </button> ); })}</nav></div>
                    <div className="flex items-center gap-4"><div className="flex flex-col items-end mr-2 sm:mr-4"><span className="text-[8px] sm:text-[9px] font-bold text-gray-600 mb-0.5 uppercase tracking-widest leading-none">Balance</span><span className="text-primary font-bold text-sm sm:text-base leading-none">₹{Number(profile.wallet_balance).toLocaleString('en-IN')}</span></div><div className="flex items-center gap-3"><Link href="/profile" className="relative group"><div className="h-9 w-9 rounded-full border border-white/10 overflow-hidden shadow-xl bg-primary/20 flex items-center justify-center group-hover:border-primary transition-all"><span className="text-primary font-bold text-xs">{profile.full_name?.[0]?.toUpperCase() || 'U'}</span></div></Link><form action={signOut} className="hidden lg:block"><Button variant="ghost" type="submit" size="sm" className="text-gray-500 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest gap-2 h-9"><LogOut className="w-3.5 h-3.5" />Logout</Button></form></div>
                        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}><SheetTrigger asChild><button className="h-9 w-9 flex items-center justify-center rounded-xl bg-black/40 border border-white/10 lg:hidden transition-colors shadow-lg relative"><Menu className="h-4 w-4 text-gray-300" />{totalUnread > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-950" />}</button></SheetTrigger><SheetContent side="left" className="bg-slate-950 border-white/10 text-white w-72 p-0 flex flex-col font-poppins"><SheetHeader className="p-6 border-b border-white/5"><SheetTitle className="sr-only">Navigation</SheetTitle><div className="flex items-center gap-3 text-left"><div className="bg-primary h-8 w-8 flex items-center justify-center rounded-lg shadow-lg"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div><span className="text-white font-bold text-lg tracking-tight">FundedStock</span></div></SheetHeader><div className="flex flex-col flex-1 p-5 gap-2 overflow-y-auto"><div className="space-y-2">{navItems.map((item) => { const commonClasses = cn("w-full px-5 py-4 text-sm font-bold transition-all flex items-center gap-4 rounded-2xl relative", activeTab === item.id ? "bg-primary text-white border border-white shadow-xl shadow-primary/20" : "text-gray-400 hover:text-white hover:bg-white/5"); if (item.href) { return ( <Link key={item.id} href={item.href} className={commonClasses} onClick={() => setIsSidebarOpen(false)}> <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "text-gray-500")} /> {item.label} {item.hasBadge && ( <span className="absolute right-5 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full"> {totalUnread} </span> )} </Link> ); } return ( <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={commonClasses} > <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "text-gray-500")} /> {item.label} </button> ); })}</div><div className="mt-auto pt-8 pb-8"><div className="pt-4 border-t border-white/5"><form action={signOut}><button type="submit" className="w-full px-5 py-4 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all rounded-2xl flex items-center gap-4 group"><LogOut className="w-5 h-5" />Logout Session</button></form></div></div></div></SheetContent></Sheet>
                    </div>
                </header>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsContent value="hub" className="animate-in fade-in duration-300">
                        <AccountsHub accounts={accounts} profile={profile} onSwitchToGetFunded={() => setActiveTab('marketplace')} />
                    </TabsContent>
                    <TabsContent value="marketplace" className="animate-in fade-in duration-300">
                        <ArenaView profile={profile} paymentSettings={paymentSettings} onSwitchToWallet={() => setActiveTab('wallet')} />
                    </TabsContent>
                    <TabsContent value="competition" className="animate-in fade-in duration-300">
                        <CompetitionView profile={profile} registrations={competitions} onSwitchToWallet={() => setActiveTab('wallet')} />
                    </TabsContent>
                    <TabsContent value="wallet" className="animate-in fade-in duration-300">
                        <WalletView profile={profile} paymentSettings={paymentSettings} />
                    </TabsContent>
                    <TabsContent value="transactions" className="animate-in fade-in duration-300">
                        <TransactionsView transactions={walletTransactions} accounts={accounts} />
                    </TabsContent>
                    <TabsContent value="kyc" className="animate-in fade-in duration-300">
                        {profile.kyc_status === 'verified' ? (
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="space-y-1"><h2 className="text-2xl font-bold text-white tracking-tight">Identity Status</h2><p className="text-gray-400 text-sm font-medium">Your verification credentials are verified.</p></div>
                                <div className="bg-white/10 backdrop-blur-2xl border border-green-500/20 bg-green-500/5 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><ShieldCheck className="w-48 h-48 text-green-400"/></div>
                                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left relative z-10"><div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 shadow-[0_0_40px_rgba(34,197,94,0.2)] border border-green-500/20"><CheckCircle className="h-10 w-10" /></div><div><h3 className="text-xl font-bold text-white">Verification Confirmed</h3><p className="text-gray-400 text-sm mt-1">Eligible for 80% Performance Reward disbursements.</p></div></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-10 pt-10 border-t border-white/5 relative z-10"><div className="space-y-1"><p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Full Name</p><p className="text-white font-bold">{profile.full_name}</p></div><div className="space-y-1"><p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">PAN Identification</p><p className="text-white font-mono font-bold">{profile.pan_number || '••••••••••'}</p></div><div className="space-y-1"><p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Contact Register</p><p className="text-white font-bold">{profile.mobile_number}</p></div><div className="space-y-1"><p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Trader Register ID</p><p className="text-white font-mono text-xs">{profile.id}</p></div></div>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto py-20 text-center space-y-6"><div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-2xl border border-primary/20"><FileCheck className="h-10 w-10" /></div><div className="space-y-2"><h2 className="text-3xl font-bold text-white tracking-tight">KYC Verification</h2><p className="text-gray-400 text-sm font-medium max-w-sm mx-auto">Complete your one-time identity verification to activate your funded account and payouts.</p></div><Button asChild size="lg" className="mt-8 rounded-2xl px-12 h-14 font-bold text-base shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"><Link href="/kyc">Initialize Verification</Link></Button></div>
                        )}
                    </TabsContent>
                </Tabs>

                <Dialog open={isDetailModalOpen} onOpenChange={() => {}}><DialogContent className="bg-slate-950 border-white/10 text-white sm:max-w-[425px]" hideClose><form onSubmit={handleOnboardingSubmit}><DialogHeader><div className="mx-auto bg-primary/10 p-4 rounded-2xl border border-primary/20 w-fit mb-4 shadow-[0_0_30px_rgba(139,44,245,0.2)]"><UserPlus className="h-8 w-8 text-primary" /></div><DialogTitle className="text-2xl font-black text-center tracking-tight">Onboarding Required</DialogTitle><DialogDescription className="text-center text-gray-400">We need your basic trader details to provision your institutional terminals on Stockmint.</DialogDescription></DialogHeader><div className="space-y-6 py-8"><div className="space-y-2"><Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Legal Full Name</Label><Input placeholder="Enter your official name" value={onboardingName} onChange={(e) => setOnboardingName(e.target.value)} required className="bg-black/40 border-white/10 h-12 rounded-xl"/><p className="text-[9px] text-gray-600 font-bold">Must match your identity documents for KYC.</p></div><div className="space-y-2"><Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mobile Number</Label><Input placeholder="10-digit primary contact" value={onboardingMobile} onChange={(e) => setOnboardingMobile(e.target.value)} required className="bg-black/40 border-white/10 h-12 rounded-xl"/><p className="text-[9px] text-gray-600 font-bold italic leading-tight">Terminal credentials will be linked to this primary contact.</p></div></div><DialogFooter><Button type="submit" disabled={isPending || !onboardingName || !onboardingMobile} className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20">{isPending ? <Loader2 className="animate-spin h-5 w-5 mr-2"/> : <ShieldCheck className="h-5 w-5 mr-2" />}Finalize Onboarding</Button></DialogFooter></form></DialogContent></Dialog>
            </main>
        </div>
    );
}

export function WelcomeClient(props: any) {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white font-poppins">Initializing...</div>}>
            <WelcomeContent {...props} />
        </Suspense>
    );
}
