
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Globe, Timer, TrendingUp, Zap, Sparkles, ExternalLink, HelpCircle, Lock, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { ClientOnly } from '@/components/ui/client-only';
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

const PlanCard = ({ size, title, price, usdPrice, isPopular }: any) => {
  const currentPrice = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price;

  return (
    <Card className={cn(
        "flex flex-col h-full bg-card/40 border-white/5 relative hover:border-primary transition-all duration-300", 
        isPopular && "border-primary/50 shadow-2xl shadow-primary/10 scale-[1.02]"
    )}>
      <CardHeader className="pb-4 space-y-4 pt-8">
        <div className="flex justify-between items-start">
            <CardTitle className="text-3xl font-black text-white tracking-tight">${size}</CardTitle>
            {isPopular && <Badge className="bg-primary text-white text-[8px] font-black uppercase px-2 h-4">Most Popular</Badge>}
        </div>
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{title}</p>
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
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Activation Fee</p>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">${usdPrice}</span>
            </div>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
                Approx. ₹{currentPrice.toLocaleString('en-IN')}
            </p>
        </div>

        <Button asChild className="w-full mt-auto font-black uppercase tracking-widest h-12 rounded-xl shadow-xl shadow-primary/20">
           <Link href="/signup">Start Evaluation <ArrowRight className="ml-2 h-4 w-4"/></Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default function ForexPricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
      const fetchPlans = async () => {
          const { data } = await supabase
            .from('plans')
            .select('*')
            .eq('market_type', 'forex')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
          
          const allPlans = [...LEGACY_PLANS.filter(p => p.market_type === 'forex'), ...(data || [])];
          setPlans(allPlans);
          setLoading(false);
      };
      fetchPlans();
  }, []);

  const twoStepPlans = plans.filter(p => p.category === '2-step');
  const oneStepPlans = plans.filter(p => p.category === '1-step');
  const instantPlans = plans.filter(p => p.category === 'instant');

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
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-white rounded-full">
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
                <Globe className="h-3 w-3" /> Global Forex Market
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white !leading-tight uppercase tracking-tighter">Forex Arena</h1>
              <p className="mt-4 text-muted-foreground max-w-4xl mx-auto text-lg font-medium">
                Access deep institutional liquidity for Forex, Commodities, and Crypto. Choose your capital size and start your evaluation.
              </p>
          </div>

          <Tabs defaultValue="2-step" className="w-full">
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto h-auto p-1 bg-muted border border-white/5 rounded-2xl mb-16">
                  <TabsTrigger value="instant" className="py-3 text-xs font-black uppercase tracking-widest rounded-xl">Instant Funding</TabsTrigger>
                  <TabsTrigger value="1-step" className="py-3 text-xs font-black uppercase tracking-widest rounded-xl">1-Step Fast Track</TabsTrigger>
                  <TabsTrigger value="2-step" className="py-3 text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2">
                    2-Step Standard
                    <Badge variant="destructive" className="text-[8px] h-4 px-1.5 font-black uppercase">🔥 Hot</Badge>
                  </TabsTrigger>
              </TabsList>

              {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto h-10 w-10 text-primary opacity-20"/></div> : (
                  <>
                    <TabsContent value="2-step" className="mt-8 animate-in fade-in duration-500">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white tracking-tight uppercase">Forex 2-Step Standard</h2>
                            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto font-medium">Access high-fidelity institutional capital for major pairs and global commodities.</p>
                            <div className="flex justify-center mt-6">
                                <Button asChild variant="outline" className="rounded-full bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all px-8 py-1 h-10 text-[10px] font-black uppercase tracking-widest gap-2">
                                    <Link href="/rules/forex-two-step"><HelpCircle className="w-4 h-4" /> View Arena Rules</Link>
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                            {twoStepPlans.map((plan) => (
                                <PlanCard key={plan.id} {...plan} usdPrice={plan.usd_price} />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="instant" className="mt-8 animate-in fade-in duration-500">
                        {instantPlans.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                                {instantPlans.map((plan) => (
                                    <PlanCard key={plan.id} {...plan} usdPrice={plan.usd_price} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] max-w-4xl mx-auto">
                                <Sparkles className="h-10 w-10 text-primary mx-auto mb-4 opacity-20" />
                                <h3 className="text-2xl font-bold text-white tracking-tight uppercase">Forex Instant is coming.</h3>
                                <p className="text-gray-500 text-xs mt-2 uppercase font-black tracking-widest">System Optimization in Progress...</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="1-step" className="mt-8 animate-in fade-in duration-500">
                        {oneStepPlans.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                                {oneStepPlans.map((plan) => (
                                    <PlanCard key={plan.id} {...plan} usdPrice={plan.usd_price} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] max-w-4xl mx-auto">
                                <Zap className="h-10 w-10 text-primary mx-auto mb-4 opacity-20" />
                                <h3 className="text-2xl font-bold text-white tracking-tight uppercase">1-Phase Model development.</h3>
                                <p className="text-gray-500 text-xs mt-2 uppercase font-black tracking-widest">Risk Analysis Phase...</p>
                            </div>
                        )}
                    </TabsContent>
                  </>
              )}
          </Tabs>

          <div className="mt-32 text-center">
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] mb-4">Trusted by 4,000+ Global Traders</p>
          </div>
        </main>
      </div>
    </div>
  );
}
