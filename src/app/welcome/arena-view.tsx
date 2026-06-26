'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
    CheckCircle, 
    Loader2, 
    IndianRupee, 
    Zap,
    Wallet,
    CreditCard,
    ArrowRight,
    Copy,
    Send,
    ChevronLeft,
    HelpCircle,
    Info,
    Timer
} from 'lucide-react';
import { purchaseWithWallet } from './actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

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
    paymentSettings,
    onSwitchToWallet
}: { 
    profile: any, 
    paymentSettings: any,
    onSwitchToWallet: () => void
}) {
    const { toast } = useToast();
    const [isActionPending, startTransition] = useTransition();
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [checkoutStep, setCheckoutStep] = useState<'selection' | 'method' | 'direct-pay'>('selection');
    const [utr, setUtr] = useState('');

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [checkoutStep]);

    const handleWalletPurchase = async () => {
        const price = parseFloat(selectedPlan.price.replace(/,/g, ''));
        if (profile.wallet_balance < price) {
            toast({ 
                title: "Insufficient Balance", 
                description: `You need ₹${(price - profile.wallet_balance).toLocaleString('en-IN')} more in your wallet.`,
                variant: "destructive"
            });
            onSwitchToWallet();
            return;
        }

        startTransition(async () => {
            const res = await purchaseWithWallet(profile.id, selectedPlan);
            if (res.error) {
                toast({ title: "Purchase Failed", description: res.error, variant: "destructive" });
            } else {
                toast({ title: "Plan Purchased", description: "Your new account has been created." });
                window.location.reload();
            }
        });
    };

    const handleDirectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!utr) return;
        toast({ title: "Submission Received", description: "Admin will verify your direct payment shortly." });
        setSelectedPlan(null);
        setCheckoutStep('selection');
    };

    if (checkoutStep === 'method') {
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <Button variant="ghost" onClick={() => setCheckoutStep('selection')} className="text-gray-500 hover:text-white font-bold p-0 h-auto">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back to Plans
                </Button>
                
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Payment Method</h2>
                    <p className="text-gray-400 text-sm font-medium">Select your activation protocol for the {selectedPlan.title}.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={handleWalletPurchase} 
                        disabled={isActionPending}
                        className="group relative flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl text-left transition-all hover:bg-white/10 hover:border-primary/50 shadow-2xl"
                    >
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(139,44,245,0.1)]">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-bold text-white">Pay via Wallet</p>
                            <p className="text-[11px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1">
                                <Timer className="w-3 h-3" /> Express activation — ready in seconds
                            </p>
                        </div>
                        {isActionPending && <Loader2 className="absolute right-6 animate-spin h-5 w-5 text-primary"/>}
                    </button>

                    <button 
                        onClick={() => setCheckoutStep('direct-pay')}
                        className="group flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl text-left transition-all hover:bg-white/10 hover:border-primary/50"
                    >
                        <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-bold text-white">Direct Payment</p>
                            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mt-1">Standard verification — verifies in ~30 mins</p>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    if (checkoutStep === 'direct-pay') {
        const isPTP = selectedPlan.title.toLowerCase().includes('ptp');
        const upiId = isPTP ? paymentSettings?.pay_later_upi_id : paymentSettings?.upi_id;
        const qrUrl = isPTP ? paymentSettings?.pay_later_qr_code_url : paymentSettings?.qr_code_url;

        return (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <Button variant="ghost" onClick={() => setCheckoutStep('method')} className="text-gray-500 hover:text-white font-bold p-0 h-auto">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>

                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Direct Purchase</h2>
                    <p className="text-gray-400 text-sm font-medium">Scan to pay for the {selectedPlan.title} and provide reference.</p>
                </div>

                <GlassCard className="p-0 border-primary/20">
                    <div className="flex flex-col md:flex-row">
                        <div className="p-8 bg-white/[0.03] border-b md:border-b-0 md:border-r border-white/10 w-full md:w-[280px] shrink-0 flex flex-col items-center justify-center gap-6 text-center">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Pay Exactly</p>
                                <p className="text-3xl font-bold text-primary tracking-tight">₹{selectedPlan.price}</p>
                            </div>

                            <div className="bg-white p-2 rounded-xl shadow-2xl">
                                {qrUrl ? (
                                    <Image src={qrUrl} alt="Payment QR" width={140} height={140} />
                                ) : (
                                    <div className="w-[140px] h-[140px] flex items-center justify-center text-slate-950 font-bold text-[10px]">QR Loading...</div>
                                )}
                            </div>
                            
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">UPI Address</p>
                                <div className="flex items-center gap-2 justify-center">
                                    <p className="font-mono text-[10px] font-bold text-white truncate max-w-[140px]">{upiId || 'pay@fundedstock'}</p>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-600 hover:text-white" onClick={() => { navigator.clipboard.writeText(upiId || ''); toast({title: "Copied"}); }}><Copy className="w-3.5 h-3.5"/></Button>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleDirectSubmit} className="flex-1 p-8 flex flex-col justify-center space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Transaction ID (UTR)</Label>
                                <Input 
                                    placeholder="Enter 12-digit UPI reference" 
                                    value={utr} 
                                    onChange={(e) => setUtr(e.target.value)} 
                                    required 
                                    className="bg-black/20 border-white/10 h-12 text-white text-base font-mono focus:ring-primary/50" 
                                />
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium bg-white/5 p-2 rounded-lg border border-white/5">
                                    <CheckCircle className="h-3 w-3 text-green-500"/>
                                    Verified by our team within 15 minutes.
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-12 font-bold rounded-xl shadow-xl shadow-primary/20 text-xs">
                                Confirm & Activate Plan
                            </Button>
                        </form>
                    </div>
                </GlassCard>
            </div>
        );
    }

    const PlanBox = ({ plan, category }: { plan: any, category: string }) => (
        <Card className="bg-card/50 hover:border-primary transition-all duration-300 flex flex-col h-full border-border/50 group">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold">₹{plan.size}</CardTitle>
                        <CardDescription className="text-xs font-medium text-gray-400 mt-1">{category}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] font-bold px-1.5">80% Share</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="space-y-2 text-xs border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        <span>Target: {category === 'Instant' ? '0%' : category.includes('PTP') ? '6%' : '10%'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        <span>Drawdown: 10%</span>
                    </div>
                </div>
                <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Capital Fee</p>
                    <p className="text-xl font-bold text-primary mt-0.5 group-hover:scale-105 transition-transform origin-left">₹{plan.price}</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button 
                    onClick={() => { setSelectedPlan(plan); setCheckoutStep('method'); }} 
                    className="w-full font-bold h-10 rounded-xl text-xs shadow-lg"
                >
                    Activate Now
                </Button>
            </CardFooter>
        </Card>
    );

    const RulesPill = ({ href, label }: { href: string, label?: string }) => (
        <div className="flex justify-center mb-8">
            <Button asChild variant="outline" className="rounded-full bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all px-6 py-1 h-9 text-xs font-bold gap-2">
                <Link href={href}>
                    <HelpCircle className="w-3.5 h-3.5" />
                    {label || "View Rules"}
                </Link>
            </Button>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">Get Funded</h2>
                <p className="text-gray-400 text-sm font-medium">Select your path to instant capital and professional scaling.</p>
            </div>

            <Tabs defaultValue="instant" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-2xl mx-auto h-auto p-1 bg-black/40 border border-white/10 rounded-2xl mb-10">
                    <TabsTrigger value="instant" className="py-2.5 rounded-xl font-bold text-xs">Instant</TabsTrigger>
                    <TabsTrigger value="oneStep" className="py-2.5 rounded-xl font-bold text-xs">1-Step</TabsTrigger>
                    <TabsTrigger value="twoStep" className="py-2.5 rounded-xl font-bold text-xs">2-Step</TabsTrigger>
                    <TabsTrigger value="ptp" className="py-2.5 rounded-xl font-bold text-xs">PTP</TabsTrigger>
                </TabsList>

                <TabsContent value="instant" className="animate-in fade-in zoom-in-95">
                    <RulesPill href="/rules/instant-funding" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {plans.instant.map(p => <PlanBox key={p.title} plan={p} category="Instant" />)}
                    </div>
                </TabsContent>
                <TabsContent value="oneStep" className="animate-in fade-in zoom-in-95">
                    <RulesPill href="/rules/one-step" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {plans.oneStep.map(p => <PlanBox key={p.title} plan={p} category="1-Step" />)}
                    </div>
                </TabsContent>
                <TabsContent value="twoStep" className="animate-in fade-in zoom-in-95">
                    <RulesPill href="/rules/two-step-evaluation" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {plans.twoStep.map(p => <PlanBox key={p.title} plan={p} category="2-Step" />)}
                    </div>
                </TabsContent>
                <TabsContent value="ptp" className="animate-in fade-in zoom-in-95">
                    <RulesPill href="/pass-then-pay" label="About PassThenPay" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {plans.ptp.map(p => <PlanBox key={p.title} plan={p} category="PTP" />)}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}