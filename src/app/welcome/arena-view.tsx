
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
    Sparkles,
    QrCode,
    X
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
    const [checkoutMode, setCheckoutMode] = useState<'upi' | 'crypto' | 'wallet'>('upi');
    const [utr, setUtr] = useState('');
    const [cryptoTxId, setCryptoTxId] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);

    const isPtpActive = paymentSettings?.is_ptp_enabled ?? true;
    const usdtAddress = paymentSettings?.usdt_wallet_address || 'T...';

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

    const handleUpiPurchase = async () => {
        const finalPrice = calculateFinalPrice();
        if (!utr) {
            toast({ title: "UTR Required", description: "Please enter your transaction ID.", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            const res = await requestManualAccount(profile.id, selectedPlan.title, finalPrice, utr);
            if (res.error) toast({ title: "Submission Failed", description: res.error, variant: "destructive" });
            else router.push(`/purchase-success?id=${res.transaction_id}&amount=${res.amount}&plan=${encodeURIComponent(selectedPlan.title)}&method=manual`);
        });
    }

    const handleCryptoPurchase = async () => {
        const finalPrice = calculateFinalPrice();
        if (!cryptoTxId) {
            toast({ title: "TxID Required", variant: "destructive" });
            return;
        }
        toast({ title: "Processing...", description: "Verification might take a few minutes." });
        router.push(`/purchase-success?id=${cryptoTxId}&amount=${finalPrice}&plan=${encodeURIComponent(selectedPlan.title)}&method=crypto`);
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
                            {marketSegment === 'forex' ? `$${plan.usdPrice || plan.price}` : `₹${plan.price}`}
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => { setSelectedPlan(plan); setCheckoutMode('upi'); }} className="w-full font-bold h-10 rounded-xl text-xs uppercase tracking-widest">Get Funded</Button>
                </CardFooter>
            </Card>
        );
    }

    if (selectedPlan) {
        const finalPrice = calculateFinalPrice();
        const isPtp = selectedPlan.title.toLowerCase().includes('ptp');
        const upiId = isPtp ? paymentSettings?.pay_later_upi_id : paymentSettings?.upi_id;
        const qrCode = isPtp ? paymentSettings?.pay_later_qr_code_url : paymentSettings?.qr_code_url;

        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 font-poppins">
                 <button onClick={() => setSelectedPlan(null)} className="flex items-center text-gray-500 hover:text-white font-bold transition-colors">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back to Arena
                </button>
                
                <GlassCard className="border-primary/20 bg-primary/5">
                    <div className="p-8 space-y-10 flex flex-col items-center">
                        {/* Header */}
                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Secure Checkout</p>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight">{selectedPlan.title}</h2>
                            <p className="text-gray-500 text-sm">Amount to pay: <span className="text-white font-bold">₹{finalPrice.toLocaleString()}</span></p>
                        </div>

                        {/* UPI View (Simplified & Centered) */}
                        {checkoutMode === 'upi' && (
                            <div className="w-full max-w-md bg-black/40 rounded-[40px] p-10 border border-white/5 animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center gap-10 shadow-2xl">
                                <div className="space-y-6 text-center w-full">
                                    <div className="bg-white p-4 rounded-3xl w-fit mx-auto shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                                        {qrCode ? (
                                            <Image src={qrCode} alt="UPI QR" width={220} height={220} className="rounded-xl" />
                                        ) : (
                                            <div className="w-[220px] h-[220px] flex items-center justify-center bg-slate-100 text-slate-900 font-bold text-xs uppercase rounded-xl">QR Loading...</div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Official UPI ID</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <code className="text-white font-mono font-bold text-sm bg-black/40 px-4 py-2 rounded-xl border border-white/10">{upiId || 'pay@fundedstock'}</code>
                                            <Button size="icon" variant="ghost" className="h-10 w-10 text-gray-500 hover:text-white" onClick={() => { navigator.clipboard.writeText(upiId || ''); toast({title: "Copied"}); }}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-8 w-full">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Enter Transaction ID (UTR)</Label>
                                        <Input 
                                            placeholder="12-digit UPI Ref Number" 
                                            value={utr} 
                                            onChange={(e) => setUtr(e.target.value)}
                                            className="h-16 bg-black/60 border-white/10 text-white font-mono text-xl text-center rounded-2xl focus:ring-primary/50" 
                                        />
                                        <p className="text-[10px] text-gray-700 text-center font-bold uppercase tracking-tight">Manual verification takes 15-30 minutes.</p>
                                    </div>
                                    <Button onClick={handleUpiPurchase} disabled={isActionPending || !utr} className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                                        {isActionPending ? <Loader2 className="animate-spin h-6 w-6"/> : <Send className="mr-2 h-5 w-5" />} Submit Verification
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Crypto View */}
                        {checkoutMode === 'crypto' && (
                            <div className="w-full max-w-md bg-black/40 rounded-[32px] p-8 border border-green-500/10 animate-in fade-in slide-in-from-bottom-2 space-y-8">
                                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                    <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
                                        <Coins className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white uppercase">USDT (TRC-20)</h3>
                                        <p className="text-xs text-gray-500 font-medium">Crypto Settlement</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Company Address</p>
                                        <div className="p-5 bg-black/60 rounded-2xl border border-white/5 break-all text-xs font-mono font-bold text-white text-center leading-relaxed">
                                            {usdtAddress}
                                        </div>
                                        <Button variant="outline" onClick={() => { navigator.clipboard.writeText(usdtAddress); toast({title: "Address Copied"}); }} className="w-full h-10 border-white/10 text-[10px] font-black uppercase">Copy Address</Button>
                                    </div>
                                    <div className="space-y-6 pt-4 border-t border-white/5">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-gray-500 uppercase">Transaction Hash (TxID)</Label>
                                            <Input value={cryptoTxId} onChange={(e) => setCryptoTxId(e.target.value)} placeholder="Paste hash here" className="h-12 bg-black/60 border-white/10 font-mono text-xs rounded-xl" />
                                        </div>
                                        <Button onClick={handleCryptoPurchase} disabled={!cryptoTxId || isActionPending} className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-black uppercase text-[10px] rounded-xl shadow-lg">Verify Crypto Payment</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Wallet View */}
                        {checkoutMode === 'wallet' && (
                            <div className="w-full max-w-md bg-black/40 rounded-[32px] p-8 border border-white/5 animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center text-center gap-8">
                                <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10 shadow-2xl">
                                    <Wallet className="h-10 w-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Internal Wallet</h3>
                                    <p className="text-gray-400 text-sm">Activate instantly using your balance.</p>
                                </div>
                                <div className="w-full p-6 bg-black/60 rounded-3xl border border-white/5 flex items-center justify-between">
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Balance</p>
                                        <p className="text-xl font-bold text-white">₹{profile.wallet_balance.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Cost</p>
                                        <p className="text-xl font-bold text-primary">₹{finalPrice.toLocaleString()}</p>
                                    </div>
                                </div>
                                <Button onClick={handleWalletPurchase} disabled={isActionPending || profile.wallet_balance < finalPrice} className="w-full h-14 bg-white text-black font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-105 active:scale-95">
                                    {isActionPending ? <Loader2 className="animate-spin h-5 w-5"/> : 'Initialize Activation'}
                                </Button>
                                {profile.wallet_balance < finalPrice && (
                                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Insufficient balance.</p>
                                )}
                            </div>
                        )}

                        {/* Footer Options */}
                        <div className="flex flex-col items-center gap-4 pt-10 border-t border-white/5 w-full">
                            <p className="text-[9px] font-black text-gray-800 uppercase tracking-[0.4em]">Alternative Protocols</p>
                            <div className="flex flex-wrap justify-center gap-6">
                                {checkoutMode !== 'upi' && (
                                    <button onClick={() => setCheckoutMode('upi')} className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest">
                                        <QrCode className="w-4 h-4" /> Pay with UPI
                                    </button>
                                )}
                                {checkoutMode !== 'crypto' && (
                                    <button onClick={() => setCheckoutMode('crypto')} className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest">
                                        <Coins className="w-4 h-4" /> Pay with USDT
                                    </button>
                                )}
                                {checkoutMode !== 'wallet' && (
                                    <button onClick={() => setCheckoutMode('wallet')} className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest">
                                        <Wallet className="w-4 h-4" /> Use Wallet Balance
                                    </button>
                                )}
                            </div>
                        </div>
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
                    {plans.ptp.map(p => <PlanBox key={p.size} plan={p} category="PassThenPay" />)}
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
