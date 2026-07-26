
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Globe, Timer, TrendingUp, Zap, Sparkles, Coins } from 'lucide-react';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { ClientOnly } from '@/components/ui/client-only';

const forexPlans = [
  { size: '5,000', title: '$5k Forex 2-Step', price: '2,999', usdPrice: '35' },
  { size: '10,000', title: '$10k Forex 2-Step', price: '4,999', usdPrice: '59' },
  { size: '25,000', title: '$25k Forex 2-Step', price: '9,999', usdPrice: '119' },
  { size: '50,000', title: '$50k Forex 2-Step', price: '16,999', usdPrice: '199', isPopular: true },
  { size: '100,000', title: '$100k Forex 2-Step', price: '29,999', usdPrice: '349' },
  { size: '200,000', title: '$200k Forex 2-Step', price: '49,999', usdPrice: '599' },
  { size: '400,000', title: '$400k Forex 2-Step', price: '89,999', usdPrice: '1,079' },
];

const PlanCard = ({ size, title, price, usdPrice, isPopular }: any) => {
  const currentPrice = parseFloat(price.replace(/,/g, ''));
  const originalPrice = currentPrice * 2;
  const [slotsRemaining, setSlotsRemaining] = useState(0);

  useEffect(() => {
    setSlotsRemaining(Math.floor(Math.random() * 20) + 1);
  }, []);

  return (
    <Card className={cn(
        "flex flex-col h-full hover:border-primary transition-all duration-300 bg-card/50 border-border relative", 
        isPopular && "border-primary/50 shadow-2xl shadow-primary/5"
    )}>
      {isPopular && <div className="text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground py-1 rounded-t-lg -mt-px text-center">🏆 Recommended</div>}
      <CardHeader className="pb-4 space-y-4 pt-8">
        <div className="flex justify-between items-start">
            <CardTitle className="text-3xl font-black text-white tracking-tight">${size}</CardTitle>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black uppercase">Forex 2-Step</Badge>
        </div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</p>
        
        <div className="space-y-2">
            <ClientOnly>
                <div className={cn(
                    "flex items-center gap-2 text-[10px] font-bold px-2 py-0.5 rounded border",
                    slotsRemaining < 5 ? "text-red-500 bg-red-500/10 border-red-500/20" : "text-amber-500 bg-amber-500/10 border-amber-500/20"
                )}>
                    <Timer className="h-3 w-3" />
                    <span>HURRY: Only {slotsRemaining} slots remaining</span>
                </div>
            </ClientOnly>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow space-y-6">
        <div className="space-y-3 text-sm border-t border-white/5 pt-4">
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

        <div className="pt-4 border-t border-white/5">
            <div className="flex items-baseline gap-2">
                <span className="text-lg text-gray-600 line-through font-medium">₹{originalPrice.toLocaleString('en-IN')}</span>
                <span className="text-4xl font-black text-primary">₹{currentPrice.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Approx. ${usdPrice} USD</p>
        </div>

        <Button asChild className="w-full mt-auto font-black uppercase tracking-widest h-12 rounded-xl" size="lg">
          <Link href="/signup">Begin Evaluation <Zap className="h-4 w-4 ml-2"/></Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default function ForexPricingPage() {
  return (
    <div className="dark">
      <div className="bg-slate-950 min-h-screen text-foreground pb-24 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full filter blur-[120px] opacity-20" />
        
        <nav className="w-full px-4 md:px-12 py-6 flex items-center justify-between relative z-10">
            <Button asChild variant="ghost" size="sm" className="text-gray-400 hover:text-white rounded-full">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Platform
                </Link>
            </Button>
            <FundedStockLogo className="h-8 w-8 text-primary" />
            <Link href="/login" className="text-xs font-black text-gray-500 hover:text-primary transition-colors uppercase tracking-widest">Login</Link>
        </nav>

        <main className="w-full px-4 md:px-12 relative z-10">
          <div className="text-center mb-20 pt-12 space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-primary/20">
                <Globe className="h-3 w-3" /> Global Forex & Crypto Arena
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white !leading-none uppercase">
                Trade the <br /> <span className="text-primary">World's Markets.</span>
              </h1>
              <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-lg font-medium">
                Access high-fidelity institutional capital for Forex, Commodities, and Crypto. Two-step discipline for global traders.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              <Card className="md:col-span-1 bg-white/5 border-white/5 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <Coins className="h-12 w-12 text-primary opacity-50" />
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Forex Rules</h3>
                  <p className="text-xs text-gray-500 font-medium">10% Drawdown • 8% Target Phase 1 • 5% Target Phase 2</p>
                  <Button variant="outline" asChild className="rounded-full h-8 text-[9px] font-black uppercase tracking-widest border-white/10 bg-white/5">
                      <Link href="/rules/forex-two-step">Full Protocols</Link>
                  </Button>
              </Card>
              {forexPlans.map((plan) => (
                  <PlanCard key={plan.title} {...plan} />
              ))}
          </div>

          <div className="mt-32 text-center">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.5em] mb-4">Trusted by 2,500+ Global Traders</p>
              <div className="flex flex-wrap justify-center gap-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                  <span className="text-2xl font-black">MT5 BRIDGE</span>
                  <span className="text-2xl font-black">GLOBAL LIQUIDITY</span>
                  <span className="text-2xl font-black">FX-CRYPTO HUB</span>
              </div>
          </div>
        </main>
      </div>
    </div>
  );
}
