'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, Award, TrendingDown, ShieldCheck, Trophy, Target, Ban, Zap, Clock, IndianRupee, X, CheckCircle } from 'lucide-react';
import { getCompetitionEvents } from './actions';
import Link from 'next/link';
import { ClientOnly } from '@/components/ui/client-only';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { FundedStockLogo } from '@/components/ui/logo';

const navItems = [
    { href: "https://www.fundedstock.io/funding", label: "Funded Plans" },
    { href: "https://www.fundedstock.io/payouts", label: "Live Payouts" },
    { href: "https://www.fundedstock.io/trading-terminal", label: "Trading Terminal" },
    { href: "https://www.fundedstock.io/about", label: "About Us" },
    { href: "https://www.fundedstock.io/contact", label: "Contact Us" },
];

const Separator = ({ className }: { className?: string }) => (
    <div className={cn("h-px w-20 bg-gradient-to-r from-transparent via-current to-transparent", className)} />
);

const RuleCard = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <Card className="bg-card/50 border-white/5">
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

function CompetitionLanding() {
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        getCompetitionEvents().then(setEvents);
    }, []);

    return (
        <main className="bg-background text-foreground min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-transparent bg-[linear-gradient(to_right,hsl(var(--border)_/_0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)_/_0.05)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_0px,hsl(var(--primary)/0.1),transparent)]"></div>

            <header className="sticky top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
                <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
                    <Link href="/" className="flex items-center gap-2 group">
                        <FundedStockLogo className="h-8 w-auto text-primary group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-lg text-white">FundedStock</span>
                    </Link>
                    <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        {navItems.map(item => (
                            <Link key={item.href} href={item.href} target="_blank" className="hover:text-primary transition-colors">{item.label}</Link>
                        ))}
                    </nav>
                    <div className="flex items-center gap-4">
                         <Button asChild variant="ghost" className="text-white hover:text-primary"><Link href="/login">Login</Link></Button>
                         <Button asChild className="rounded-full shadow-lg shadow-primary/20"><Link href="/signup">Join Now</Link></Button>
                    </div>
                </div>
            </header>
            
            <div className="relative">
                <section className="container mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 items-center min-h-[85vh] pt-8 pb-12">
                    <div className="space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">
                            <Zap className="h-3 w-3" /> The Ultimate Trading Battle
                        </div>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter !leading-[1.1] text-white">Where Traders <br /> <span className="text-primary">Become Champions.</span></h1>
                        <p className="text-muted-foreground max-w-md mx-auto lg:mx-0 text-lg">Weekly tournaments with live capital rewards. Join thousands of traders in India's most competitive arena.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                             <Button size="lg" className="h-14 px-10 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-xl shadow-primary/20 transition-all hover:scale-105" asChild><Link href="/signup">Join Next Battle <ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
                             <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white" asChild><Link href="/competition/leaderboard">View Live Rankings <Award className="ml-2 h-5 w-5" /></Link></Button>
                        </div>
                    </div>
                    <div className="relative h-full flex items-center justify-center min-h-[350px] lg:min-h-0">
                        <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full scale-75"></div>
                        <Image src="/competition.png" alt="Competition Trophy" width={600} height={600} priority className="object-contain relative z-10 drop-shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-float" />
                    </div>
                </section>
                
                <section id="prizes" className="py-24 bg-white/[0.02] border-y border-white/5">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-bold tracking-tighter text-white">Tournament Rewards</h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Top 3 performers each week earn instant funding. No evaluations needed.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 pt-8">
                             <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center space-y-6 transition-all hover:border-white/20">
                                <div className="text-4xl">🥈</div>
                                <h3 className="text-2xl font-bold text-white">2nd Place</h3>
                                <div className="h-1 w-12 bg-gray-400 mx-auto rounded-full" />
                                <div>
                                    <p className="text-4xl font-black text-white">2 Lakh</p>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Instant Funding Account</p>
                                </div>
                             </div>
                             <div className="bg-primary/10 backdrop-blur-xl border-2 border-primary p-8 rounded-3xl text-center space-y-6 md:-translate-y-4 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                                <div className="text-5xl">🥇</div>
                                <h3 className="text-3xl font-bold text-white">Champion</h3>
                                <div className="h-1.5 w-16 bg-primary mx-auto rounded-full" />
                                <div>
                                    <p className="text-5xl font-black text-primary">5 Lakh</p>
                                    <p className="text-xs text-primary/70 uppercase font-bold tracking-widest mt-2">Instant Funding Account</p>
                                </div>
                             </div>
                             <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center space-y-6 transition-all hover:border-white/20">
                                <div className="text-4xl">🥉</div>
                                <h3 className="text-2xl font-bold text-white">3rd Place</h3>
                                <div className="h-1 w-12 bg-orange-600 mx-auto rounded-full" />
                                <div>
                                    <p className="text-4xl font-black text-white">1 Lakh</p>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Instant Funding Account</p>
                                </div>
                             </div>
                        </div>
                    </div>
                </section>

                <section id="rules" className="py-24">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl uppercase">Tournament Protocols</h2>
                            <Separator className="mx-auto" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <RuleCard title="Eligibility" icon={<ShieldCheck className="w-6 h-6"/>}>
                                <ul className="space-y-3">
                                    <li className="flex gap-2">
                                        <div className="h-5 w-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-[10px] mt-0.5 font-bold">1</div>
                                        <span>Age must be 18+ with valid ID.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="h-5 w-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-[10px] mt-0.5 font-bold">2</div>
                                        <span>Single account per user per week.</span>
                                    </li>
                                </ul>
                            </RuleCard>
                             <RuleCard title="Risk Limits" icon={<TrendingDown className="w-6 h-6"/>}>
                                <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-xs font-bold border border-red-500/20 mb-3">Breach = Disqualification</div>
                                <ul className="space-y-2">
                                    <li className="flex justify-between border-b border-white/5 pb-2"><span>Daily Drawdown</span> <span className="text-white font-bold">5%</span></li>
                                    <li className="flex justify-between"><span>Max Drawdown</span> <span className="text-white font-bold">10%</span></li>
                                </ul>
                            </RuleCard>
                             <RuleCard title="Prohibited" icon={<Ban className="w-6 h-6"/>}>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-destructive"><X className="h-3 w-3"/> Gambling/Martingale</li>
                                    <li className="flex items-center gap-2 text-destructive"><X className="h-3 w-3"/> Signal Bots / AI Tools</li>
                                    <li className="flex items-center gap-2 text-destructive"><X className="h-3 w-3"/> Hedging Across Accounts</li>
                                </ul>
                            </RuleCard>
                        </div>
                    </div>
                </section>

                <section id="join-form" className="py-24 bg-white/[0.01] border-t border-white/5">
                    <div className="container mx-auto px-4 text-center">
                        <Card className="max-w-2xl mx-auto bg-slate-900 border-primary/20 p-12">
                            <CardHeader>
                                <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
                                <CardTitle className="text-3xl font-bold">Join the Next Battle</CardTitle>
                                <CardDescription className="text-lg">Register for your trader portal to join this week's tournament instantly using your wallet balance.</CardDescription>
                            </CardHeader>
                            <CardFooter className="flex flex-col gap-4 mt-6">
                                <Button asChild size="lg" className="w-full h-14 text-xl font-bold rounded-2xl"><Link href="/signup">Create Account to Join</Link></Button>
                                <p className="text-sm text-gray-500">Already have an account? <Link href="/login" className="text-primary hover:underline">Login here</Link></p>
                            </CardFooter>
                        </Card>
                    </div>
                </section>
            </div>
            
            <footer className="py-12 border-t border-white/5 text-center text-sm text-gray-500">
                <div className="container mx-auto px-4 space-y-4">
                    <FundedStockLogo className="h-6 w-6 mx-auto opacity-50" />
                    <p>© {new Date().getFullYear()} FundedStock. All trading is simulated. Rewards are professional fees.</p>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </main>
    );
}

export default function CompetitionPage() {
    return (
        <div className="dark">
            <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-slate-950"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>}>
                <ClientOnly>
                    <CompetitionLanding />
                </ClientOnly>
            </Suspense>
        </div>
    )
}