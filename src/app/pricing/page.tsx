
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, ExternalLink, Star, Users, Zap, Timer, TrendingUp } from 'lucide-react';
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
        <div className="bg-primary/10 border-b border-primary/20 py-2 overflow-hidden whitespace-nowrap group relative">
            <div className="animate-marquee inline-block">
                <span className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.2em] px-8">
                    🔥 {viewers} traders are currently viewing this page
                </span>
                <span className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.2em] px-8">
                    ⚡ High demand detected for Instant Funding slots
                </span>
                <span className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.2em] px-8">
                    🏆 Join {Math.floor(viewers * 0.8)} others aiming for funding today
                </span>
            </div>
            <div className="animate-marquee inline-block" aria-hidden="true">
                <span className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.2em] px-8">
                    🔥 {viewers} traders are currently viewing this page
                </span>
                <span className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.2em] px-8">
                    ⚡ High demand detected for Instant Funding slots
                </span>
                <span className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.2em] px-8">
                    🏆 Join {Math.floor(viewers * 0.8)} others aiming for funding today
                </span>
            </div>
        </div>
    );
};

const PlanCard = ({ size, title, price, isPopular, isHighlighted }: { size: string; title: string; price: string, isPopular?: boolean, isHighlighted?: boolean }) => {
  const currentPrice = parseFloat(price.replace(/,/g, ''));
  const originalPrice = currentPrice * 2;
  const [purchasedToday, setPurchasedToday] = useState(0);
  const [slotsRemaining, setSlotsRemaining] = useState(0);

  useEffect(() => {
    setPurchasedToday(Math.floor(Math.random() * 70) + 1);
    setSlotsRemaining(Math.floor(Math.random() * 80) + 1);
  }, []);

  return (
    <div className={cn('relative flex flex-col', isHighlighted && 'glowing-border-wrapper rounded-lg')}>
      <Card className={cn("flex flex-col h-full hover:shadow-lg transition-all duration-300 bg-card/80 backdrop-blur-sm border-border group", isHighlighted && "border-primary")}>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap gap-2">
            {isPopular && <Badge variant="destructive" className="font-black text-[10px] tracking-tighter">🔥 POPULAR</Badge>}
            {isHighlighted && <Badge className="font-black text-[10px] tracking-tighter">🎉 TRY FIRST</Badge>}
          </div>
          <CardTitle className="text-3xl font-black pt-2 tracking-tighter">₹{size}</CardTitle>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{title}</p>
          
          <div className="space-y-1.5 pt-4">
              <ClientOnly>
                <div className="flex items-center gap-2 text-xs font-bold text-green-500 bg-green-500/10 w-fit px-2.5 py-1 rounded-full border border-green-500/20">
                    <TrendingUp className="h-3 w-3" />
                    <span>{purchasedToday} purchased today</span>
                </div>
                <div className={cn(
                    "flex items-center gap-2 text-xs font-bold px-2.5 py-1 rounded-full border",
                    slotsRemaining < 15 
                        ? "text-red-500 bg-red-500/10 border-red-500/20 animate-pulse" 
                        : "text-amber-500 bg-amber-500/10 border-amber-500/20"
                )}>
                    <Timer className="h-3 w-3" />
                    <span>Only {slotsRemaining} slots remaining</span>
                </div>
              </ClientOnly>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow justify-between space-y-6">
          <div className="space-y-3 text-sm">
            {isHighlighted ? (
              <>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Limited slots available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Real trading experience at the lowest entry</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Full Fee Refund On 3rd Payout</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">80% Profit Share</span>
                </div>
              </>
            )}
          </div>
           <div className="text-center space-y-2 pt-4 border-t border-white/5">
              <Badge variant="destructive" className="animate-pulse font-black text-[9px] tracking-widest">LIMITED TIME - 50% OFF</Badge>
              <div className="flex items-center justify-center gap-2">
                  <span className="text-xl text-muted-foreground line-through font-medium">
                      ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-4xl font-black text-primary tracking-tighter">
                      ₹{currentPrice.toLocaleString('en-IN')}
                  </span>
              </div>
            </div>
          <Button asChild className="w-full mt-auto h-12 text-sm font-black uppercase tracking-widest rounded-xl shadow-xl transition-all active:scale-95" size="lg">
            <Link href={`/signup?plan=${encodeURIComponent(title)}&price=${price}`}>Get Funded Now <ArrowLeft className="rotate-180 h-4 w-4 ml-2"/></Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


export default function PricingPage() {
  return (
    <div className="dark">
      <style jsx global>{`
        @keyframes glowing {
          0% { border-color: hsl(var(--primary)); box-shadow: 0 0 5px hsl(var(--primary) / 0.8); }
          50% { border-color: hsl(var(--accent-foreground)); box-shadow: 0 0 20px hsl(var(--accent-foreground) / 0.8); }
          100% { border-color: hsl(var(--primary)); box-shadow: 0 0 5px hsl(var(--primary) / 0.8); }
        }
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
        }
        .animate-marquee {
            animation: marquee 30s linear infinite;
        }
        .glowing-border-wrapper {
          padding: 2px;
          animation: glowing 3s linear infinite;
        }
      `}</style>
      <div className="bg-slate-950 min-h-screen text-foreground font-poppins pb-24">
        <LiveViewersBanner />
        
        <nav className="p-4 flex items-center justify-between">
            <Button asChild variant="outline" size="sm" className="bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
            <Link href="https://www.fundedstock.io/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Site
            </Link>
            </Button>
            <Link href="/welcome" className="text-xs font-bold text-gray-500 hover:text-primary transition-colors">LOGIN TO PORTAL</Link>
        </nav>

        <main className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16 pt-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 mb-6">
                <Zap className="h-3 w-3" /> Select Your Path to Capital
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white !leading-[1.1]">The Arena <br /> <span className="text-primary">is Waiting.</span></h1>
              <p className="mt-6 text-gray-400 max-w-2xl mx-auto text-lg font-medium">
                Proven strategy? Instant funding. Fast learner? 1-Step. Veteran? 2-Step. Pick your size and start earning professional trading fees.
              </p>
          </div>

          <Tabs defaultValue="instant" className="w-full">
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 max-w-2xl mx-auto h-auto p-1.5 bg-white/5 border border-white/10 rounded-2xl mb-16">
                  <div className="relative">
                     <TabsTrigger value="instant" className="py-3 text-sm font-bold w-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black">Instant Funding</TabsTrigger>
                     <Badge variant="destructive" className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[8px] font-black whitespace-nowrap uppercase tracking-widest shadow-xl ring-2 ring-slate-950">
                        Top Choice
                     </Badge>
                  </div>
                  <TabsTrigger value="1-step" className="py-3 text-sm font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black">1-Step Fast Track</TabsTrigger>
                  <TabsTrigger value="2-step" className="py-3 text-sm font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black">2-Step Standard</TabsTrigger>
              </TabsList>

              <TabsContent value="instant" className="mt-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="text-center mb-12">
                      <h2 className="text-3xl font-black text-white tracking-tight">Instant Funding</h2>
                      <p className="mt-3 text-gray-400 max-w-xl mx-auto font-medium">No challenges. No waiting. Trade live capital within 15 minutes of activation.</p>
                      <Button variant="link" asChild className="text-primary font-bold text-sm uppercase tracking-widest mt-2">
                          <Link href="/rules/instant-funding">Execution Rules <ExternalLink className="ml-2 h-4 w-4" /></Link>
                      </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                      {instantFundingPlans.map((plan) => (
                      <PlanCard key={plan.title} {...plan} />
                      ))}
                  </div>
              </TabsContent>

              <TabsContent value="1-step" className="mt-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="text-center mb-12">
                      <h2 className="text-3xl font-black text-white tracking-tight">1-Step Evaluation</h2>
                      <p className="mt-3 text-gray-400 max-w-xl mx-auto font-medium">One single phase. Achieve 10% profit target with no time limits to secure your funded account.</p>
                      <Button variant="link" asChild className="text-primary font-bold text-sm uppercase tracking-widest mt-2">
                          <Link href="/rules/one-step">Phase Rules <ExternalLink className="ml-2 h-4 w-4" /></Link>
                      </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {oneStepPlans.map((plan) => (
                      <PlanCard key={plan.title} {...plan} />
                      ))}
                  </div>
              </TabsContent>
              
              <TabsContent value="2-step" className="mt-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="text-center mb-12">
                      <h2 className="text-3xl font-black text-white tracking-tight">2-Step Standard</h2>
                      <p className="mt-3 text-gray-400 max-w-xl mx-auto font-medium">The industry standard. Prove consistency across two phases to unlock maximum capital leverage.</p>
                      <Button variant="link" asChild className="text-primary font-bold text-sm uppercase tracking-widest mt-2">
                          <Link href="/rules/two-step-evaluation">Phase Rules <ExternalLink className="ml-2 h-4 w-4" /></Link>
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
