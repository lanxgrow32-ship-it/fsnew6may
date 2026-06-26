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

export function ArenaView({ profile, onSwitchToWallet }: { profile: any, onSwitchToWallet: () => void }) {
    const { toast } = useToast();
    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

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
        }
        setIsPurchasing(null);
    };

    const PlanBox = ({ plan, category }: { plan: any, category: string }) => (
        <Card className="bg-card/50 hover:border-primary transition-all duration-300 flex flex-col h-full border-border/50">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl font-bold">₹{plan.size}</CardTitle>
                        <CardDescription className="text-sm font-medium text-gray-500 mt-1">{category}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">80% Share</Badge>
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
                        <span>Drawdown: 10%</span>
                    </div>
                </div>
                <div className="pt-4 border-t border-white/5">
                    <p className="text-xs font-medium text-gray-500">Price</p>
                    <p className="text-2xl font-bold text-primary mt-0.5">₹{plan.price}</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button 
                    onClick={() => handlePurchase(plan)} 
                    disabled={isPurchasing !== null}
                    className="w-full font-bold h-11"
                >
                    {isPurchasing === plan.title ? <Loader2 className="animate-spin h-4 w-4" /> : 'Buy Now'}
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="space-y-12">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">Get Funded</h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">Select a path to start earning performance rewards.</p>
            </div>

            <Tabs defaultValue="instant" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-2xl mx-auto h-auto p-1 bg-black/40 border border-white/10 rounded-2xl mb-12">
                    <TabsTrigger value="instant" className="py-2.5 rounded-xl font-bold text-sm">Instant</TabsTrigger>
                    <TabsTrigger value="oneStep" className="py-2.5 rounded-xl font-bold text-sm">1-Step</TabsTrigger>
                    <TabsTrigger value="twoStep" className="py-2.5 rounded-xl font-bold text-sm">2-Step</TabsTrigger>
                    <TabsTrigger value="ptp" className="py-2.5 rounded-xl font-bold text-sm">PTP</TabsTrigger>
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
            </Tabs>
        </div>
    );
}