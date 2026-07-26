'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Globe, Timer, TrendingUp, Zap, Sparkles, ExternalLink, HelpCircle, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { ClientOnly } from '@/components/ui/client-only';

const forexPlans = [
  { size: '5,000', title: '$5k Forex 2-Step', price: '2,999', usdPrice: '35' },
  { size: '10,000', title: '$10k Forex 2-Step', price: '4,999', usdPrice: '60' },
  { size: '25,000', title: '$25k Forex 2-Step', price: '9,999', usdPrice: '120' },
  { size: '50,000', title: '$50k Forex 2-Step', price: '16,999', usdPrice: '200', isPopular: true },
  { size: '100,000', title: '$100k Forex 2-Step', price: '29,999', usdPrice: '350' },
  { size: '200,000', title: '$200k Forex 2-Step', price: '49,999', usdPrice: '600' },
  { size: '400,000', title: '$400k Forex 2-Step', price: '89,999', usdPrice: '1,050' },
];

const LiveViewersBanner = () => {
    const [viewers, setViewers] = useState(0);

    useEffect(() => {
        setViewers(Math.floor(Math.random() * (500 - 100 + 1)) + 100);
        const interval = setInterval(() => {
            setViewers(prev => {
                const change = Math.floor(Math.random() * 7) - 3;
                const next = prev + change;
                return Math.min(Math.max(next, 100), 500);
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    if (viewers === 0) return null;

    return (
        <div className="bg-primary/10 border-b border-primary/20 py-2 overflow-hidden whitespace-nowrap relative">
            <div className="animate-marquee inline-block">
                <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.2em] px-8">
                    🔥 {viewers} are currently viewing this page
                </span>
                <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.2em] px-8">
                    🔥 {viewers} are currently viewing this page
                </span>
                <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.2em] px-8">
                    🔥 {viewers} are currently viewing this page
                </span>
            </div>
            <div className="animate-marquee inline-block" aria-hidden="true">
                <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.2em] px-8">
                    🔥 {viewers} are currently viewing this page
                </span>
                <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.2em] px-8">
                    🔥 {viewers} are currently viewing this page
                </span>
                <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.2em] px-8">
                    🔥 {viewers} are currently viewing this page
                </span>
            </div>
        </div>
    );
};

const PlanCard = ({ size, title, price, usdPrice, isPopular }: any) => {
  const currentPrice = parseFloat(price.replace(/,/g, ''));
  const [slotsRemaining, setSlotsRemaining] = useState(0);

  useEffect(() => {
    setSlotsRemaining(Math.floor(Math.random() * 20) + 1);
  }, []);

  return (
    <Card className={cn(
        "flex flex-col h-full bg-card/40 border-white/5 relative grayscale opacity-70 cursor-not-allowed", 
        isPopular && "border-primary/20 shadow-2xl shadow-primary/5"
    )}>
      <div className="absolute inset-0 bg-slate-950/20 z-10 rounded-lg pointer-events-none"></div>
      
      <CardHeader className="pb-4 space-y-4 pt-8">
        <div className="flex justify-between items-start">
            <CardTitle className="text-3xl font-black text-white tracking-tight">${size}</CardTitle>
            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-amber-500/30 text-amber-500">Provisioning</Badge>
        </div>
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{title}</p>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-grow space-y-6">
        <div className="space-y-3 text-sm border-t border-white/5 pt-4 opacity-50">
            <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">80% Performance Reward</span>
            </div>
            <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Raw Spreads & Low Commissions</span>
            </div>
            <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Fee Refund on 3rd Payout</span>
            </div>
        </div>

        <div className="pt-4 border-t border-white/5 opacity-50">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Activation Fee</p>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">${usdPrice}</span>
            </div>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
                Approx. ₹{currentPrice.toLocaleString('en-IN')}
            </p>
        </div>

        <Button disabled className="w-full mt-auto font-black uppercase tracking-widest h-12 rounded-xl bg-slate-800 text-gray-500 border border-white/5">
           Provisioning Terminal <Loader2 className="h-4 w-4 ml-2 animate-spin"/>
        </Button>
      </CardContent>
    </Card>
  );
};

export default function ForexPricingPage() {
  return (
    <div className="dark">
      <style jsx global>{`
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
        }
        .animate-marquee {
            animation: marquee 40s linear infinite;
        }
      `}</style>
      <div className="bg-background min-h-screen text-foreground pb-24">
        <LiveViewersBanner />
        
        <nav className="w-full px-4 md:px-12 py-6 flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground rounded-full">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                </Link>
            </Button>
            <Link href="/login" className="text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Login to Portal</Link>
        </nav>

        <main className="w-full px-4 md:px-12">
          <div className="text-center mb-16 pt-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-primary/20 mb-6">
                <Globe className="h-3 w-3" /> Global Forex & Crypto Arena
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white !leading-tight">Forex Global Arena</h1>
              <p className="mt-4 text-muted-foreground max-w-4xl mx-auto text-lg">
                Choose the evaluation model that fits your global trading style. <span className="text-amber-500 font-bold underline decoration-dotted">Provisioning of terminal bridges currently in progress.</span>
              </p>
          </div>

          <Tabs defaultValue="2-step" className="w-full">
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto h-auto p-1 bg-muted border border-white/5 rounded-lg mb-16">
                  <TabsTrigger value="instant" className="py-2.5 text-sm font-bold rounded-md">Instant Funding</TabsTrigger>
                  <TabsTrigger value="1-step" className="py-2.5 text-sm font-bold rounded-md">1-Step Fast Track</TabsTrigger>
                  <TabsTrigger value="2-step" className="py-2.5 text-sm font-bold rounded-md flex items-center gap-2">
                    2-Step Standard
                    <Badge variant="destructive" className="text-[8px] h-4 px-1.5 font-black uppercase">🔥 Hot</Badge>
                  </TabsTrigger>
              </TabsList>

              <TabsContent value="instant" className="mt-8 animate-in fade-in duration-500">
                  <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] max-w-4xl mx-auto">
                      <Sparkles className="h-10 w-10 text-primary mx-auto mb-4 opacity-20" />
                      <h3 className="text-2xl font-bold text-white tracking-tight uppercase">Forex Instant is coming.</h3>
                      <p className="text-gray-500 text-xs mt-2 uppercase font-black tracking-widest">Provisioning Liquidity Bridges...</p>
                  </div>
              </TabsContent>

              <TabsContent value="1-step" className="mt-8 animate-in fade-in duration-500">
                   <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] max-w-4xl mx-auto">
                      <Zap className="h-10 w-10 text-primary mx-auto mb-4 opacity-20" />
                      <h3 className="text-2xl font-bold text-white tracking-tight uppercase">1-Phase Model coming soon.</h3>
                      <p className="text-gray-500 text-xs mt-2 uppercase font-black tracking-widest">Risk Review in Progress...</p>
                  </div>
              </TabsContent>
              
              <TabsContent value="2-step" className="mt-8 animate-in fade-in duration-500">
                  <div className="text-center mb-12">
                      <h2 className="text-3xl font-bold text-white tracking-tight">Global 2-Step Standard</h2>
                      <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">Access high-fidelity institutional capital for Forex, Commodities, and Crypto.</p>
                      <div className="flex justify-center mt-6">
                        <Button asChild variant="outline" className="rounded-full bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all px-8 py-1 h-10 text-[10px] font-black uppercase tracking-widest gap-2">
                            <Link href="/rules/forex-two-step"><HelpCircle className="w-4 h-4" /> View Arena Protocols</Link>
                        </Button>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                      {forexPlans.map((plan) => (
                          <PlanCard key={plan.title} {...plan} />
                      ))}
                  </div>
              </TabsContent>
          </Tabs>

          <div className="mt-32 text-center">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.5em] mb-4">Trusted by 2,500+ Global Traders</p>
          </div>
        </main>
      </div>
    </div>
  );
}
