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
    ShieldCheck,
    Globe,
    LayoutGrid,
    Coins,
    Cpu,
    ArrowUpRight,
    AlertTriangle,
    Lock
} from 'lucide-react';
import { purchaseWithWallet, requestManualAccount, validateCoupon, startFreeTrial, initiateGatewayPayment, processCryptoPayment } from './actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
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
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [checkoutStep, setCheckoutStep] = useState<'selection' | 'method' | 'direct-pay' | 'crypto-pay'>('selection');
    const [utr, setUtr] = useState('');
    const [txId, setTxId] = useState('');
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

    const calculateSurchargeAmount = () => {
        return calculateFinalPrice() * 0.25;
    }

    const calculateUpiTotalPrice = () => {
        return calculateFinalPrice() + calculateSurchargeAmount();
    }

    const calculateUsdPrice = () => {
        if (!selectedPlan) return 0;
        if (marketSegment === 'forex') {
            const base = parseFloat(selectedPlan.usdPrice);
            if (discount > 0) return base * (1 - discount / 100);
            return base;
        }
        return parseFloat((calculateFinalPrice() / 96).toFixed(2));
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

    const handleCryptoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!txId.trim()) return;
        
        startTransition(async () => {
            const finalUsd = calculateUsdPrice();
            const res = await processCryptoPayment(profile.id, { ...selectedPlan, price: calculateFinalPrice(), usdPrice: finalUsd.toString() }, txId);
            if (res.error) {
                toast({ title: "Neural Audit Failed", description: res.error, variant: "destructive" });
            } else {
                router.push(`/purchase-success?id=${res.transaction_id}&amount=${res.amount}&plan=${encodeURIComponent(selectedPlan.title)}&method=crypto`);
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
                            <h2 className="text-2xl font-bold text-white tracking-tight">Select Checkout Logic</h2>
                            <p className="text-gray-400 text-sm font-medium">UPI methods include a 25% platform fee. Switch to Crypto to pay 0% fees.</p>
                        </div>

                        {!isPTP && (
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Ticket className="h-3 w-3" /> Promotion Protocol
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
                                {discount > 0 && <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">✓ REDEEMED: {discount}% DISCOUNT APPLIED</p>}
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
                                    <p className="text-base font-bold text-white">Express Wallet Deduction</p>
                                    <p className="text-[11px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1">
                                        <Timer className="w-3 h-3" /> No Fees • Instant Activation
                                    </p>
                                </div>
                            </button>

                            <button 
                                onClick={() => setCheckoutStep('crypto-pay')}
                                className="group flex items-center gap-4 p-6 bg-green-500/10 border border-green-500/30 rounded-3xl text-left transition-all hover:bg-green-500/20 hover:border-green-400 shadow-2xl shadow-green-900/10"
                            >
                                <div className="h-12 w-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                                    <Coins className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-base font-bold text-white">Pay via Crypto (USDT)</p>
                                        <Badge className="bg-green-500 text-white text-[8px] font-black h-4 px-1.5 uppercase">0% FEES</Badge>
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-1">Recommended: Save 25% on fees</p>
                                </div>
                            </button>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
                                <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.3em] text-gray-700">
                                    <span className="bg-slate-950 px-4">UPI Options (+25% Fee)</span>
                                </div>
                            </div>

                            {activeGateway !== 'manual' && activeGateway !== 'cashfree' && (
                                <button 
                                    onClick={handleGatewayPurchase}
                                    disabled={isActionPending}
                                    className="group flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl text-left transition-all hover:bg-white/10 hover:border-primary/50"
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base font-bold text-white">Automated Gateway</p>
                                        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mt-1">Standard UPI • Includes 25% Fee</p>
                                    </div>
                                </button>
                            )}

                            {activeGateway === 'manual' && (
                                <button 
                                    onClick={() => setCheckoutStep('direct-pay')}
                                    className="group flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl text-left transition-all hover:bg-white/10 hover:border-primary/50"
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base font-bold text-white">Manual QR Transfer</p>
                                        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mt-1">Direct Transfer • Includes 25% Fee</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-80 space-y-6">
                        <GlassCard className="p-6 border-primary/20">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Price Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Plan Base Price</span>
                                    <span className="font-bold text-white">₹{calculateFinalPrice().toLocaleString('en-IN')}</span>
                                </div>
                                
                                <div className="pt-4 border-t border-white/5 space-y-2">
                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Final Amount by Method</p>
                                    <div className="flex justify-between items-center text-xs font-bold text-green-400">
                                        <span>Crypto / Wallet</span>
                                        <span>₹{calculateFinalPrice().toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold text-amber-500">
                                        <span>UPI (+25% Fee)</span>
                                        <span>₹{calculateUpiTotalPrice().toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 bg-primary/5 -mx-6 px-6 py-4 flex flex-col gap-1 items-center text-center">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">You Pay Today (USDT)</p>
                                    <p className="text-3xl font-black text-white">{calculateUsdPrice()} <span className="text-sm opacity-40">USDT</span></p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        );
    }

    if (checkoutStep === 'crypto-pay') {
        const finalUsdt = calculateUsdPrice();
        const walletAddress = paymentSettings?.usdt_wallet_address || 'T...';

        return (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95 font-poppins">
                <button onClick={() => setCheckoutStep('method')} className="flex items-center text-gray-500 hover:text-white font-bold p-0 h-auto transition-colors">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </button>

                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Zero-Fee Crypto Checkout</h2>
                    <p className="text-gray-400 text-sm font-medium">Redeem your plan instantly with USDT (TRC-20).</p>
                </div>

                <GlassCard className="p-0 border-green-500/20 bg-green-500/5">
                    <div className="flex flex-col md:flex-row">
                        <div className="p-8 bg-black/40 border-b md:border-b-0 md:border-r border-white/10 w-full md:w-[320px] shrink-0 flex flex-col gap-8">
                            <div className="space-y-1.5 text-center">
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Fixed Parity Amount</p>
                                <p className="text-4xl font-black text-green-400 tracking-tight">{finalUsdt} <span className="text-sm font-bold opacity-50">USDT</span></p>
                                <div className="inline-block bg-white/5 px-2 py-0.5 rounded text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                    {marketSegment === 'indian' ? 'INR / 96 Parity' : '1 USD = 1 USDT'}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest text-center">Transfer to Address (TRC-20)</p>
                                    <div className="p-4 bg-black/60 rounded-2xl border border-white/10 break-all text-xs font-mono font-bold text-white leading-relaxed text-center">
                                        {walletAddress}
                                    </div>
                                    <Button variant="outline" className="w-full h-11 rounded-xl border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest gap-2" onClick={() => { navigator.clipboard.writeText(walletAddress); toast({title: "Address Copied"}); }}>
                                        <Copy className="h-3.5 w-3.5" /> Copy Secure Address
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-8 flex flex-col justify-center space-y-8">
                            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex gap-4 items-center">
                                <div className="p-2 rounded-xl bg-primary/20 text-primary">
                                    <Cpu className="h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Neural Verification Active</p>
                                    <p className="text-[11px] text-gray-400 font-medium">The system will audit the blockchain instantly upon submission.</p>
                                </div>
                            </div>

                            <form onSubmit={handleCryptoSubmit} className="space-y-6">
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Transaction Hash (TxID)</Label>
                                    <Input 
                                        placeholder="Paste the 64-character hash here" 
                                        value={txId} 
                                        onChange={(e) => setTxId(e.target.value)} 
                                        required 
                                        className="bg-black/20 border-white/10 text-white h-14 font-mono text-sm focus:ring-green-500/50 rounded-2xl px-5" 
                                    />
                                </div>
                                <Button type="submit" disabled={isActionPending || !txId} className="w-full h-16 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-900/20 text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95">
                                    {isActionPending ? <><Loader2 className="animate-spin mr-3 h-5 w-5"/> Executing Audit...</> : <><ShieldCheck className="mr-3 h-5 w-5"/> Run Verification</>}
                                </Button>
                            </form>

                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3">
                                <Info className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                                <p className="text-[9px] text-gray-500 font-medium leading-relaxed uppercase tracking-tighter">Only send USDT via the TRON network (TRC-20). Sending assets via any other network will result in permanent loss.</p>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        );
    }

    if (checkoutStep === 'direct-pay') {
        const isPTP = selectedPlan.title.toLowerCase().includes('ptp');
        const upiId = isPTP ? paymentSettings?.pay_later_upi_id : paymentSettings?.upi_id;
        const qrUrl = isPTP ? paymentSettings?.pay_later_qr_code_url : paymentSettings?.qr_code_url;
        const finalUpiPrice = calculateUpiTotalPrice();

        return (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <button onClick={() => setCheckoutStep('method')} className="flex items-center text-gray-500 hover:text-white font-bold p-0 h-auto transition-colors">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </button>

                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Manual UPI Purchase</h2>
                    <p className="text-gray-400 text-sm font-medium">Includes 25% transaction fee. Verifies in ~30 minutes.</p>
                </div>

                <GlassCard className="p-0 border-primary/20">
                    <div className="flex flex-col md:flex-row">
                        <div className="p-8 bg-white/[0.03] border-b md:border-b-0 md:border-r border-white/10 w-full md:w-[280px] shrink-0 flex flex-col items-center justify-center gap-6 text-center">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Pay Exactly</p>
                                <p className="text-3xl font-bold text-primary tracking-tight">₹{finalUpiPrice.toLocaleString('en-IN')}</p>
                            </div>

                            <div className="bg-white p-2 rounded-xl shadow-2xl">
                                {qrUrl ? (
                                    <Image src={qrUrl} alt="Payment QR" width={140} height={140} />
                                ) : (
                                    <div className="w-[140px] h-[140px] flex items-center justify-center text-slate-900 font-bold text-[10px]">QR Loading...</div>
                                )}
                            </div>
                            
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">UPI ID</p>
                                <div className="flex items-center gap-2 justify-center">
                                    <p className="font-mono text-[10px] font-bold text-white truncate max-w-[140px]">{upiId || 'pay@fundedstock'}</p>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-600 hover:text-white" onClick={() => { navigator.clipboard.writeText(upiId || ''); toast({title: "Copied"}); }}><Copy className="w-3.5 h-3.5"/></Button>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleDirectSubmit} className="flex-1 p-8 flex flex-col justify-center space-y-6">
                            <div className="space-y-3">
                                <Label className="text-11px] font-bold text-gray-500 uppercase tracking-widest">Transaction Reference (UTR)</Label>
                                <Input 
                                    placeholder="Enter 12-digit UPI reference" 
                                    value={utr} 
                                    onChange={(e) => setUtr(e.target.value)} 
                                    required 
                                    className="bg-black/20 border-white/10 text-white h-12 font-mono text-base focus:ring-primary/50" 
                                />
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium bg-white/5 p-2 rounded-lg border border-white/5">
                                    <CheckCircle className="h-3 w-3 text-green-500"/>
                                    Account activated manually by admin review.
                                </div>
                            </div>
                            <Button type="submit" disabled={isActionPending || !utr} className="w-full h-12 font-bold rounded-xl shadow-xl shadow-primary/20 text-xs uppercase tracking-widest">
                                {isActionPending ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null}
                                Submit for Verification
                            </Button>
                        </form>
                    </div>
                </GlassCard>
            </div>
        );
    }

    const PlanBox = ({ plan, category, locked = false }: { plan: any, category: string, locked?: boolean }) => (
        <Card className={cn(
            "bg-card/50 transition-all duration-300 flex flex-col h-full border-border/50 group relative overflow-visible",
            plan.isFlashSale && "border-primary border-2 shadow-[0_0_30px_rgba(139,44,245,0.2)] bg-primary/5 scale-[1.02]",
            locked && "grayscale opacity-70 cursor-not-allowed border-white/5"
        )}>
            {plan.isFlashSale && !locked && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1 rounded-full z-10 whitespace-nowrap shadow-lg">
                    Special Event
                </div>
            )}
            {locked && (
                <div className="absolute top-2 right-2 z-20">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] font-black uppercase">Under Sync</Badge>
                </div>
            )}
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className={cn("text-lg font-bold", plan.isFlashSale && "text-primary text-xl")}>
                            {marketSegment === 'forex' ? `$${plan.size}` : `₹${plan.size}`}
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-gray-400 mt-1">{category}</CardDescription>
                    </div>
                    {!locked && <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] font-bold px-1.5">80% Split</Badge>}
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
                        <span>Overall Drawdown: 10%</span>
                    </div>
                </div>
                <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Buy Price</p>
                    <div className="flex items-baseline gap-2">
                        <p className={cn("text-xl font-bold text-primary mt-0.5 transition-transform origin-left", !locked && "group-hover:scale-105", plan.isFlashSale && "text-2xl text-white")}>
                            {marketSegment === 'forex' ? `$${plan.usdPrice}` : `₹${plan.price}`}
                        </p>
                    </div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Starting Balance Fee</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button 
                    disabled={locked}
                    onClick={() => { setSelectedPlan(plan); setCheckoutStep('method'); }} 
                    className={cn("w-full font-bold h-10 rounded-xl text-xs shadow-lg uppercase tracking-widest", plan.isFlashSale ? "bg-white text-black hover:bg-gray-100" : "", locked && "bg-slate-800 text-gray-600 border-none")}
                >
                    {locked ? (
                        <span className="flex items-center gap-2">Provisioning Hub <Loader2 className="w-3 h-3 animate-spin"/></span>
                    ) : "Get Funded"}
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                        {marketSegment === 'forex' ? 'Forex Global Arena' : 'Indian Market'}
                    </h2>
                    <p className="text-gray-400 text-sm font-medium">
                        {marketSegment === 'forex' 
                            ? 'Forex terminal bridges are being synchronized. Plans locked during sync.' 
                            : 'Select your specialization and secure institutional funding.'}
                    </p>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-2xl p-1 flex items-center h-12 shadow-2xl">
                    <button 
                        onClick={() => setMarketSegment('indian')}
                        className={cn(
                            "flex items-center gap-2 px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            marketSegment === 'indian' ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Indian Market
                    </button>
                    <button 
                        onClick={() => setMarketSegment('forex')}
                        className={cn(
                            "flex items-center gap-2 px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            marketSegment === 'forex' ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        <Globe className="w-3.5 h-3.5" />
                        Forex Arena
                    </button>
                </div>
            </div>

            {marketSegment === 'indian' ? (
                <Tabs defaultValue="instant" className="w-full">
                    <TabsList className={cn("grid w-full max-w-2xl mx-auto h-auto p-1 bg-black/40 border border-white/10 rounded-2xl mb-10", isPtpActive ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
                        <TabsTrigger value="instant" className="py-2.5 rounded-xl font-bold text-xs">Instant</TabsTrigger>
                        <TabsTrigger value="oneStep" className="py-2.5 rounded-xl font-bold text-xs">1-Step</TabsTrigger>
                        <TabsTrigger value="twoStep" className="py-2.5 rounded-xl font-bold text-xs">2-Step</TabsTrigger>
                        {isPtpActive && <TabsTrigger value="ptp" className="py-2.5 rounded-xl font-bold text-xs">PTP</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="instant" className="animate-in fade-in zoom-in-95">
                        <div className="flex justify-center mb-8"><Button asChild variant="outline" className="rounded-full bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all px-6 py-1 h-9 text-xs font-bold gap-2"><Link href="/rules/instant-funding"><HelpCircle className="w-3.5 h-3.5" /> Rules</Link></Button></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{plans.instant.map(p => <PlanBox key={p.title} plan={p} category="Instant" />)}</div>
                    </TabsContent>
                    <TabsContent value="oneStep" className="animate-in fade-in zoom-in-95">
                        <div className="flex justify-center mb-8"><Button asChild variant="outline" className="rounded-full bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all px-6 py-1 h-9 text-xs font-bold gap-2"><Link href="/rules/one-step"><HelpCircle className="w-3.5 h-3.5" /> Rules</Link></Button></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{plans.oneStep.map(p => <PlanBox key={p.title} plan={p} category="1-Step" />)}</div>
                    </TabsContent>
                    <TabsContent value="twoStep" className="animate-in fade-in zoom-in-95">
                        <div className="flex justify-center mb-8"><Button asChild variant="outline" className="rounded-full bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all px-6 py-1 h-9 text-xs font-bold gap-2"><Link href="/rules/two-step-evaluation"><HelpCircle className="w-3.5 h-3.5" /> Rules</Link></Button></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{plans.twoStep.map(p => <PlanBox key={p.title} plan={p} category="2-Step" />)}</div>
                    </TabsContent>
                    {isPtpActive && (
                        <TabsContent value="ptp" className="animate-in fade-in zoom-in-95">
                            <div className="flex justify-center mb-8"><Button asChild variant="outline" className="rounded-full bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all px-6 py-1 h-9 text-xs font-bold gap-2"><Link href="/pass-then-pay"><HelpCircle className="w-3.5 h-3.5" /> PTP Info</Link></Button></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{plans.ptp.map(p => <PlanBox key={p.title} plan={p} category="PTP" />)}</div>
                        </TabsContent>
                    )}
                </Tabs>
            ) : (
                <Tabs defaultValue="twoStep" className="w-full">
                    <TabsList className="grid w-full max-w-2xl mx-auto h-auto p-1 bg-black/40 border border-white/10 rounded-2xl mb-10">
                        <TabsTrigger value="instant" className="py-2.5 rounded-xl font-bold text-xs">Instant</TabsTrigger>
                        <TabsTrigger value="oneStep" className="py-2.5 rounded-xl font-bold text-xs">1-Step</TabsTrigger>
                        <TabsTrigger value="twoStep" className="py-2.5 rounded-xl font-bold text-xs">2-Step</TabsTrigger>
                    </TabsList>

                    <TabsContent value="twoStep" className="animate-in fade-in zoom-in-95">
                        <div className="flex justify-center mb-8"><Button asChild variant="outline" className="rounded-full bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all px-8 py-1 h-10 text-[10px] font-black uppercase tracking-widest gap-2"><Link href="/rules/forex-two-step"><Coins className="w-4 h-4" /> Global Protocols</Link></Button></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{plans.forex.map(p => <PlanBox key={p.title} plan={p} category="Forex 2-Step" locked />)}</div>
                    </TabsContent>

                    <TabsContent value="instant" className="py-20 text-center"><Sparkles className="h-10 w-10 text-primary mx-auto mb-4 opacity-20"/><h3 className="text-2xl font-bold text-white uppercase">Forex Instant Coming Soon</h3></TabsContent>
                    <TabsContent value="oneStep" className="py-20 text-center"><Zap className="h-10 w-10 text-primary mx-auto mb-4 opacity-20"/><h3 className="text-2xl font-bold text-white uppercase">1-Step Model Development</h3></TabsContent>
                </Tabs>
            )}

            {/* Free Trial Banner */}
            <div className="pt-12">
                <GlassCard className="relative p-8 md:p-12 border-primary/30 bg-primary/5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group">
                    <div className="space-y-4 text-center md:text-left relative z-10">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2"><Badge className="bg-primary/20 text-primary border-primary/20 px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">Broker Hub Trial</Badge></div>
                        <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter">Experience the Platform. <span className="text-primary">48h Free Trial.</span></h3>
                        <p className="text-gray-400 max-w-md text-base font-medium">Test our institutional terminal with ₹5 Lakh simulated capital before buying.</p>
                    </div>
                    <Button onClick={handleStartTrial} disabled={isStartingTrial} className="w-full md:w-auto h-16 px-12 rounded-2xl bg-white text-black hover:bg-gray-100 font-black uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(255,255,255,0.2)] text-xs">{isStartingTrial ? <Loader2 className="h-5 w-5 animate-spin"/> : "Start Trial Session"}</Button>
                </GlassCard>
            </div>
        </div>
    );
}
