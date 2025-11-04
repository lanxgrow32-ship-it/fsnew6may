
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';

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

const PlanCard = ({ size, title, price }: { size: string; title: string; price: string }) => (
  <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300 bg-card/80 backdrop-blur-sm border-border">
    <CardHeader className="pb-4">
      <CardDescription className="text-primary text-sm font-semibold">POPULAR</CardDescription>
      <CardTitle className="text-3xl font-bold">₹{size}</CardTitle>
      <p className="text-base text-muted-foreground">{title}</p>
    </CardHeader>
    <CardContent className="flex flex-col flex-grow justify-between space-y-6">
        <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Full Fee Refund On 3rd Payout</span>
            </div>
            <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>80% Profit Share</span>
            </div>
        </div>
      <Button asChild className="w-full mt-auto" size="lg">
        <Link href={`/signup?plan=${encodeURIComponent(title)}&price=${price}`}>Get Funded for ₹{price}</Link>
      </Button>
    </CardContent>
  </Card>
);


export default function PricingPage() {
  return (
    <div className="dark-theme">
      <div className="bg-background min-h-screen text-foreground">
        <main className="p-4 md:p-8">
          <div className="text-center mb-12">
              <h1 className="text-4xl font-extrabold tracking-tight">Choose Your Funding Plan</h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              Select the program that best fits your trading style and goals. Whether you're ready to trade now or want to prove your skills first, we have a path for you.
              </p>
          </div>

          <Tabs defaultValue="instant" className="w-full max-w-6xl mx-auto">
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 max-w-2xl mx-auto h-auto p-1.5 bg-muted/50 border-border">
                  <TabsTrigger value="instant" className="py-2 text-base">Instant Funding</TabsTrigger>
                  <TabsTrigger value="1-step" className="py-2 text-base">1-Step Evaluation</TabsTrigger>
                  <TabsTrigger value="2-step" className="py-2 text-base">2-Step Evaluation</TabsTrigger>
              </TabsList>

              <TabsContent value="instant" className="mt-8">
                  <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold">Instant Funding</h2>
                      <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">Get funded instantly and start trading right away. Skip the evaluation process and get immediate access to capital up to ₹25L.</p>
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
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
