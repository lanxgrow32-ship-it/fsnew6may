
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, ExternalLink, Star } from 'lucide-react';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

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

const PlanCard = ({ size, title, price, isPopular, isHighlighted }: { size: string; title: string; price: string, isPopular?: boolean, isHighlighted?: boolean }) => {
  const currentPrice = parseFloat(price.replace(/,/g, ''));
  const originalPrice = currentPrice * 2;

  return (
    <div className={cn('relative', isHighlighted && 'glowing-border-wrapper rounded-lg')}>
      <Card className={cn("flex flex-col h-full hover:shadow-lg transition-shadow duration-300 bg-card/80 backdrop-blur-sm border-border", isHighlighted && "border-primary")}>
        <CardHeader className="pb-4">
          {isPopular && <Badge variant="destructive">🔥 POPULAR</Badge>}
          {isHighlighted && <Badge>🎉 TRY FIRST</Badge>}
          <CardTitle className="text-3xl font-bold pt-2">₹{size}</CardTitle>
          <p className="text-base text-muted-foreground">{title}</p>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow justify-between space-y-6">
          <div className="space-y-3 text-sm">
            {isHighlighted ? (
              <>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Limited slots available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Real trading experience at the lowest entry</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Full Fee Refund On 3rd Payout</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>80% Profit Share</span>
                </div>
              </>
            )}
          </div>
           <div className="text-center space-y-2 pt-4 border-t border-border/50">
              <Badge variant="destructive" className="animate-pulse">LIMITED TIME - 50% OFF</Badge>
              <div className="flex items-center justify-center gap-2">
                  <span className="text-xl text-muted-foreground line-through">
                      ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-3xl font-bold text-primary">
                      ₹{currentPrice.toLocaleString('en-IN')}
                  </span>
              </div>
            </div>
          <Button asChild className="w-full mt-auto" size="lg">
            <Link href={`/signup?plan=${encodeURIComponent(title)}&price=${price}`}>Get Funded for ₹{price}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


export default function PricingPage() {
  return (
    <div className="dark-theme">
      <style jsx global>{`
        @keyframes glowing {
          0% { border-color: hsl(var(--primary)); box-shadow: 0 0 5px hsl(var(--primary) / 0.8); }
          50% { border-color: hsl(var(--accent-foreground)); box-shadow: 0 0 20px hsl(var(--accent-foreground) / 0.8); }
          100% { border-color: hsl(var(--primary)); box-shadow: 0 0 5px hsl(var(--primary) / 0.8); }
        }
        .glowing-border-wrapper {
          padding: 2px;
          animation: glowing 3s linear infinite;
        }
      `}</style>
      <div className="bg-background min-h-screen text-foreground">
        <nav className="absolute top-4 left-4 z-10">
            <Button asChild variant="outline" size="sm" className="border-border/50 text-foreground/80 hover:bg-accent/50 hover:text-foreground">
            <Link href="https://www.fundedstock.io/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Main Site
            </Link>
            </Button>
        </nav>
        <main className="p-4 md:p-8">
          <div className="text-center mb-12 pt-12 md:pt-0">
              <h1 className="text-4xl font-extrabold tracking-tight">Choose Your Funding Plan</h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              Select the program that best fits your trading style and goals. Whether you're ready to trade now or want to prove your skills first, we have a path for you.
              </p>
          </div>

          <Tabs defaultValue="instant" className="w-full max-w-6xl mx-auto">
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 max-w-2xl mx-auto h-auto p-1.5 bg-muted/50 border-border">
                  <div className="relative">
                     <TabsTrigger value="instant" className="py-2 text-base w-full">Instant Funding</TabsTrigger>
                     <Badge variant="destructive" className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-bold whitespace-nowrap">
                        🔥 Most Demanded 🔥
                     </Badge>
                  </div>
                  <TabsTrigger value="1-step" className="py-2 text-base">1-Step Evaluation</TabsTrigger>
                  <TabsTrigger value="2-step" className="py-2 text-base">2-Step Evaluation</TabsTrigger>
              </TabsList>

              <TabsContent value="instant" className="mt-8">
                  <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold">Instant Funding</h2>
                      <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">Get funded instantly and start trading right away. Skip the evaluation process and get immediate access to capital up to ₹25L.</p>
                      <Button variant="link" asChild className="text-primary">
                          <Link href="/rules/instant-funding">View Rules <ExternalLink className="ml-2 h-4 w-4" /></Link>
                      </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {instantFundingPlans.map((plan) => (
                      <PlanCard key={plan.title} {...plan} />
                      ))}
                  </div>
              </TabsContent>

              <TabsContent value="1-step" className="mt-8">
                  <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold">1-Step Evaluation</h2>
                      <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">Our Fast-Track program. Pass one evaluation phase to get funded and access higher capital allocations sooner.</p>
                      <Button variant="link" asChild className="text-primary">
                          <Link href="/rules/one-step">View Rules <ExternalLink className="ml-2 h-4 w-4" /></Link>
                      </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {oneStepPlans.map((plan) => (
                      <PlanCard key={plan.title} {...plan} />
                      ))}
                  </div>
              </TabsContent>
              
              <TabsContent value="2-step" className="mt-8">
                  <div className="text-center my-8">
                      <h2 className="text-2xl font-bold">2-Step Evaluation</h2>
                      <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">Our most popular route. Pass two phases to unlock higher profit splits and demonstrate your trading skill and discipline.</p>
                      <Button variant="link" asChild className="text-primary">
                          <Link href="/rules/two-step-evaluation">View Rules <ExternalLink className="ml-2 h-4 w-4" /></Link>
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
