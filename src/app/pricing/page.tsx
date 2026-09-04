'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Timer, TrendingUp, Zap, Sparkles, ArrowRight, HelpCircle, Loader2, Star } from 'lucide-react';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { LEGACY_PLANS } from '@/lib/legacy-plans';

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
            </div>
            <div className="animate-marquee inline-block" aria-hidden="true">
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

const PlanCard = ({ size, title, price, isPopular, category, isNew, isLimited, isFeatured }: any) => {
  const currentPrice = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price;
  const originalPrice = currentPrice * 2;
  const isPro = category === 'pro';

  return (
    <Card className={cn(
        "flex flex-col h-full hover:border-primary transition-all duration-300 bg-card/50 border-border relative", 
        isPopular && "border-primary/50 shadow-md shadow-primary/5",
        isPro && "border-primary/30 bg-primary/5",
        isFeatured && "border-primary ring-2 ring-primary/20 shadow-2xl scale-[1.03] z-10"
    )}>
      {isFeatured && (
           <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                <Badge className="bg-primary text-white font-black px-4 py-1 text-[8px] uppercase tracking-widest border-2 border-slate-950">
                    <Star className="w-2.5 h-2.5 mr-1 fill-white" /> Featured
                </Badge>
            </div>
      )}
      
      {isPopular && !isPro && !isFeatured && <div className="text-xs font-bold bg-primary text-primary-foreground py-1 rounded-t-lg -mt-px text-center">🔥 Most Popular</div>}
      
      <CardHeader className="pb-4 space-y-4 pt-8">
        <div className="flex justify-between items-start">
            <div>
                <div className="flex gap-1 flex-wrap mb-1">
                    {isNew && <Badge className="bg-green-600 text-white text-[8px] font-black uppercase px-1.5 h-4">NEW</Badge>}
                    {isLimited && <Badge className="bg-amber-600 text-white text-[8px] font-black uppercase px-1.5 h-4">LIMITED</Badge>}
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">₹{size}</CardTitle>
            </div>
            {isPro && <Badge variant="default" className="bg-primary text-white text-[8px] font-black uppercase px-2 h-4">PRO</Badge>}
        </div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow space-y-6">
        <div className="space-y-3 text-sm border-t border-white/5 pt-4">
            <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">80% Performance Reward</span>
            </div>
            {isPro ? (
                <>
                    <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-primary" />
                        <span className="text-white font-bold">7-Day validity</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-white font-bold">Daily Payouts Enabled</span>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">No Profit Target</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">Refund on 3rd Payout</span>
                    </div>
                </>
            )}
        </div>

        <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Buy Price</p>
            <div className="flex items-baseline gap-2">
                {!isPro && <span className="text-lg text-muted-foreground line-through font-medium">₹{originalPrice.toLocaleString('en-IN')}</span>}
                <span className="text-3xl font-bold text-primary">₹{currentPrice.toLocaleString('en-IN')}</span>
            </div>
            {!isPro && (
                <Badge variant="destructive" className="mt-2 text-[9px] font-bold tracking-widest">
                    LIMITED 50% DISCOUNT
                </Badge>
            )}
        </div>

        <Button asChild className={cn("w-full mt-auto font-bold uppercase tracking-widest", isFeatured && "shadow-xl shadow-primary/20")} size="lg">
          <Link href="/signup">Select Plan <ArrowRight className="h-4 w-4 ml-2"/></Link>
        </Button>
      </CardContent>
    </Card>
  );
}


export default function PricingPage() {
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
      const fetchPlans = async () => {
          const { data } = await supabase
            .from('plans')
            .select('*')
            .eq('market_type', 'indian')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
          
          setDbPlans(data || []);
          setLoading(false);
      };
      fetchPlans();
  }, []);

  const allPlans = useMemo(() => {
      const merged = [...LEGACY_PLANS.filter(p => p.market_type === 'indian'), ...dbPlans];
      // Spotlight Protocol: Sort by is_featured first
      return merged.sort((a, b) => {
          const featA = a.is_featured ? 1 : 0;
          const featB = b.is_featured ? 1 : 0;
          if (featA !== featB) return featB - featA;
          return (a.sort_order || 0) - (b.sort_order || 0);
      });
  }, [dbPlans]);

  // Hide proPlans temporarily
  const proPlans = []; 
  const instantPlans = allPlans.filter(p => p.category === 'instant');
  const oneStepPlans = allPlans.filter(p => p.category === '1-step');
  const twoStepPlans = allPlans.filter(p => p.category === '2-step');

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
                <Link href="https://www.fundedstock.io/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                </Link>
            </Button>
            <Link href="/login" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">LOGIN TO PORTAL</Link>
        </nav>

        <main className="w-full px-4 md:px-12">
          <div className="text-center mb-16 pt-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-primary/20 mb-6">
                <Zap className="h-3 w-3" /> Select Your Path to Capital
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white !leading-tight uppercase">Arena</h1>
              <p className="mt-4 text-muted-foreground max-w-4xl mx-auto text-lg">
                Choose the evaluation model that fits your trading style and secure your funded account today.
              </p>
          </div>

          <Tabs defaultValue="instant" className="w-full">
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto h-auto p-1 bg-muted border border-white/5 rounded-2xl mb-16">
                  {/* Temporarily hidden: ⚡ Instant Pro */}
                  <TabsTrigger value="instant" className="py-3 text-xs font-black uppercase tracking-widest rounded-xl">Standard Instant</TabsTrigger>
                  <TabsTrigger value="1-step" className="py-3 text-xs font-black uppercase tracking-widest rounded-xl">1-Step Fast Track</TabsTrigger>
                  <TabsTrigger value="2-step" className="py-3 text-xs font-black uppercase tracking-widest rounded-xl">2-Step Standard</TabsTrigger>
              </TabsList>

              {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto h-10 w-10 text-primary opacity-20"/></div> : (
                  <>
                    <TabsContent value="instant" className="mt-8 animate-in fade-in duration-500">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white tracking-tight uppercase">Standard Instant Funding</h2>
                            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">No challenges. Trade live capital within 15 minutes of activation.</p>
                            <Button variant="link" asChild className="text-primary font-bold text-xs uppercase tracking-widest mt-4">
                                <Link href="/rules/instant-funding">View Rules <ArrowRight className="ml-2 h-3 w-3" /></Link>
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
                            {instantPlans.map((plan) => (
                            <PlanCard key={plan.id} {...plan} category="instant" />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="1-step" className="mt-8 animate-in fade-in duration-500">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white tracking-tight uppercase">1-Step Evaluation</h2>
                            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">Achieve 10% profit target with no time limits to secure funding.</p>
                            <Button variant="link" asChild className="text-primary font-bold text-xs uppercase tracking-widest mt-4">
                                <Link href="/rules/one-step">View Rules <ArrowRight className="ml-2 h-3 w-3" /></Link>
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {oneStepPlans.map((plan) => (
                            <PlanCard key={plan.id} {...plan} category="1-step" />
                            ))}
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="2-step" className="mt-8 animate-in fade-in duration-500">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white tracking-tight uppercase">2-Step Standard</h2>
                            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">Prove consistency across two phases to unlock maximum leverage.</p>
                            <Button variant="link" asChild className="text-primary font-bold text-xs uppercase tracking-widest mt-4">
                                <Link href="/rules/two-step-evaluation">View Rules <ArrowRight className="ml-2 h-3 w-3" /></Link>
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {twoStepPlans.map((plan) => (
                            <PlanCard key={plan.id} {...plan} category="2-step" />
                            ))}
                        </div>
                    </TabsContent>
                  </>
              )}
          </Tabs>

          <div className="mt-32 text-center">
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] mb-4">Trusted by 4,000+ Global Traders</p>
              <FundedStockLogo className="h-8 w-8 mx-auto opacity-20 grayscale" />
          </div>
        </main>
      </div>
    </div>
  );
}
