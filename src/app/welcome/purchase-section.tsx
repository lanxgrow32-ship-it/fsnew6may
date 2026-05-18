'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, ArrowRight, Wallet, Copy, Send } from 'lucide-react';
import { purchaseNewAccount } from './actions';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const plans = {
    instant: [
        { size: '1 Lakh', price: 5999 },
        { size: '2 Lakh', price: 9999 },
        { size: '5 Lakh', price: 17999 },
        { size: '10 Lakh', price: 28999 },
        { size: '25 Lakh', price: 49500 },
    ],
    oneStep: [
        { size: '1 Lakh', price: 4599 },
        { size: '2 Lakh', price: 7599 },
        { size: '5 Lakh', price: 12599 },
        { size: '10 Lakh', price: 19599 },
        { size: '25 Lakh', price: 34999 },
        { size: '50 Lakh', price: 54999 },
    ],
    twoStep: [
        { size: '1 Lakh', price: 2999 },
        { size: '2 Lakh', price: 4999 },
        { size: '5 Lakh', price: 7999 },
        { size: '10 Lakh', price: 12999 },
        { size: '25 Lakh', price: 21999 },
        { size: '50 Lakh', price: 35999 },
    ],
    passThenPay: [
        { size: '5 Lakh', price: 199 },
        { size: '10 Lakh', price: 299 },
        { size: '25 Lakh', price: 399 },
        { size: '50 Lakh', price: 499 },
    ]
};

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg', className)}>
        {children}
    </div>
);

export function PurchaseSection({ profile }: { profile: any }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [paymentSettings, setPaymentSettings] = useState<any>(null);
    const [utr, setUtr] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('payment_details').select('*').eq('id', 1).single();
            setPaymentSettings(data);
        };
        fetchSettings();
    }, []);

    const handlePurchase = async () => {
        if (!utr || utr.length < 12) {
            toast({ title: "Invalid UTR", description: "Please enter a valid 12-digit transaction ID.", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.append('plan_name', selectedPlan.title);
            formData.append('final_price', String(selectedPlan.price));
            formData.append('utr', utr);

            const res = await purchaseNewAccount(formData);
            if (res.error) {
                toast({ title: "Purchase Failed", description: res.error, variant: "destructive" });
            } else {
                toast({ title: "Purchase Submitted!", description: "Your payment is being verified. Your new account will appear in your hub soon." });
                setSelectedPlan(null);
                setUtr('');
            }
        });
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: "UPI ID copied" });
    };

    const PlanBox = ({ title, size, price, category }: { title: string, size: string, price: number, category: string }) => {
        const originalPrice = price * 2;
        return (
            <div className="bg-black/20 border border-white/5 rounded-xl p-6 flex flex-col justify-between transition-all hover:border-purple-500/50 hover:bg-black/30 group">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{category}</p>
                    <h4 className="text-xl font-bold text-white">₹{size}</h4>
                    <p className="text-gray-400 text-sm mt-1">Evaluation Account</p>
                </div>
                <div className="mt-6 space-y-4">
                    <div className="text-center bg-destructive/10 rounded-md py-1 border border-destructive/20 mb-2">
                        <span className="text-[10px] font-bold text-destructive uppercase">Limited Time 50% Off</span>
                    </div>
                    <div className="flex items-center justify-between">
                         <span className="text-sm text-gray-500 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
                         <div className="flex items-baseline gap-1">
                            <span className="text-sm text-gray-400">₹</span>
                            <span className="text-2xl font-bold text-white">{price.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    <Button onClick={() => setSelectedPlan({ title, price })} className="w-full bg-white/10 hover:bg-purple-600 text-white border border-white/10 hover:border-purple-400 transition-all rounded-lg">Select Plan</Button>
                </div>
            </div>
        );
    }

    if (selectedPlan) {
        const isPTP = selectedPlan.title.toLowerCase().includes('passthenpay');
        const details = isPTP 
            ? { upi: paymentSettings?.pay_later_upi_id, qr: paymentSettings?.pay_later_qr_code_url }
            : { upi: paymentSettings?.upi_id, qr: paymentSettings?.qr_code_url };

        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" onClick={() => setSelectedPlan(null)} className="text-gray-400 hover:text-white"><ArrowRight className="rotate-180 mr-2 w-4 h-4"/> Back to Plans</Button>
                </div>
                <GlassCard className="p-8 border-purple-500/30 bg-purple-600/5">
                    <div className="text-center mb-8">
                        <Badge className="bg-purple-600/20 text-purple-300 mb-2">Final Step</Badge>
                        <h3 className="text-2xl font-bold text-white">Complete Your Purchase</h3>
                        <p className="text-gray-400 mt-1">You are purchasing the <span className="text-white font-bold">{selectedPlan.title}</span></p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-center bg-black/40 rounded-2xl p-6 border border-white/5">
                        <div className="space-y-4">
                            <div className="bg-white p-3 rounded-xl w-fit mx-auto md:mx-0 shadow-2xl">
                                {details.qr ? <Image src={details.qr} alt="UPI QR" width={180} height={180} /> : <div className="w-[180px] h-[180px] flex items-center justify-center text-slate-900 font-bold">QR Loading...</div>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase tracking-widest font-bold">UPI ID</Label>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-mono text-white truncate">{details.upi || 'Loading...'}</p>
                                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(details.upi)} className="h-8 w-8 text-gray-400 hover:text-white"><Copy className="w-3.5 h-3.5"/></Button>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="utr" className="text-gray-300">Transaction ID (UTR)</Label>
                                <Input id="utr" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="12-digit UPI Transaction ID" className="bg-black/50 border-white/10 text-white h-12" />
                            </div>
                            <div className="p-4 bg-purple-600/10 rounded-lg border border-purple-500/20">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Amount to Pay:</span>
                                    <span className="text-xl font-bold text-white">₹{selectedPlan.price.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            <Button onClick={handlePurchase} disabled={isPending || !utr} className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-xl shadow-purple-500/20">
                                {isPending ? <Loader2 className="animate-spin mr-2"/> : <Send className="mr-2 w-4 h-4"/>} Confirm & Submit
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        );
    }

    return (
        <Tabs defaultValue="instant" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-4xl mx-auto h-auto p-1 bg-black/40 border border-white/10 rounded-2xl mb-12">
                <TabsTrigger value="instant" className="py-3 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white">Instant</TabsTrigger>
                <TabsTrigger value="oneStep" className="py-3 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white">1-Step</TabsTrigger>
                <TabsTrigger value="twoStep" className="py-3 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white">2-Step</TabsTrigger>
                <TabsTrigger value="passThenPay" className="py-3 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white">PassThenPay</TabsTrigger>
            </TabsList>

            <TabsContent value="instant" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in zoom-in-95">
                {plans.instant.map(p => <PlanBox key={p.size} title={`${p.size} Instant`} size={p.size} price={p.price} category="Instant Funding" />)}
            </TabsContent>
             <TabsContent value="oneStep" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in zoom-in-95">
                {plans.oneStep.map(p => <PlanBox key={p.size} title={`${p.size} 1-Step`} size={p.size} price={p.price} category="1-Step Fast Track" />)}
            </TabsContent>
             <TabsContent value="twoStep" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in zoom-in-95">
                {plans.twoStep.map(p => <PlanBox key={p.size} title={`${p.size} 2-Step`} size={p.size} price={p.price} category="2-Step Standard" />)}
            </TabsContent>
            <TabsContent value="passThenPay" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in zoom-in-95">
                {plans.passThenPay.map(p => <PlanBox key={p.size} title={`${p.size} PassThenPay`} size={p.size} price={p.price} category="Pay After Passing" />)}
            </TabsContent>
        </Tabs>
    );
}
