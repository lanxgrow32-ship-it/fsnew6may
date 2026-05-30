'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, ExternalLink, Timer, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { ClientOnly } from '@/components/ui/client-only';

const instantFundingPlans = [
  { size: '1,00,000', title: '1L Instant Funding', price: '5,999' },
  { size: '2,00,000', title: '2L Instant Funding', price: '9,999' },
  { size: '5,00,000', title: '5L Instant Funding', price: '17,999' },
  { size: '10,00,000', title: '10L Instant Funding', price: '28,999' },
  { size: '25,00,000', title: '25L Instant Funding', price: '49,500' },
];

const oneStepPlans = [
    { size: '1,00,000', title: '1L 1-Step Fast Track', price: '4,599' },
    { size: '2,00,000', title: '2L 1-Step Fast Track', price: '7,599' },
    { size: '5,00,000', title: '5L 1-Step Fast Track', price: '12,599' },
    { size: '10,00,000', title: '10L 1-Step Fast Track', price: '19,599' },
    { size: '25,00,000', title: '25L 1-Step Fast Track', price: '34,999' },
    { size: '50,00,000', title: '50L 1-Step Fast Track', price: '54,999' },
];

const twoStepPlans = [
    { size: '1,00,000', title: '1L 2-Step', price: '2,999' },
    { size: '2,00,000', title: '2L 2-Step', price: '4,999' },
    { size: '5,00,000', title: '5L 2-Step', price: '7,999' },
    { size: '10,00,000', title: '10L 2-Step', price: '12,999' },
    { size: '25,00,000', title: '25L 2-Step', price: '21,999' },
    { size: '50,00_000', title: '50L 2-Step', price: '35,999' },
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
                    🔥 {viewers} traders are currently viewing this page
                </span>
                <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.2em] px-8">
                    ⚡ High demand detected for Instant Funding slots
                </span>
                <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.2em] px-8">
                    🏆 Join {Math.floor(viewers * 0.8)} others aiming for funding today
                </span>
            </div>
            <div className="animate-marquee inline-block" aria-hidden="true">
                <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.2em] px-8">
                    🔥 {viewers} traders are currently viewing this page
                </span>
                <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.2em] px-8">
                    ⚡ High demand detected for Instant Funding slots
                </span>
                <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.2em] px-8">
                    🏆 Join {Math.floor(viewers * 0.8)} others aiming for funding today
                </span>
            </div>
        </div>
    );
};

const PlanCard = ({ size, title, price, isPopular }: { size: string; title: string; price: string, isPopular?: boolean }) => {
  const currentPrice = parseFloat(price.replace(/,/g, ''));
  const originalPrice = currentPrice * 2;
  const [purchasedToday, setPurchasedToday] = useState(0);
  const [slotsRemaining, setSlotsRemaining] = useState(0);

  useEffect(() => {
    setPurchasedToday(Math.floor(Math.random() * 70) + 1);
    setSlotsRemaining(Math.floor(Math.random() * 80) + 1);
  }, []);

  return (
    <Card className={cn("flex flex-col h-full hover:border-primary transition-all duration-300 bg-card/50 border-border", isPopular && "border-primary/50 shadow-md shadow-primary/5")}>
      <CardHeader className="pb-4 space-y-4">
        <div className="flex justify-between items-start">
            <CardTitle className="text-2xl font-bold tracking-tight">₹{size}</CardTitle>
            {isPopular && <Badge variant="default" className="text-[10px] font-bold">POPULAR</Badge>}
        </div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
        
        <div className="space-y-2">
            <ClientOnly>
                <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 bg-green-500/10 w-fit px-2 py-0.5 rounded border border-green-500/20">
                    <TrendingUp className="h-3 w-3" />
                    <span>{purchasedToday} purchased today</span>
                </div>
                <div className={cn(
                    "flex items-center gap-2 text-[10px] font-bold px-2 py-0.5 rounded border",
                    slotsRemaining < 15 
                        ? "text-red-500 bg-red-500/10 border-red-500/20" 
                        : "text-amber-500 bg-amber-500/10 border-amber-500/20"
                )}>
                    <Timer className="h-3 w-3" />
                    <span>Only {slotsRemaining} slots remaining</span>
                </div>
            </ClientOnly>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow space-y-6">
        <div className="space-y-3 text-sm border-t border-white/5 pt-4">
            <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Full Fee Refund On 3rd Payout</span>
            </div>
            <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">80% Profit Share</span>
            </div>
        </div>

        <div className="pt-4 border-t border-white/5">
            <div className="flex items-baseline gap-2">
                <span className="text-lg text-muted-foreground line-through font-medium">₹{originalPrice.toLocaleString('en-IN')}</span>
                <span className="text-3xl font-bold text-primary">₹{currentPrice.toLocaleString('en-IN')}</span>
            </div>
            <Badge variant="destructive" className="mt-2 text-[9px] font-bold tracking-widest">50% LIMITED DISCOUNT</Badge>
        </div>

        <Button asChild className="w-full mt-auto font-bold uppercase tracking-widest" size="lg">
          <Link href={`/signup?plan=${encodeURIComponent(title)}&price=${price}`}>Select Plan <ArrowLeft className="rotate-180 h-4 w-4 ml-2"/></Link>
        </Button>
      </CardContent>
    </Card>
  );
}


export default function PricingPage() {
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
        
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground rounded-full">
                <Link href="https://www.fundedstock.io/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Website
                </Link>
            </Button>
            <Link href="/login" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">LOGIN TO PORTAL</Link>
        </nav>

        <main className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16 pt-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-primary/20 mb-6">
                <Zap className="h-3 w-3" /> Select Your Path to Capital
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white !leading-tight">The Arena is Waiting.</h1>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">
                Choose the evaluation model that fits your trading style and secure your funded account today.
              </p>
          </div>

          <Tabs defaultValue="instant" className="w-full">
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 max-w-2xl mx-auto h-auto p-1 bg-muted border border-white/5 rounded-lg mb-16">
                  <TabsTrigger value="instant" className="py-2.5 text-sm font-bold rounded-md">Instant Funding</TabsTrigger>
                  <TabsTrigger value="1-step" className="py-2.5 text-sm font-bold rounded-md">1-Step Fast Track</TabsTrigger>
                  <TabsTrigger value="2-step" className="py-2.5 text-sm font-bold rounded-md">2-Step Standard</TabsTrigger>
              </TabsList>

              <TabsContent value="instant" className="mt-8 animate-in fade-in duration-500">
                  <div className="text-center mb-12">
                      <h2 className="text-3xl font-bold text-white tracking-tight">Instant Funding</h2>
                      <p className="mt-2 text-muted-foreground max-w-xl mx-auto">No challenges. Trade live capital within 15 minutes of activation.</p>
                      <Button variant="link" asChild className="text-primary font-bold text-xs uppercase tracking-widest mt-2">
                          <Link href="/rules/instant-funding">Execution Rules <ExternalLink className="ml-2 h-3 w-3" /></Link>
                      </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                      {instantFundingPlans.map((plan) => (
                      <PlanCard key={plan.title} {...plan} />
                      ))}
                  </div>
              </TabsContent>

              <TabsContent value="1-step" className="mt-8 animate-in fade-in duration-500">
                  <div className="text-center mb-12">
                      <h2 className="text-3xl font-bold text-white tracking-tight">1-Step Evaluation</h2>
                      <p className="mt-2 text-muted-foreground max-w-xl mx-auto">Achieve 10% profit target with no time limits to secure funding.</p>
                      <Button variant="link" asChild className="text-primary font-bold text-xs uppercase tracking-widest mt-2">
                          <Link href="/rules/one-step">Phase Rules <ExternalLink className="ml-2 h-3 w-3" /></Link>
                      </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {oneStepPlans.map((plan) => (
                      <PlanCard key={plan.title} {...plan} />
                      ))}
                  </div>
              </TabsContent>
              
              <TabsContent value="2-step" className="mt-8 animate-in fade-in duration-500">
                  <div className="text-center mb-12">
                      <h2 className="text-3xl font-bold text-white tracking-tight">2-Step Standard</h2>
                      <p className="mt-2 text-muted-foreground max-w-xl mx-auto">Prove consistency across two phases to unlock maximum leverage.</p>
                      <Button variant="link" asChild className="text-primary font-bold text-xs uppercase tracking-widest mt-2">
                          <Link href="/rules/two-step-evaluation">Phase Rules <ExternalLink className="ml-2 h-3 w-3" /></Link>
                      </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {twoStepPlans.map((plan) => (
                      <PlanCard key={plan.title} {...plan} />
                      ))}
                  </div>
              </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
