
'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowRight, Award, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCompetitionUserAndSession } from './actions';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ClientOnly } from '@/components/ui/client-only';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { FundedStockLogo } from '@/components/ui/logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
    { href: "https://www.fundedstock.io/funding", label: "Funded Plans" },
    { href: "https://www.fundedstock.io/payouts", label: "Live Payouts" },
    { href: "https://www.fundedstock.io/trading-terminal", label: "Trading Terminal" },
    { href: "https://www.fundedstock.io/about", label: "About Us" },
    { href: "https://www.fundedstock.io/contact", label: "Contact Us" },
];


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
                <section className="container mx-auto grid lg:grid-cols-2 items-center min-h-screen pt-36 pb-12 lg:pb-0">
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
