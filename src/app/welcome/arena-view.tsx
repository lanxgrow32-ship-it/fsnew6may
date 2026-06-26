'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
    CheckCircle, 
    Loader2, 
    ArrowRight, 
    IndianRupee, 
    Trophy, 
    ShieldCheck, 
    Zap,
    ExternalLink,
    PlusCircle,
    Copy,
    Eye,
    EyeOff
} from 'lucide-react';
import { purchaseWithWallet, getCompetitionEvents, purchaseTournamentEntry } from './actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const plans = {
    instant: [
        { size: '1 Lakh', price: '5,999', title: '1L Instant' },
        { size: '2 Lakh', price: '9,999', title: '2L Instant' },
        { size: '5 Lakh', price: '17,999', title: '5L Instant' },
        { size: '10 Lakh', price: '28,999', title: '10L Instant' },
        { size: '25 Lakh', price: '49,500', title: '25L Instant' },
    ],
    oneStep: [
        { size: '1 Lakh', price: '4,599', title: '1L 1-Step' },
        { size: '2 Lakh', price: '7,599', title: '2L 1-Step' },
        { size: '5 Lakh', price: '12,599', title: '5L 1-Step' },
        { size: '10 Lakh', price: '19,599', title: '10L 1-Step' },
        { size: '25 Lakh', price: '34,999', title: '25L 1-Step' },
        { size: '50 Lakh', price: '54,999', title: '50L 1-Step' },
    ],
    twoStep: [
        { size: '1 Lakh', price: '2,999', title: '1L 2-Step' },
        { size: '2 Lakh', price: '4,999', title: '2L 2-Step' },
        { size: '5 Lakh', price: '7,999', title: '5L 2-Step' },
        { size: '10 Lakh', price: '12,999', title: '10L 2-Step' },
        { size: '25 Lakh', price: '21,999', title: '25L 2-Step' },
        { size: '50 Lakh', price: '35,999', title: '50L 2-Step' },
    ],
    ptp: [
        { size: '5 Lakh', price: '199', title: '5L PTP' },
        { size: '10 Lakh', price: '299', title: '10L PTP' },
        { size: '25 Lakh', price: '399', title: '25L PTP' },
        { size: '50 Lakh', price: '499', title: '50L PTP' },
    ]
};

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

export function ArenaView({ 
    profile, 
    onSwitchToWallet,
    registrations = []
}: { 
    profile: any, 
    onSwitchToWallet: () => void,
    registrations?: any[]
}) {
    const { toast } = useToast();
    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setIsLoadingEvents(true);
        getCompetitionEvents().then(data => {
            setEvents(data);
            setIsLoadingEvents(false);
        });
    }, []);

    const handlePurchase = async (plan: any) => {
        const price = parseFloat(plan.price.replace(/,/g, ''));
        if (profile.wallet_balance < price) {
            toast({ 
                title: "Insufficient Balance", 
                description: `You need ₹${(price - profile.wallet_balance).toLocaleString('en-IN')} more in your wallet.`,
                variant: "destructive"
            });
            onSwitchToWallet();
            return;
        }

        setIsPurchasing(plan.title);
        const res = await purchaseWithWallet(profile.id, plan);
        if (res.error) {
            toast({ title: "Purchase Failed", description: res.error, variant: "destructive" });
        } else {
            toast({ title: "Plan Purchased", description: "Your new account has been created." });
            window.location.reload();
        }
        setIsPurchasing(null);
    };

    const handleJoinTournament = async (event: any) => {
        if (!event.is_free && profile.wallet_balance < event.entry_fee) {
            toast({ title: "Insufficient Cash", description: "Top up your wallet to join this tournament.", variant: "destructive" });
            onSwitchToWallet();
            return;
        }

        setIsPurchasing(event.id);
        const res = await purchaseTournamentEntry(profile.id, event.id);
        if (res.error) toast({ title: "Failed", description: res.error, variant: "destructive" });
        else {
            toast({ title: "Welcome to the Arena!", description: "You are registered for this week." });
            window.location.reload();
        }
        setIsPurchasing(null);
    };

    const PlanBox = ({ plan, category }: { plan: any, category: string }) => (
        <Card className="bg-card/50 hover:border-primary transition-all duration-300 flex flex-col h-full border-border/50">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl font-black">₹{plan.size}</CardTitle>
                        <CardDescription className="text-sm font-medium text-gray-400 mt-1">{category}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] font-black uppercase tracking-tighter">80% Share</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="space-y-2 text-sm border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Target: {category === 'Instant' ? '0%' : category.includes('PTP') ? '6%' : '10%'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Drawdown: 10%</span>
                    </div>
                </div>
                <div className="pt-4 border-t border-white/5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Capital Fee</p>
                    <p className="text-2xl font-black text-primary mt-0.5">₹{plan.price}</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button 
                    onClick={() => handlePurchase(plan)} 
                    disabled={isPurchasing !== null}
                    className="w-full font-black h-12 uppercase tracking-widest"
                >
                    {isPurchasing === plan.title ? <Loader2 className="animate-spin h-4 w-4" /> : 'Activate Now'}
                </Button>
            </CardFooter>
        </Card>
    );

    const activeReg = registrations.find(r => r.competition_events?.status === 'ongoing') || registrations[0];

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight">Marketplace</h2>
                <p className="text-gray-400 text-lg mt-1 font-medium">Select your path to instant capital and professional scaling.</p>
            </div>

            <Tabs defaultValue="instant" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 max-w-4xl mx-auto h-auto p-1 bg-black/40 border border-white/10 rounded-2xl mb-12">
                    <TabsTrigger value="instant" className="py-2.5 rounded-xl font-bold text-sm">Instant</TabsTrigger>
                    <TabsTrigger value="oneStep" className="py-2.5 rounded-xl font-bold text-sm">1-Step</TabsTrigger>
                    <TabsTrigger value="twoStep" className="py-2.5 rounded-xl font-bold text-sm">2-Step</TabsTrigger>
                    <TabsTrigger value="ptp" className="py-2.5 rounded-xl font-bold text-sm">PTP</TabsTrigger>
                    <TabsTrigger value="tournaments" className="py-2.5 rounded-xl font-bold text-sm flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5" /> Battles
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="instant" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95">
                    {plans.instant.map(p => <PlanBox key={p.title} plan={p} category="Instant" />)}
                </TabsContent>
                <TabsContent value="oneStep" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95">
                    {plans.oneStep.map(p => <PlanBox key={p.title} plan={p} category="1-Step" />)}
                </TabsContent>
                <TabsContent value="twoStep" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95">
                    {plans.twoStep.map(p => <PlanBox key={p.title} plan={p} category="2-Step" />)}
                </TabsContent>
                <TabsContent value="ptp" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in zoom-in-95">
                    {plans.ptp.map(p => <PlanBox key={p.title} plan={p} category="PTP" />)}
                </TabsContent>
                
                <TabsContent value="tournaments" className="space-y-8 animate-in fade-in zoom-in-95">
                    {activeReg && (
                        <GlassCard className="border-primary/20 bg-primary/5">
                            <CardHeader className="border-b border-white/5 pb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl font-black text-white">{activeReg.competition_events?.week_label}</CardTitle>
                                        <CardDescription className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                                            Status: {activeReg.competition_events?.status}
                                        </CardDescription>
                                    </div>
                                    <Badge className="bg-primary text-white font-black px-4 py-1 rounded-full text-[10px] tracking-widest">ACTIVE ENTRY</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid md:grid-cols-2 gap-8 items-center">
                                    <div className="space-y-4">
                                        <div className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-3">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Trading ID</Label>
                                                <div className="flex items-center justify-between">
                                                    <p className="font-mono font-bold text-white text-sm">{activeReg.stockmint_username || 'AWAITING SETUP'}</p>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => { navigator.clipboard.writeText(activeReg.stockmint_username || ''); toast({title: "Copied"}); }}><Copy className="w-3.5 h-3.5"/></Button>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Master Password</Label>
                                                <div className="flex items-center justify-between">
                                                    <p className="font-mono font-bold text-white text-sm">{visiblePasswords[activeReg.id] ? activeReg.stockmint_password : '••••••••••'}</p>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => setVisiblePasswords(p => ({...p, [activeReg.id]: !p[activeReg.id]}))}>{visiblePasswords[activeReg.id] ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}</Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => { navigator.clipboard.writeText(activeReg.stockmint_password || ''); toast({title: "Copied"}); }}><Copy className="w-3.5 h-3.5"/></Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center space-y-4">
                                        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <Zap className="h-8 w-8 text-primary" />
                                        </div>
                                        <p className="text-xs text-gray-400 max-w-[200px] mx-auto">Launch the terminal to begin your competition trades.</p>
                                        <Button asChild className="w-full bg-primary font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
                                            <a href="https://stockmint.io/login" target="_blank">Launch Terminal</a>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </GlassCard>
                    )}

                    <div className="grid gap-6">
                        <h3 className="text-xl font-black text-white">Upcoming Battles</h3>
                        {isLoadingEvents ? <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary"/></div> : (
                            events.map(event => {
                                const isJoined = registrations.some(r => r.event_id === event.id);
                                return (
                                    <GlassCard key={event.id} className={cn("p-6 flex flex-col md:flex-row items-center justify-between gap-6", event.status === 'ongoing' && "border-primary/30 bg-primary/5")}>
                                        <div className="space-y-1 text-center md:text-left">
                                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                                <h3 className="text-lg font-bold text-white">{event.week_label}</h3>
                                                {event.status === 'ongoing' && <Badge className="bg-red-500 animate-pulse text-[8px] font-black uppercase">LIVE</Badge>}
                                                {event.is_free && <Badge className="bg-green-600 text-[8px] font-black uppercase">FREE</Badge>}
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                {new Date(event.start_date).toLocaleDateString()} — {new Date(event.end_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-center md:text-right">
                                                <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Entry</p>
                                                <p className="text-xl font-black text-primary">{event.is_free ? 'FREE' : `₹${event.entry_fee}`}</p>
                                            </div>
                                            <Button 
                                                onClick={() => handleJoinTournament(event)} 
                                                disabled={isPurchasing !== null || isJoined} 
                                                variant={isJoined ? "outline" : "default"}
                                                className="rounded-xl px-8 font-black uppercase tracking-widest h-12"
                                            >
                                                {isPurchasing === event.id ? <Loader2 className="animate-spin h-4 w-4"/> : isJoined ? 'Joined' : 'Join'}
                                            </Button>
                                        </div>
                                    </GlassCard>
                                );
                            })
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
