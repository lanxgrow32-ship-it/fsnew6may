
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
    CheckCircle, 
    Loader2, 
    Zap,
    Wallet,
    CreditCard,
    ArrowRight,
    Copy,
    Send,
    ChevronLeft,
    HelpCircle,
    Timer,
    Ticket,
    Check,
    Globe,
    LayoutGrid,
    Coins,
    ShieldCheck,
    Trophy,
    Sparkles
} from 'lucide-react';
import { purchaseWithWallet, requestManualAccount, validateCoupon, startFreeTrial, initiateGatewayPayment } from './actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const plans = {
    pro: [
        { size: '5 Lakh', price: '18,999', title: '5L Instant Pro' },
        { size: '10 Lakh', price: '34,999', title: '10L Instant Pro' },
        { size: '15 Lakh', price: '49,999', title: '15L Instant Pro' },
        { size: '25 Lakh', price: '79,999', title: '25L Instant Pro' },
        { size: '50 Lakh', price: '1,49,999', title: '50L Instant Pro' },
    ],
    instant: [
        { size: '1 Lakh', price: '5,999', title: '1L Instant' },
        { size: '2 Lakh', price: '9,999', title: '2L Instant' },
        { size: '5 Lakh', price: '17,999', title: '5L Instant' },
        { size: '10 Lakh', price: '28,999', title: '10L Instant' },
        { size: '25 Lakh', price: '49,999', title: '25L Instant' },
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
    ],
    forex: [
        { size: '5,000', price: '2,999', usdPrice: '35', title: '$5k Forex 2-Step' },
        { size: '10,000', price: '4,999', usdPrice: '60', title: '$10k Forex 2-Step' },
        { size: '25,000', price: '9,999', usdPrice: '120', title: '$25k Forex 2-Step' },
        { size: '50,000', price: '16,999', usdPrice: '200', title: '$50k Forex 2-Step', isPopular: true },
        { size: '100,000', price: '29,999', usdPrice: '350', title: '$100k Forex 2-Step' },
        { size: '200,000', price: '49,999', usdPrice: '600', title: '$200k Forex 2-Step' },
        { size: '400,000', price: '89,999', usdPrice: '1,050', title: '$400k Forex 2-Step' },
    ]
};

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

export function ArenaView({ 
    profile, 
    paymentSettings,
    onSwitchToWallet
}: { 
    profile: any, 
    paymentSettings: any,
    onSwitchToWallet: () => void
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [isActionPending, startTransition] = useTransition();
    const [marketSegment, setMarketSegment] = useState<'indian' | 'forex'>('indian');
    const [activeTab, setActiveTab] = useState('pro');
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [checkoutStep, setCheckoutStep] = useState<'selection' | 'method' | 'direct-pay' | 'crypto-pay'>('selection');
    const [utr, setUtr] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);

    const isPtpActive = paymentSettings?.is_ptp_enabled ?? true;
    const activeGateway = paymentSettings?.active_payment_gateway || 'manual';

    useEffect(() => {
        if (marketSegment === 'forex') setActiveTab('twoStep');
        else setActiveTab('pro');
    }, [marketSegment]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        const res = await validateCoupon(couponCode);
        if (res.error) {
            toast({ title: "Invalid Code", description: res.error, variant: "destructive" });
            setDiscount(0);
        } else {
            setDiscount(res.discount_value || 0);
            toast({ title: "Coupon Applied!" });
        }
    }

    const calculateFinalPrice = () => {
        if (!selectedPlan) return 0;
        const base = parseFloat(selectedPlan.price.replace(/,/g, ''));
        if (discount > 0) return base * (1 - discount / 100);
        return base;
    }

    const handleWalletPurchase = async () => {
        const finalPrice = calculateFinalPrice();
        if (profile.wallet_balance < finalPrice) {
            toast({ title: "Insufficient Balance", variant: "destructive" });
            onSwitchToWallet();
            return;
        }
        startTransition(async () => {
            const res = await purchaseWithWallet(profile.id, { ...selectedPlan, price: finalPrice.toString() });
            if (res.error) toast({ title: "Purchase Failed", description: res.error, variant: "destructive" });
            else router.push(`/purchase-success?id=${res.transaction_id}&amount=${res.amount}&plan=${encodeURIComponent(selectedPlan.title)}`);
        });
    };

    const handleGatewayPurchase = async () => {
        const finalPrice = calculateFinalPrice();
        startTransition(async () => {
            const res = await initiateGatewayPayment(profile.id, { ...selectedPlan, price: finalPrice }, activeGateway);
            if (res.error) toast({ title: "Gateway Error", description: res.error, variant: "destructive" });
            else if (res.redirectUrl) window.location.href = res.redirectUrl;
        });
    }

    const PlanBox = ({ plan, category }: { plan: any, category: string }) => {
        const isPro = category.includes('Pro');
        return (
            <Card className={cn(
                "bg-card/50 transition-all duration-300 flex flex-col h-full border-border/50 group relative hover:border-primary",
                isPro && "border-primary/30 bg-primary/5"
            )}>
                <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg font-bold">{marketSegment === 'forex' ? `$${plan.size}` : `₹${plan.size}`}</CardTitle>
                            <CardDescription className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{category}</CardDescription>
                        </div>
                        {isPro && <Badge className="bg-primary text-white text-[8px] font-black uppercase px-2 h-4">WEEKLY</Badge>}
                    </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <div className="space-y-2 text-xs border-t border-white/5 pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground font-medium">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span>80% Reward Share</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground font-medium">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span>{isPro ? '7-Day Validity' : 'No Profit Target'}</span>
                        </div>
                        {isPro && (
                             <div className="flex items-center gap-2 text-white font-bold">
                                <Zap className="h-3.5 w-3.5 text-primary" />
                                <span>Daily Payouts Enabled</span>
                            </div>
                        )}
                    </div>
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Buy Price</p>
                        <p className="text-xl font-bold text-primary mt-0.5">
                            {marketSegment === 'forex' ? `$${plan.usdPrice}` : `₹${plan.price}`}
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => { setSelectedPlan(plan); setCheckoutStep('method'); }} className="w-full font-bold h-10 rounded-xl text-xs uppercase tracking-widest">Get Funded</Button>
                </CardFooter>
            </Card>
        );
    }

    if (checkoutStep !== 'selection') {
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                 <button onClick={() => { setCheckoutStep('selection'); setSelectedPlan(null); }} className="flex items-center text-gray-500 hover:text-white font-bold transition-colors">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back to Arena
                </button>
                <GlassCard className="p-8 border-primary/20 bg-primary/5">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white">Select Checkout Method</h2>
                        <p className="text-gray-400 text-sm mt-1">Direct verification · 0% Transaction Fees</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button onClick={handleGatewayPurchase} className="h-20 rounded-2xl flex flex-col gap-1">
                            <Zap className="h-5 w-5"/>
                            <span>Automated UPI</span>
                            <span className="text-[9px] opacity-60">Instant Activation</span>
                        </Button>
                        <Button variant="outline" onClick={handleWalletPurchase} className="h-20 rounded-2xl flex flex-col gap-1 border-white/10 bg-white/5">
                            <Wallet className="h-5 w-5"/>
                            <span>Wallet Balance</span>
                            <span className="text-[9px] opacity-60">Uses Internal Funds</span>
                        </Button>
                    </div>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight uppercase">{marketSegment === 'forex' ? 'Forex Arena' : 'Indian Market'}</h2>
                    <p className="text-gray-400 text-sm font-medium">Select your specialization and secure institutional funding.</p>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-2xl p-1 flex items-center h-12 shadow-2xl">
                    <button onClick={() => setMarketSegment('indian')} className={cn("flex items-center gap-2 px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", marketSegment === 'indian' ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:text-gray-300")}><LayoutGrid className="w-3.5 h-3.5" />Indian Market</button>
                    <button onClick={() => setMarketSegment('forex')} className={cn("flex items-center gap-2 px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", marketSegment === 'forex' ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:text-gray-300")}><Globe className="w-3.5 h-3.5" />Forex Arena</button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 max-w-4xl mx-auto h-auto p-1 bg-black/40 border border-white/10 rounded-2xl mb-10">
                    {marketSegment === 'indian' ? (
                        <>
                            <TabsTrigger value="pro" className="py-2.5 rounded-xl font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white border border-transparent data-[state=active]:border-white/20">⚡ Instant Pro</TabsTrigger>
                            <TabsTrigger value="instant" className="py-2.5 rounded-xl font-bold text-xs">Standard Instant</TabsTrigger>
                            <TabsTrigger value="oneStep" className="py-2.5 rounded-xl font-bold text-xs">1-Step</TabsTrigger>
                            <TabsTrigger value="twoStep" className="py-2.5 rounded-xl font-bold text-xs">2-Step</TabsTrigger>
                            {isPtpActive ? (
                                <TabsTrigger value="ptp" className="py-2.5 rounded-xl font-bold text-xs">PTP</TabsTrigger>
                            ) : (
                                <div className="opacity-20 pointer-events-none flex items-center justify-center text-[10px] font-bold uppercase">Locked</div>
                            )}
                        </>
                    ) : (
                        <>
                            <TabsTrigger value="twoStep" className="py-2.5 rounded-xl font-bold text-xs">2-Step Standard</TabsTrigger>
                            <TabsTrigger value="oneStep" className="py-2.5 rounded-xl font-bold text-xs">1-Step Fast Track</TabsTrigger>
                            <TabsTrigger value="instant" className="py-2.5 rounded-xl font-bold text-xs">Forex Instant</TabsTrigger>
                            <div className="opacity-20 pointer-events-none flex items-center justify-center text-[10px] font-bold uppercase">Pro Soon</div>
                            <div className="opacity-20 pointer-events-none flex items-center justify-center text-[10px] font-bold uppercase">PTP Soon</div>
                        </>
                    )}
                </TabsList>

                <TabsContent value="pro" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                    {plans.pro.map(p => <PlanBox key={p.title} plan={p} category="Instant PRO" />)}
                </TabsContent>
                <TabsContent value="instant" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                    {marketSegment === 'indian' ? plans.instant.map(p => <PlanBox key={p.title} plan={p} category="Instant" />) : <div className="col-span-full py-20 text-center"><Sparkles className="h-10 w-10 text-primary mx-auto opacity-20 mb-4"/><h3 className="text-xl font-bold uppercase">Forex Instant Coming Soon</h3></div>}
                </TabsContent>
                <TabsContent value="oneStep" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {marketSegment === 'indian' ? plans.oneStep.map(p => <PlanBox key={p.title} plan={p} category="1-Step Fast Track" />) : <div className="col-span-full py-20 text-center"><h3 className="text-xl font-bold uppercase">In Optimization...</h3></div>}
                </TabsContent>
                <TabsContent value="twoStep" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {marketSegment === 'forex' ? plans.forex.map(p => <PlanBox key={p.title} plan={p} category="Forex 2-Step" />) : plans.twoStep.map(p => <PlanBox key={p.title} plan={p} category="2-Step Standard" />)}
                </TabsContent>
                <TabsContent value="ptp" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {plans.ptp.map(p => <PlanBox key={p.title} plan={p} category="PassThenPay" />)}
                </TabsContent>
            </Tabs>
            
            <div className="flex justify-center">
                <Button asChild variant="outline" className="rounded-full bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 h-11 px-10 text-[10px] font-black uppercase tracking-widest gap-2">
                    <Link href={activeTab === 'pro' ? "/rules/instant-pro" : "/guide"}><HelpCircle className="w-4 h-4"/> View {activeTab === 'pro' ? 'Pro' : ''} Rules</Link>
                </Button>
            </div>
        </div>
    );
}
