

'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowRight, Award, Menu, Gift, Star, UserCheck, TrendingDown, BarChart, Ban, Gavel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCompetitionUserAndSession } from './actions';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ClientOnly } from '@/components/ui/client-only';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { FundedStockLogo } from '@/components/ui/logo';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const navItems = [
    { href: "https://www.fundedstock.io/funding", label: "Funded Plans" },
    { href: "https://www.fundedstock.io/payouts", label: "Live Payouts" },
    { href: "https://www.fundedstock.io/trading-terminal", label: "Trading Terminal" },
    { href: "https://www.fundedstock.io/about", label: "About Us" },
    { href: "https://www.fundedstock.io/contact", label: "Contact Us" },
];


type PrizeTier = 'gold' | 'silver' | 'bronze';
type Prize = {
    place: string;
    funding: string;
    type: string;
    price: string;
    theme: PrizeTier;
};

const PrizeCard = ({ prize }: { prize: Prize }) => {
    const themeClasses: Record<PrizeTier, { bg: string, border: string, shadow: string, text: string }> = {
        gold: { bg: 'bg-gradient-to-b from-yellow-300/20 to-yellow-600/20', border: 'border-yellow-400', shadow: 'shadow-[0_0_20px_theme(colors.yellow.400/0.5)]', text: 'text-yellow-300' },
        silver: { bg: 'bg-gradient-to-b from-slate-300/20 to-slate-500/20', border: 'border-slate-400', shadow: 'shadow-[0_0_20px_theme(colors.slate.400/0.5)]', text: 'text-slate-300' },
        bronze: { bg: 'bg-gradient-to-b from-orange-400/20 to-orange-700/20', border: 'border-orange-500', shadow: 'shadow-[0_0_20px_theme(colors.orange.500/0.5)]', text: 'text-orange-400' },
    };

    const currentTheme = themeClasses[prize.theme];
    
    return (
        <Card className={cn('relative flex flex-col text-center items-center p-6 border-2 transition-all duration-300 hover:scale-105', currentTheme.bg, currentTheme.border, currentTheme.shadow)}>
            <h3 className="text-3xl font-bold">{prize.place}</h3>
            <Separator className={cn('my-4', currentTheme.border)} />
            <p className={cn('text-2xl font-bold', currentTheme.text)}>{prize.funding}</p>
            <p className="text-lg font-semibold">{prize.type}</p>
            <p className="text-sm text-muted-foreground">(Worth ₹{prize.price})</p>
        </Card>
    );
};

const Separator = ({ className }: { className?: string }) => (
    <div className={cn("h-px w-20 bg-gradient-to-r from-transparent via-current to-transparent", className)} />
);

const RuleCard = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <Card className="bg-card/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
                <div className="bg-primary/10 text-primary p-2 rounded-lg">{icon}</div>
                <span>{title}</span>
            </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
            {children}
        </CardContent>
    </Card>
);

function CompetitionSignupForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await createCompetitionUserAndSession(formData);

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
        } else {
            setError('Could not get payment URL. Please try again.');
            setIsLoading(false);
        }
    };

    const monthlyPrizes = {
        top: [
            { place: '2nd', funding: '5 Lakh', type: 'Instant Funding', price: '17,999', theme: 'silver' as const },
            { place: '1st', funding: '10 Lakh', type: 'Instant Funding', price: '29,999', theme: 'gold' as const },
            { place: '3rd', funding: '2 Lakh', type: 'Instant Funding', price: '9,999', theme: 'bronze' as const },
        ],
        runnerUps: [
            { rank: "2 Winners", prize: "1 Lakh Instant Funding Account" },
            { rank: "3 Winners", prize: "2 Lakh 2-Step Funding Account" },
            { rank: "2 Winners", prize: "50K Instant Funding Account" },
        ],
        giveaway: {
            name: 'iPhone 17',
            image: PlaceHolderImages.find(p => p.id === 'iphone-17')?.imageUrl || '',
            description: "A randomly selected REAL trader who follows all rules will win a brand new iPhone 17."
        }
    };

    const weeklyPrizes = {
        top: [
            { place: '2nd', funding: '2 Lakh', type: 'Instant Funding', price: '9,999', theme: 'silver' as const },
            { place: '1st', funding: '5 Lakh', type: 'Instant Funding', price: '17,999', theme: 'gold' as const },
            { place: '3rd', funding: '1 Lakh', type: 'Instant Funding', price: '5,999', theme: 'bronze' as const },
        ],
        runnerUps: [
           { rank: "Random Winners", prize: "50K Instant Funding Account" },
           { rank: "Random Winners", prize: "1 Lakh 2-Step Funding Account" },
        ],
        giveaway: {
            name: 'iPhone 16',
            image: PlaceHolderImages.find(p => p.id === 'iphone-16')?.imageUrl || '',
            description: "A randomly selected REAL trader who follows all rules will win a brand new iPhone 16. No gambling, just pure skill!"
        }
    };

    return (
        <main className="bg-background text-foreground min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 h-full w-full bg-transparent bg-[linear-gradient(to_right,hsl(var(--border)_/_0.4)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)_/_0.4)_1px,transparent_1px)] bg-auto" style={{ backgroundSize: '48px 48px' }}></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div>

            <header className="absolute top-0 left-0 right-0 z-20">
                <div className="container mx-auto flex items-center justify-between p-4 h-20">
                    <Link href="https://www.fundedstock.io" aria-label="FundedStock Home">
                        <FundedStockLogo className="h-8 w-auto text-primary" />
                    </Link>

                    <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        {navItems.map(item => (
                            <Link key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-4">
                         <Button asChild className="hidden lg:flex rounded-full">
                            <Link href="/login">
                                Login <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden">
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] bg-background">
                                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                                <nav className="flex flex-col gap-6 pt-12">
                                    <Link href="https://www.fundedstock.io" className="mb-4" aria-label="FundedStock Home">
                                        <FundedStockLogo className="h-8 w-auto text-primary" />
                                    </Link>
                                    {navItems.map(item => (
                                        <Link key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className="text-lg font-medium hover:text-primary transition-colors">
                                            {item.label}
                                        </Link>
                                    ))}
                                    <div className="border-t border-border pt-6 mt-6">
                                        <Button asChild className="w-full">
                                            <Link href="/login">Login</Link>
                                        </Button>
                                    </div>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>
            
            <div className="relative">
                <section className="container mx-auto grid lg:grid-cols-2 items-center min-h-screen pt-36 pb-12 lg:pt-24">
                    <div className="space-y-8 text-center lg:text-left animate-fade-in">
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter !leading-[1.1]">
                            Where Traders <br /> Become Champions.
                        </h1>
                        <p className="text-muted-foreground max-w-md mx-auto lg:mx-0 text-lg">
                            Compete with thousands of traders in a simulated challenge. Put your skills to the test and win cash prizes. Don't miss your chance to prove yourself and take home amazing rewards!
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                             <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground rounded-full" asChild>
                               <a href="#join-form">
                                 Join Competition
                                 <ArrowRight className="ml-2 h-5 w-5" />
                               </a>
                            </Button>
                            <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-full">
                                Leaderboard
                                <Award className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                    <div className="relative h-full flex items-center justify-center min-h-[300px] lg:min-h-0">
                        <Image
                            src="/competition.png"
                            alt="Competition Trophy"
                            width={600}
                            height={600}
                            priority
                            className="object-contain animate-fade-in-up"
                        />
                    </div>
                </section>
                
                <section id="prizes" className="py-20 bg-background/80 backdrop-blur-sm">
                    <div className="container mx-auto space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-bold tracking-tighter">Competition Prizes</h2>
                            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">Win up to <span className="text-primary font-semibold">10 Lakh funding account + iPhone</span> every month!</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <Card className="bg-card/50 flex flex-col md:flex-row items-center gap-6 p-6">
                                <Image src={monthlyPrizes.giveaway.image} alt={monthlyPrizes.giveaway.name} width={150} height={200} className="object-contain" data-ai-hint="iPhone 17"/>
                                <div className="space-y-2 text-center md:text-left">
                                    <CardTitle className="flex items-center gap-2 justify-center md:justify-start"><Gift className="text-primary"/> Monthly Mega Giveaway</CardTitle>
                                    <p className="text-2xl font-bold">{monthlyPrizes.giveaway.name}</p>
                                    <p className="text-muted-foreground text-sm">{monthlyPrizes.giveaway.description}</p>
                                </div>
                            </Card>
                            <Card className="bg-card/50 flex flex-col md:flex-row items-center gap-6 p-6">
                                <Image src={weeklyPrizes.giveaway.image} alt={weeklyPrizes.giveaway.name} width={150} height={200} className="object-contain" data-ai-hint="iPhone 16"/>
                                <div className="space-y-2 text-center md:text-left">
                                    <CardTitle className="flex items-center gap-2 justify-center md:justify-start"><Gift className="text-primary"/> Weekly Giveaway</CardTitle>
                                    <p className="text-2xl font-bold">{weeklyPrizes.giveaway.name}</p>
                                    <p className="text-muted-foreground text-sm">{weeklyPrizes.giveaway.description}</p>
                                </div>
                            </Card>
                        </div>

                         <Tabs defaultValue="monthly" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-auto p-1.5 bg-muted/50 border-border">
                                <TabsTrigger value="monthly" className="py-2.5 text-base">🏆 Monthly Prizes</TabsTrigger>
                                <TabsTrigger value="weekly" className="py-2.5 text-base">🏅 Weekly Prizes</TabsTrigger>
                            </TabsList>
                            <TabsContent value="monthly" className="mt-12">
                                <div className="grid md:grid-cols-3 gap-8 items-end pt-8">
                                    <PrizeCard prize={monthlyPrizes.top[0]} />
                                    <PrizeCard prize={monthlyPrizes.top[1]} />
                                    <PrizeCard prize={monthlyPrizes.top[2]} />
                                </div>
                                <div className="grid md:grid-cols-1 gap-8 mt-12 max-w-2xl mx-auto">
                                    <Card className="bg-card/50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2"><Award className="text-primary"/> 4th - 10th Place</CardTitle>
                                            <CardDescription>Randomly selected winners from the top performers.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {monthlyPrizes.runnerUps.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-border/30">
                                                  <div className="flex items-center gap-4">
                                                    <div className="bg-primary/20 text-primary font-semibold rounded-full px-3 py-1 text-sm w-28 text-center">
                                                      {item.rank}
                                                    </div>
                                                    <p className="font-medium text-foreground">{item.prize}</p>
                                                  </div>
                                                  <Award className="text-muted-foreground w-5 h-5 shrink-0" />
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                            <TabsContent value="weekly" className="mt-12">
                                <div className="grid md:grid-cols-3 gap-8 items-end pt-8">
                                     <PrizeCard prize={weeklyPrizes.top[0]} />
                                    <PrizeCard prize={weeklyPrizes.top[1]} />
                                    <PrizeCard prize={weeklyPrizes.top[2]} />
                                </div>
                                 <div className="grid md:grid-cols-1 gap-8 mt-12 max-w-2xl mx-auto">
                                    <Card className="bg-card/50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2"><Award className="text-primary"/> 4th - 10th Place</CardTitle>
                                            <CardDescription>Randomly selected winners from the top performers.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {weeklyPrizes.runnerUps.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-border/30">
                                                  <div className="flex items-center gap-4">
                                                    <div className="bg-primary/20 text-primary font-semibold rounded-full px-3 py-1 text-sm w-40 text-center">
                                                      {item.rank}
                                                    </div>
                                                    <p className="font-medium text-foreground">{item.prize}</p>
                                                  </div>
                                                  <Award className="text-muted-foreground w-5 h-5 shrink-0" />
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </section>

                <section id="rules" className="py-20 bg-background/80 backdrop-blur-sm">
                    <div className="container mx-auto space-y-12">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">FUNDEDSTOCK TRADING COMPETITION RULES</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <RuleCard title="Eligibility" icon={<UserCheck className="w-6 h-6"/>}>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Age must be 18+</li>
                                    <li>Entry fee must be successfully paid</li>
                                </ul>
                            </RuleCard>
                             <RuleCard title="Drawdown Rules" icon={<TrendingDown className="w-6 h-6"/>}>
                                <p><strong>Hitting the drawdown limit at any time = account disqualified.</strong></p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Maximum Daily Drawdown limit must not be breached</li>
                                    <li>Maximum Overall Drawdown limit must not be breached</li>
                                </ul>
                            </RuleCard>
                             <RuleCard title="Ranking Criteria" icon={<BarChart className="w-6 h-6"/>}>
                                <p>Top 3 winners are selected based on:</p>
                                 <ul className="list-disc list-inside space-y-1">
                                    <li>Highest % Return (ROI Based)</li>
                                    <li>Proper risk management & no rule violations</li>
                                    <li>Minimum required trading days completed</li>
                                </ul>
                            </RuleCard>
                            <RuleCard title="Prohibited Activities" icon={<Ban className="w-6 h-6"/>}>
                                <p>Violation = Immediate removal from competition.</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Gambling-style trading & Martingale strategy</li>
                                    <li>Overleveraging</li>
                                    <li>Copy trading / signal-based automation</li>
                                </ul>
                            </RuleCard>
                            <RuleCard title="Prize Distribution" icon={<Award className="w-6 h-6"/>}>
                                 <ul className="list-disc list-inside space-y-1">
                                    <li><strong>Top 3:</strong> Performance Based</li>
                                    <li><strong>4th to 10th:</strong> Random selection (eligible, disciplined traders only)</li>
                                    <li><strong>iPhone Giveaway:</strong> Must follow all rules, no violations, and complete required trading days.</li>
                                </ul>
                            </RuleCard>
                            <RuleCard title="Final Authority" icon={<Gavel className="w-6 h-6"/>}>
                                <p>FundedStock reserves the right to disqualify any participant violating rules, cancel suspicious accounts, and take the final decision on all disputes.</p>
                                <p className="font-bold pt-2">All decisions will be final and binding.</p>
                            </RuleCard>
                        </div>
                    </div>
                </section>

                <section id="join-form" className="py-20 bg-background/80 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-6 mx-auto">
                         <div className="flex flex-col items-center justify-center text-center mb-10">
                            <h2 className="text-3xl font-bold mt-4 text-primary">Join the Trading Competition</h2>
                            <p className="text-muted-foreground">
                                Register below to enter the weekly or monthly challenge.
                            </p>
                        </div>

                        <Card className="bg-card/50 border">
                            <CardHeader>
                                <CardTitle>Choose Your Challenge</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup name="plan_type" defaultValue="weekly" className="space-y-4">
                                    <Label htmlFor="plan_weekly" className={cn("flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-all", "has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:shadow-[0_0_15px_hsl(var(--primary)/0.4)]")}>
                                        <div>
                                            <p className="font-bold">Weekly Challenge</p>
                                            <p className="text-muted-foreground">₹249.00 / week</p>
                                        </div>
                                        <RadioGroupItem value="weekly" id="plan_weekly" />
                                    </Label>
                                    <Label htmlFor="plan_monthly" className={cn("flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-all", "has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:shadow-[0_0_15px_hsl(var(--primary)/0.4)]")}>
                                        <div>
                                            <p className="font-bold">Monthly Challenge</p>
                                            <p className="text-muted-foreground">₹549.00 / month</p>
                                        </div>
                                        <RadioGroupItem value="monthly" id="plan_monthly" />
                                    </Label>
                                </RadioGroup>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/50 border">
                            <CardHeader>
                                <CardTitle>Your Details</CardTitle>
                                <CardDescription>This will create your account on FundedStock.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input id="full_name" name="full_name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mobile_number">Mobile Number</Label>
                                    <Input id="mobile_number" name="mobile_number" type="tel" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" name="password" type="password" required />
                                </div>

                                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Proceed to Payment'}
                                </Button>
                            </CardContent>
                        </Card>
                    </form>
                </section>
            </div>
        </main>
    );
}

export default function CompetitionPage() {
    return (
        <div className="dark">
             <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 1s ease-out forwards;
                }
                .animate-fade-in-up {
                    animation: fade-in-up 1s ease-out forwards;
                }
            `}</style>
            <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}>
                <ClientOnly>
                    <CompetitionSignupForm />
                </ClientOnly>
            </Suspense>
        </div>
    )
}
