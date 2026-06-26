
'use client';

import { useState } from 'react';
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
    ExternalLink
} from 'lucide-react';
import { purchaseWithWallet } from './actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const plans = {
    instant: [
        { size: '1 Lakh', price: '5,999', title: '1L Instant Funding' },
        { size: '2 Lakh', price: '9,999', title: '2L Instant Funding' },
        { size: '5 Lakh', price: '17,999', title: '5L Instant Funding' },
        { size: '10 Lakh', price: '28,999', title: '10L Instant Funding' },
        { size: '25 Lakh', price: '49,500', title: '25L Instant Funding' },
    ],
    oneStep: [
        { size: '1 Lakh', price: '4,599', title: '1L 1-Step Fast Track' },
        { size: '2 Lakh', price: '7,599', title: '2L 1-Step Fast Track' },
        { size: '5 Lakh', price: '12,599', title: '5L 1-Step Fast Track' },
        { size: '10 Lakh', price: '19,599', title: '10L 1-Step Fast Track' },
        { size: '25 Lakh', price: '34,999', title: '25L 1-Step Fast Track' },
        { size: '50 Lakh', price: '54,999', title: '50L 1-Step Fast Track' },
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
        { size: '5 Lakh', price: '199', title: '5L PassThenPay' },
        { size: '10 Lakh', price: '299', title: '10L PassThenPay' },
        { size: '25 Lakh', price: '399', title: '25L PassThenPay' },
        { size: '50 Lakh', price: '499', title: '50L PassThenPay' },
    ]
};

export function ArenaView({ profile, onSwitchToWallet }: { profile: any, onSwitchToWallet: () => void }) {
    const { toast } = useToast();
    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

    const handlePurchase = async (plan: any) => {
        const price = parseFloat(plan.price.replace(/,/g, ''));
        if (profile.wallet_balance < price) {
            toast({ 
                title: "Insufficient Balance", 
                description: `You need ₹${(price - profile.wallet_balance).toLocaleString('en-IN')} more. Top up your wallet to continue.`,
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
            toast({ title: "Account Secured!", description: "Your purchase is complete. Verification is in progress." });
        }
        setIsPurchasing(null);
    };

    const PlanBox = ({ plan, category }: { plan: any, category: string }) => (
        <Card className="bg-card/50 hover:border-primary transition-all duration-300 flex flex-col h-full border-border/50">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl font-bold">₹{plan.size}</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-widest font-semibold mt-1">{category}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">80% SHARE</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="space-y-2 text-sm border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Target: {category === 'Instant' ? '0%' : category.includes('PTP') ? '6%' : '10%'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Max Drawdown: 10%</span>
                    </div>
                </div>
                <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Price</p>
                    <p className="text-3xl font-bold text-primary">₹{plan.price}</p>
                    <Badge variant="destructive" className="mt-2 text-[9px] font-bold tracking-widest">50% DISCOUNT APPLIED</Badge>
                </div>
            </CardContent>
            <CardFooter>
                <Button 
                    onClick={() => handlePurchase(plan)} 
                    disabled={isPurchasing !== null}
                    className="w-full font-bold uppercase tracking-widest"
                >
                    {isPurchasing === plan.title ? <Loader2 className="animate-spin h-4 w-4" /> : 'Buy Account'}
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="space-y-12">
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-extrabold text-white tracking-tight">The Arena</h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">Purchase funding protocols instantly using your wallet balance.</p>
            </div>

            <Tabs defaultValue="instant" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-3xl mx-auto h-auto p-1 bg-black/40 border border-white/5 rounded-xl mb-12">
                    <TabsTrigger value="instant" className="py-2.5 rounded-lg">Instant</TabsTrigger>
                    <TabsTrigger value="oneStep" className="py-2.5 rounded-lg">1-Step</TabsTrigger>
                    <TabsTrigger value="twoStep" className="py-2.5 rounded-lg">2-Step</TabsTrigger>
                    <TabsTrigger value="ptp" className="py-2.5 rounded-lg">PassThenPay</TabsTrigger>
                </TabsList>

                <TabsContent value="instant" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95">
                    {plans.instant.map(p => <PlanBox key={p.title} plan={p} category="Instant Funding" />)}
                </TabsContent>
                <TabsContent value="oneStep" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95">
                    {plans.oneStep.map(p => <PlanBox key={p.title} plan={p} category="1-Step Fast Track" />)}
                </TabsContent>
                <TabsContent value="twoStep" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95">
                    {plans.twoStep.map(p => <PlanBox key={p.title} plan={p} category="2-Step Standard" />)}
                </TabsContent>
                <TabsContent value="ptp" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in zoom-in-95">
                    {plans.ptp.map(p => <PlanBox key={p.title} plan={p} category="PassThenPay" />)}
                </TabsContent>
            </Tabs>
        </div>
    );
}
