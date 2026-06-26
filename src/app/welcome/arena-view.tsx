'use client';

import { useState, useTransition } from 'react';
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
    Send
} from 'lucide-react';
import { purchaseWithWallet } from './actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
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
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <Button variant="ghost" onClick={() => setCheckoutStep('selection')} className="text-gray-500 hover:text-white font-bold p-0 h-auto mb-2">
                    <ArrowRight className="rotate-180 mr-2 h-4 w-4" /> Back to Plans
                </Button>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Select Payment Method</h2>
                    <p className="text-gray-400 text-base font-medium">Choose how you want to pay for {selectedPlan.title}.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <GlassCard className="p-6 flex flex-col items-center text-center space-y-4 hover:border-primary transition-all group">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-white">Wallet Balance</h3>
                            <p className="text-xs text-gray-500 font-medium">Available: ₹{Number(profile.wallet_balance).toLocaleString('en-IN')}</p>
                        </div>
                        <Button onClick={handleWalletPurchase} disabled={isActionPending} className="w-full h-11 font-bold rounded-xl text-sm">
                            {isActionPending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Pay via Wallet'}
                        </Button>
                    </GlassCard>

                    <GlassCard className="p-6 flex flex-col items-center text-center space-y-4 hover:border-primary transition-all group">
                        <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-white">Direct Payment</h3>
                            <p className="text-xs text-gray-500 font-medium">UPI / Automatic Gateway</p>
                        </div>
                        <Button onClick={() => setCheckoutStep('direct-pay')} variant="outline" className="w-full h-11 font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm">
                            Pay Directly
                        </Button>
                    </GlassCard>
                </div>
            </div>
        );
    }

    if (checkoutStep === 'direct-pay') {
        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <Button variant="ghost" onClick={() => setCheckoutStep('method')} className="text-gray-500 hover:text-white font-bold p-0 h-auto mb-2">
                    <ArrowRight className="rotate-180 mr-2 h-4 w-4" /> Back
                </Button>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Direct Purchase</h2>
                    <p className="text-gray-400 text-base font-medium">Scan QR to pay ₹{selectedPlan.price} and enter Transaction ID.</p>
                </div>

                <GlassCard className="p-6 border-primary/20 bg-primary/5">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-white p-2 rounded-2xl shadow-2xl">
                                {paymentSettings?.qr_code_url ? (
                                    <Image src={paymentSettings.qr_code_url} alt="Payment QR" width={140} height={140} />
                                ) : (
                                    <div className="w-[140px] h-[140px] flex items-center justify-center text-slate-950 font-bold text-xs">QR Loading...</div>
                                )}
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] text-gray-500 font-semibold mb-1">Transfer ID</p>
                                <p className="font-mono text-xs font-bold text-white">{paymentSettings?.upi_id || 'pay@fundedstock'}</p>
                            </div>
                        </div>
                        <form onSubmit={handleDirectSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-semibold text-gray-500">Transaction ID (UTR)</Label>
                                <Input 
                                    placeholder="Enter 12-digit ID" 
                                    value={utr} 
                                    onChange={(e) => setUtr(e.target.value)} 
                                    required 
                                    className="bg-black/40 border-white/10 h-11 text-white text-sm" 
                                />
                            </div>
                            <Button type="submit" className="w-full h-11 font-bold rounded-xl text-sm shadow-xl shadow-primary/20">
                                Confirm & Activate
                            </Button>
                        </form>
                    </div>
                </GlassCard>
            </div>
        );
    }

    const PlanBox = ({ plan, category }: { plan: any, category: string }) => (
        <Card className="bg-card/50 hover:border-primary transition-all duration-300 flex flex-col h-full border-border/50">
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
                    <p className="text-[11px] font-semibold text-gray-500">Capital Fee</p>
                    <p className="text-xl font-bold text-primary mt-0.5">₹{plan.price}</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button 
                    onClick={() => { setSelectedPlan(plan); setCheckoutStep('method'); }} 
                    className="w-full font-bold h-10 rounded-xl text-xs"
                >
                    Activate Now
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">Get Funded</h2>
                <p className="text-gray-400 text-base mt-1 font-medium">Select your path to instant capital and professional scaling.</p>
            </div>

            <Tabs defaultValue="instant" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-2xl mx-auto h-auto p-1 bg-black/40 border border-white/10 rounded-2xl mb-12">
                    <TabsTrigger value="instant" className="py-2.5 rounded-xl font-bold text-xs">Instant</TabsTrigger>
                    <TabsTrigger value="oneStep" className="py-2.5 rounded-xl font-bold text-xs">1-Step</TabsTrigger>
                    <TabsTrigger value="twoStep" className="py-2.5 rounded-xl font-bold text-xs">2-Step</TabsTrigger>
                    <TabsTrigger value="ptp" className="py-2.5 rounded-xl font-bold text-xs">PTP</TabsTrigger>
                </TabsList>

                <TabsContent value="instant" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in zoom-in-95">
                    {plans.instant.map(p => <PlanBox key={p.title} plan={p} category="Instant" />)}
                </TabsContent>
                <TabsContent value="oneStep" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in zoom-in-95">
                    {plans.oneStep.map(p => <PlanBox key={p.title} plan={p} category="1-Step" />)}
                </TabsContent>
                <TabsContent value="twoStep" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in zoom-in-95">
                    {plans.twoStep.map(p => <PlanBox key={p.title} plan={p} category="2-Step" />)}
                </TabsContent>
                <TabsContent value="ptp" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-in fade-in zoom-in-95">
                    {plans.ptp.map(p => <PlanBox key={p.title} plan={p} category="PTP" />)}
                </TabsContent>
            </Tabs>
        </div>
    );
}