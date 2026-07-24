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
    Timer,
    Ticket,
    Check,
    ExternalLink,
    Sparkles,
    ShieldCheck
} from 'lucide-react';
import { purchaseWithWallet, requestManualAccount, validateCoupon, startFreeTrial, initiateGatewayPayment } from './actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const plans = {
    instant: [
        { size: '1 Lakh', price: '5,999', title: '1L Instant' },
        { size: '2 Lakh', price: '9,999', title: '2L Instant' },
        { size: '5 Lakh', price: '17,999', title: '5L Instant' },
        { size: '10 Lakh', price: '28,999', title: '10L Instant' },
        { size: '25 Lakh', price: '24,999', title: '25L Instant', isFlashSale: true },
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
    const router = useRouter();
    const { toast } = useToast();
    const [isActionPending, startTransition] = useTransition();
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [checkoutStep, setCheckoutStep] = useState<'selection' | 'method' | 'direct-pay'>('selection');
    const [utr, setUtr] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [isStartingTrial, setIsStartingTrial] = useState(false);

    const isPtpActive = paymentSettings?.is_ptp_enabled ?? true;
    const activeGateway = paymentSettings?.active_payment_gateway || 'manual';

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [checkoutStep]);

    const handleStartTrial = async () => {
        setIsStartingTrial(true);
        const res = await startFreeTrial(profile.id);
        if (res.error) {
            toast({ title: "Trial Failed", description: res.error, variant: "destructive" });
        } else {
            toast({ title: "Trial Activated!", description: "48 hours of platform access granted." });
            router.push('/welcome');
        }
        setIsStartingTrial(false);
    }

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsValidatingCoupon(true);
        const res = await validateCoupon(couponCode);
        if (res.error) {
            toast({ title: "Invalid Code", description: res.error, variant: "destructive" });
            setDiscount(0);
        } else {
            setDiscount(res.discount_value || 0);
            toast({ title: "Coupon Applied!", description: `${res.discount_value}% discount added.` });
        }
        setIsValidatingCoupon(false);
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
            toast({ 
                title: "Insufficient Balance", 
                description: `You need ₹${(finalPrice - profile.wallet_balance).toLocaleString('en-IN')} more in your wallet.`,
                variant: "destructive"
            });
            onSwitchToWallet();
            return;
        }

        startTransition(async () => {
            const res = await purchaseWithWallet(profile.id, { ...selectedPlan, price: finalPrice.toString() });
            if (res.error) {
                toast({ title: "Purchase Failed", description: res.error, variant: "destructive" });
            } else {
                router.push(`/purchase-success?id=${res.transaction_id}&amount=${res.amount}&plan=${encodeURIComponent(selectedPlan.title)}`);
            }
        });
    };

    /**
     * Triggers the automated gateway handshake (LG-Pay or WatchPay)
     */
    const handleGatewayPurchase = async () => {
        const finalPrice = calculateFinalPrice();
        startTransition(async () => {
            const res = await initiateGatewayPayment(profile.id, { ...selectedPlan, price: finalPrice }, activeGateway);
            if (res.error) {
                toast({ title: "Gateway Error", description: res.error, variant: "destructive" });
            } else if (res.redirectUrl) {
                window.location.href = res.redirectUrl;
            }
        });
    }

    const handleDirectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!utr) return;
        const finalPrice = calculateFinalPrice();
        
        startTransition(async () => {
            const res = await requestManualAccount(profile.id, selectedPlan.title, finalPrice, utr);
            if (res.error) {
                toast({ title: "Submission Failed", description: res.error, variant: "destructive" });
            } else {
                router.push(`/purchase-success?id=${res.transaction_id}&amount=${res.amount}&plan=${encodeURIComponent(selectedPlan.title)}&method=manual`);
            }
        });
    };

    const handleExternalPurchase = () => {
        const finalPrice = calculateFinalPrice();
        const url = `https://www.fundedstock.shop/purchase?wallet_id=${profile.wallet_id}&plan=${encodeURIComponent(selectedPlan.title)}&price=${finalPrice}`;
        window.open(url, '_blank');
        toast({ title: "Redirecting...", description: "Opening secure payment portal." });
    }

    if (checkoutStep === 'method') {
        const isPTP = selectedPlan.title.toLowerCase().includes('ptp');
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <button onClick={() => { setSelectedPlan(null); setCheckoutStep('selection'); setDiscount(0); setCouponCode(''); }} className="flex items-center text-gray-500 hover:text-white font-bold p-0 h-auto transition-colors">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back to Plans
                </button>
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="space-y-4 flex-1">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Payment Method</h2>
                            <p className="text-gray-400 text-sm font-medium">Select your activation strategy for the {selectedPlan.title}.</p>
                        </div>

                        {!isPTP && (
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Ticket className="h-3 w-3" /> Have a Promo Code?
                                </Label>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Enter code" 
                                        value={couponCode} 
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        disabled={discount > 0}
                                        className="bg-black/20 border-white/10 text-white h-11 font-mono uppercase" 
                                    />
                                    <Button 
                                        variant="outline" 
                                        onClick={handleApplyCoupon} 
                                        disabled={!couponCode || discount > 0 || isValidatingCoupon}
                                        className="bg-white/10 border-white/10 h-11 px-6 font-bold"
                                    >
                                        {isValidatingCoupon ? <Loader2 className="animate-spin h-4 w-4"/> : discount > 0 ? <Check className="h-4 w-4 text-green-400"/> : 'Apply'}
                                    </Button>
                                </div>
                                {discount > 0 && <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">✓ PROMO APPLIED: {discount}% OFF</p>}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            <button 
                                onClick={handleWalletPurchase} 
                                disabled={isActionPending}
                                className="group relative flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl text-left transition-all hover:bg-white/10 hover:border-primary/50 shadow-2xl"
                            >
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(139,44,245,0.1)]">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-bold text-white">Express Wallet Activation</p>
                                    <p className="text-[11px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1">
                                        <Timer className="w-3 h-3" /> Ready in seconds
                                    </p>
                                </div>
                                {isActionPending && <Loader2 className="absolute right-6 animate-spin h-5 w-5 text-primary"/>}
                            </button>

                            {/* DYNAMIC SECONDARY BUTTON BASED ON ADMIN SELECTION */}
                            {activeGateway === 'cashfree' ? (
                                <button 
                                    onClick={handleExternalPurchase}
                                    className="group flex items-center gap-4 p-6 bg-primary/5 border border-primary/20 rounded-3xl text-left transition-all hover:bg-primary/10 hover:border-primary/50 shadow-xl"
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base font-bold text-white">Cashfree Gateway</p>
                                        <p className="text-[11px] text-primary font-bold uppercase tracking-wider mt-1">UPI / Cards / NetBanking</p>
                                    </div>
                                </button>
                            ) : activeGateway === 'manual' ? (
                                <button 
                                    onClick={() => setCheckoutStep('direct-pay')}
                                    className="group flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl text-left transition-all hover:bg-white/10 hover:border-primary/50"
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base font-bold text-white">Standard Direct Payment</p>
                                        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mt-1">Verifies in ~30 mins</p>
                                    </div>
                                </button>
                            ) : (
                                <button 
                                    onClick={handleGatewayPurchase}
                                    disabled={isActionPending}
                                    className="group flex items-center gap-4 p-6 bg-primary/10 border border-primary/30 rounded-3xl text-left transition-all hover:bg-primary/20 hover:border-primary shadow-xl"
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base font-bold text-white">
                                            {activeGateway === 'automated' ? 'Fast Checkout' : 
                                             activeGateway === 'lgpay' ? 'Instant UPI (LG-Pay)' : 
                                             'Instant UPI (WatchPay)'}
                                        </p>
                                        <p className="text-[11px] text-primary font-bold uppercase tracking-wider mt-1">Automated Bank Handshake</p>
                                    </div>
                                    {isActionPending && <Loader2 className="animate-spin h-5 w-5 text-primary" />}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-80 space-y-6">
                        <GlassCard className="p-6 border-primary/20">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">{selectedPlan.title}</span>
                                    <span className="font-bold text-white">₹{selectedPlan.price}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between items-center text-sm text-green-400 font-bold">
                                        <span>Promo Discount</span>
                                        <span>- ₹{(parseFloat(selectedPlan.price.replace(/,/g, '')) * (discount/100)).toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-base font-bold text-white">Total</span>
                                    <span className="text-2xl font-black text-primary">₹{calculateFinalPrice().toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        );
    }

    if (checkoutStep === 'direct-pay') {
        const isPTP = selectedPlan.title.toLowerCase().includes('ptp');
        const upiId = isPTP ? paymentSettings?.pay_later_upi_id : paymentSettings?.upi_id;
        const qrUrl = isPTP ? paymentSettings?.pay_later_qr_code_url : paymentSettings?.qr_code_url;
        const finalPrice = calculateFinalPrice();

        return (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <button onClick={() => setCheckoutStep('method')} className="flex items-center text-gray-500 hover:text-white font-bold p-0 h-auto transition-colors">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </button>

                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Direct Purchase</h2>
                    <p className="text-gray-400 text-sm font-medium">Scan to pay for the {selectedPlan.title} and provide reference.</p>
                </div>

                <GlassCard className="p-0 border-primary/20">
                    <div className="flex flex-col md:flex-row">
                        <div className="p-8 bg-white/[0.03] border-b md:border-b-0 md:border-r border-white/10 w-full md:w-[280px] shrink-0 flex flex-col items-center justify-center gap-6 text-center">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Pay Exactly</p>
                                <p className="text-3xl font-bold text-primary tracking-tight">₹{finalPrice.toLocaleString('en-IN')}</p>
                            </div>

                            <div className="bg-white p-2 rounded-xl shadow-2xl">
                                {qrUrl ? (
                                    <Image src={qrUrl} alt="Payment QR" width={140} height={140} />
                                ) : (
                                    <div className="w-[140px] h-[140px] flex items-center justify-center text-slate-950 font-bold text-[10px]">QR Loading...</div>
                                )}
                            </div>
                            
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">UPI Address</p>
                                <div className="flex items-center gap-2 justify-center">
                                    <p className="font-mono text-[10px] font-bold text-white truncate max-w-[140px]">{upiId || 'pay@fundedstock'}</p>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-600 hover:text-white" onClick={() => { navigator.clipboard.writeText(upiId || ''); toast({title: "Copied"}); }}><Copy className="w-3.5 h-3.5"/></Button>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleDirectSubmit} className="flex-1 p-8 flex flex-col justify-center space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Transaction ID (UTR)</Label>
                                <input type="hidden" name="dummy" />
                                <Input 
                                    placeholder="Enter 12-digit UPI reference" 
                                    value={utr} 
                                    onChange={(e) => setUtr(e.target.value)} 
                                    required 
                                    className="bg-black/20 border-white/10 text-white text-base font-mono focus:ring-primary/50" 
                                />
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium bg-white/5 p-2 rounded-lg border border-white/5">
                                    <CheckCircle className="h-3 w-3 text-green-500"/>
                                    Verified by our team within 30 minutes.
                                </div>
                            </div>
                            <Button type="submit" disabled={isActionPending || !utr} className="w-full h-12 font-bold rounded-xl shadow-xl shadow-primary/20 text-xs uppercase tracking-widest">
                                {isActionPending ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null}
                                Confirm & Activate Plan
                            </Button>
                        </form>
                    </div>
                </GlassCard>
            </div>
        );
    }

    const PlanBox = ({ plan, category }: { plan: any, category: string }) => (
        <Card className={cn(
            "bg-card/50 hover:border-primary transition-all duration-300 flex flex-col h-full border-border/50 group relative overflow-visible",
            plan.isFlashSale && "border-primary border-2 shadow-[0_0_30px_rgba(139,44,245,0.2)] bg-primary/5 scale-[1.02]"
        )}>
            {plan.isFlashSale && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1 rounded-full z-10 whitespace-nowrap shadow-lg">
                    Today Only
                </div>
            )}
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className={cn("text-lg font-bold", plan.isFlashSale && "text-primary text-xl")}>₹{plan.size}</CardTitle>
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
                    <div className="flex items-baseline gap-2">
                        <p className={cn("text-xl font-bold text-primary mt-0.5 group-hover:scale-105 transition-transform origin-left", plan.isFlashSale && "text-2xl text-white")}>₹{plan.price}</p>
                        {plan.isFlashSale && <span className="text-[10px] text-red-500 font-black line-through">₹49,500</span>}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button 
                    onClick={() => { setSelectedPlan(plan); setCheckoutStep('method'); }} 
                    className={cn("w-full font-bold h-10 rounded-xl text-xs shadow-lg uppercase tracking-widest", plan.isFlashSale ? "bg-white text-black hover:bg-gray-100" : "")}
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

    const gridCols = isPtpActive ? "lg:grid-cols-4" : "lg:grid-cols-3";

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">Get Funded</h2>
                <p className="text-gray-400 text-sm font-medium">Select your path to capital and secure your evaluation account.</p>
            </div>

            <Tabs defaultValue="instant" className="w-full">
                <TabsList className={cn("grid w-full max-w-2xl mx-auto h-auto p-1 bg-black/40 border border-white/10 rounded-2xl mb-10", gridCols)}>
                    <TabsTrigger value="instant" className="py-2.5 rounded-xl font-bold text-xs">Instant</TabsTrigger>
                    <TabsTrigger value="oneStep" className="py-2.5 rounded-xl font-bold text-xs">1-Step</TabsTrigger>
                    <TabsTrigger value="twoStep" className="py-2.5 rounded-xl font-bold text-xs">2-Step</TabsTrigger>
                    {isPtpActive && <TabsTrigger value="ptp" className="py-2.5 rounded-xl font-bold text-xs">PTP</TabsTrigger>}
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
                {isPtpActive && (
                    <TabsContent value="ptp" className="animate-in fade-in zoom-in-95">
                        <RulesPill href="/pass-then-pay" label="About PassThenPay" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {plans.ptp.map(p => <PlanBox key={p.title} plan={p} category="PTP" />)}
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            {/* Premium Trial Banner */}
            <div className="pt-12">
                <GlassCard className="relative p-8 md:p-12 border-primary/30 bg-primary/5 shadow-2xl shadow-primary/10 flex flex-col md:flex-row items-center justify-between gap-8 group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 -z-0 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                        <Sparkles className="w-48 h-48 text-primary" />
                    </div>
                    <div className="space-y-4 text-center md:text-left relative z-10">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <Badge className="bg-primary/20 text-primary border-primary/20 px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">
                                Try the Broker Hub
                            </Badge>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">• Free Trial</span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter !leading-tight">
                            Experience the Broker <br /> <span className="text-primary">Trial for 48 Hours.</span>
                        </h3>
                        <p className="text-gray-400 max-w-md text-base font-medium">
                            Test our high-fidelity institutional terminal with ₹5 Lakh simulated capital. Market-aware logic ensures your clock only ticks on trading days.
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                            <div className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-widest">
                                <CheckCircle className="h-4 w-4" /> Instant Activation
                            </div>
                            <div className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-widest">
                                <CheckCircle className="h-4 w-4" /> No KYC Required
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0 w-full md:w-auto relative z-10">
                        <Button 
                            onClick={handleStartTrial}
                            disabled={isStartingTrial}
                            className="w-full md:w-auto h-16 px-12 rounded-2xl bg-white text-black hover:bg-gray-100 font-black uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all hover:scale-105 active:scale-95 text-xs"
                        >
                            {isStartingTrial ? <Loader2 className="h-5 w-5 animate-spin"/> : "Start Free Trial"}
                        </Button>
                        <p className="text-[9px] text-center text-gray-600 font-bold uppercase tracking-widest mt-4">Valid once per trader session</p>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
