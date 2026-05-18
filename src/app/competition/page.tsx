'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowRight, Award, Menu, Gift, UserCheck, TrendingDown, BarChart, Ban, Gavel, Calendar as CalendarIcon, CheckCircle2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerForTournament, getCompetitionEvents, getLeaderboard } from './actions';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ClientOnly } from '@/components/ui/client-only';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { FundedStockLogo } from '@/components/ui/logo';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';

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

function TournamentRegistration({ events, paymentSettings }: { events: any[], paymentSettings: any }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string>(events.find(e => e.status === 'ongoing')?.id || events[0]?.id || '');
    const [isSuccess, setIsSuccess] = useState(false);

    const selectedEvent = events.find(e => e.id === selectedEventId);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await registerForTournament(formData);

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            setIsSuccess(true);
            setIsLoading(false);
            toast({ title: "Registration Submitted", description: "Wait for admin approval. Check your email for credentials shortly." });
        }
    };

    if (events.length === 0) return null;

    if (isSuccess) {
        return (
            <Card className="bg-card/50 border-green-500/50 text-center p-8 max-w-lg mx-auto">
                <div className="bg-green-500/10 text-green-500 rounded-full p-4 w-fit mx-auto mb-4">
                    <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Registration Received!</h2>
                <p className="text-muted-foreground">Our team is verifying your Transaction ID (UTR). Once approved, you will receive your StockMint credentials via email.</p>
                <Button asChild className="mt-6" variant="outline"><Link href="/login">Go to Login</Link></Button>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 mx-auto">
            <div className="space-y-6">
                <div className="text-left mb-6">
                    <h2 className="text-3xl font-bold text-primary">Join the Battle</h2>
                    <p className="text-muted-foreground">Select a week and complete your registration.</p>
                </div>

                <Card className="bg-card/50 border">
                    <CardHeader><CardTitle>1. Choose Tournament Week</CardTitle></CardHeader>
                    <CardContent>
                        <RadioGroup name="event_id" value={selectedEventId} onValueChange={setSelectedEventId} className="grid gap-4">
                            {events.map((event) => (
                                <Label key={event.id} htmlFor={event.id} className={cn(
                                    "flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-all",
                                    selectedEventId === event.id ? "border-primary bg-primary/5 shadow-[0_0_15px_hsl(var(--primary)/0.2)]" : "hover:bg-white/5"
                                )}>
                                    <div>
                                        <p className="font-bold flex items-center gap-2">
                                            {event.week_label}
                                            {event.status === 'ongoing' && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary">₹{Number(event.entry_fee).toLocaleString('en-IN')}</p>
                                        <RadioGroupItem value={event.id} id={event.id} className="sr-only" />
                                    </div>
                                </Label>
                            ))}
                        </RadioGroup>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 border">
                    <CardHeader>
                        <CardTitle>2. Your Details</CardTitle>
                        <CardDescription>We'll create your trading account with these.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="full_name">Full Name</Label><Input id="full_name" name="full_name" required /></div>
                            <div className="space-y-2"><Label htmlFor="mobile_number">Mobile Number</Label><Input id="mobile_number" name="mobile_number" required /></div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
                        <div className="space-y-2"><Label htmlFor="password">Login Password</Label><Input id="password" name="password" type="password" required /></div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="bg-card/50 border-primary/20 sticky top-24">
                    <CardHeader>
                        <CardTitle>3. Complete Payment</CardTitle>
                        <CardDescription>Scan & Pay the entry fee for <span className="text-white font-bold">{selectedEvent?.week_label}</span></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="mx-auto w-fit p-2 bg-white rounded-lg shadow-2xl">
                             {paymentSettings?.qr_code_url ? <Image src={paymentSettings.qr_code_url} alt="QR Code" width={200} height={200} /> : <div className="w-[200px] h-[200px] bg-slate-200 flex items-center justify-center text-slate-800 font-bold">QR Loading...</div>}
                        </div>
                        
                        <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">Amount to Pay</p>
                            <p className="text-3xl font-bold text-primary">₹{selectedEvent ? Number(selectedEvent.entry_fee).toLocaleString('en-IN') : '0'}</p>
                            <div className="flex items-center justify-center gap-2 text-xs font-mono bg-black/20 p-2 rounded">
                                <span>{paymentSettings?.upi_id}</span>
                                <Button type="button" variant="ghost" size="icon" className="h-4 w-4" onClick={() => { navigator.clipboard.writeText(paymentSettings?.upi_id); toast({ title: "Copied UPI ID" }); }}><Copy className="h-3 w-3"/></Button>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-white/5">
                            <Label htmlFor="utr">Enter Transaction ID (UTR)</Label>
                            <Input id="utr" name="utr" placeholder="12-digit UPI reference number" required className="bg-black/50 border-white/10" />
                        </div>

                        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Award className="mr-2 h-4 w-4" />}
                            Confirm Registration
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
}

function LeaderboardView({ ongoingEventId }: { ongoingEventId: string | null }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (ongoingEventId) {
            setLoading(true);
            getLeaderboard(ongoingEventId).then(res => {
                setData(res);
                setLoading(false);
            });
        }
    }, [ongoingEventId]);

    if (!ongoingEventId) return null;

    return (
        <section id="leaderboard" className="py-20 bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 max-w-4xl space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-bold tracking-tighter flex items-center justify-center gap-4">
                        <TrendingDown className="text-primary rotate-180" /> Live Leaderboard
                    </h2>
                    <p className="text-muted-foreground">Real-time rankings based on current balance for the ongoing week.</p>
                </div>

                <GlassCard>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 bg-white/5">
                                    <TableHead className="w-20 text-center">Rank</TableHead>
                                    <TableHead>Trader</TableHead>
                                    <TableHead className="text-right">Current Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={3} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                                ) : data.length > 0 ? data.map((row, i) => (
                                    <TableRow key={i} className="border-white/5">
                                        <TableCell className="text-center font-bold">
                                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                                        </TableCell>
                                        <TableCell className="font-semibold text-white">{row.profiles?.full_name}</TableCell>
                                        <TableCell className="text-right font-mono text-primary font-bold">₹{Number(row.current_balance).toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">Leaderboard will appear once trades begin.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </GlassCard>
            </div>
        </section>
    );
}

function CompetitionSignupForm() {
    const [events, setEvents] = useState<any[]>([]);
    const [paymentSettings, setPaymentSettings] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        getCompetitionEvents().then(setEvents);
        supabase.from('payment_details').select('*').eq('id', 1).single().then(({data}) => setPaymentSettings(data));
    }, []);

    const ongoingEvent = events.find(e => e.status === 'ongoing');

    return (
        <main className="bg-background text-foreground min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 h-full w-full bg-transparent bg-[linear-gradient(to_right,hsl(var(--border)_/_0.4)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)_/_0.4)_1px,transparent_1px)] bg-auto" style={{ backgroundSize: '48px 48px' }}></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div>

            <header className="sticky top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
                <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
                    <Link href="/" aria-label="FundedStock Home" className="flex items-center gap-2">
                        <FundedStockLogo className="h-8 w-auto text-primary" />
                        <span className="font-bold text-lg">FundedStock</span>
                    </Link>
                    <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        {navItems.map(item => (
                            <Link key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">{item.label}</Link>
                        ))}
                    </nav>
                    <div className="flex items-center gap-4">
                         <Button asChild className="rounded-full"><Link href="/login">Login <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                    </div>
                </div>
            </header>
            
            <div className="relative">
                <section className="container mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 items-center min-h-[80vh] pt-8 pb-12">
                    <div className="space-y-8 text-center lg:text-left">
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter !leading-[1.1]">Where Traders <br /> Become Champions.</h1>
                        <p className="text-muted-foreground max-w-md mx-auto lg:mx-0 text-lg">Weekly tournaments with live capital rewards. Join the ongoing battle or secure your spot for upcoming weeks.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                             <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground rounded-full" asChild><a href="#join-form">Join Competition <ArrowRight className="ml-2 h-5 w-5" /></a></Button>
                             <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-full" asChild><a href="#leaderboard">Leaderboard <Award className="ml-2 h-5 w-5" /></a></Button>
                        </div>
                    </div>
                    <div className="relative h-full flex items-center justify-center min-h-[300px] lg:min-h-0">
                        <Image src="/competition.png" alt="Competition Trophy" width={600} height={600} priority className="object-contain" />
                    </div>
                </section>
                
                <LeaderboardView ongoingEventId={ongoingEvent?.id} />

                <section id="prizes" className="py-20 bg-background/80 backdrop-blur-sm">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-bold tracking-tighter">Tournament Rewards</h2>
                            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">Top performers each week win instant funded accounts and tech giveaways.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 pt-8">
                             <Card className="bg-card/50 border-slate-400 p-6 text-center space-y-4">
                                <h3 className="text-2xl font-bold">2nd Place</h3>
                                <Separator className="mx-auto border-slate-400" />
                                <p className="text-2xl font-bold text-slate-300">2 Lakh</p>
                                <p className="text-sm text-muted-foreground">Instant Funding Account</p>
                             </Card>
                             <Card className="bg-card/50 border-yellow-400 p-6 text-center space-y-4 md:scale-110 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                                <h3 className="text-3xl font-bold">1st Place</h3>
                                <Separator className="mx-auto border-yellow-400" />
                                <p className="text-3xl font-bold text-yellow-300">5 Lakh</p>
                                <p className="text-sm text-muted-foreground">Instant Funding Account</p>
                             </Card>
                             <Card className="bg-card/50 border-orange-500 p-6 text-center space-y-4">
                                <h3 className="text-2xl font-bold">3rd Place</h3>
                                <Separator className="mx-auto border-orange-500" />
                                <p className="text-2xl font-bold text-orange-400">1 Lakh</p>
                                <p className="text-sm text-muted-foreground">Instant Funding Account</p>
                             </Card>
                        </div>
                    </div>
                </section>

                <section id="rules" className="py-20 bg-background/80 backdrop-blur-sm">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">TOURNAMENT RULES</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <RuleCard title="Eligibility" icon={<UserCheck className="w-6 h-6"/>}>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Age must be 18+</li>
                                    <li>One account per user per tournament</li>
                                </ul>
                            </RuleCard>
                             <RuleCard title="Risk Limits" icon={<TrendingDown className="w-6 h-6"/>}>
                                <p><strong>Breach = Disqualification.</strong></p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Max Daily Drawdown: 5%</li>
                                    <li>Max Overall Drawdown: 10%</li>
                                </ul>
                            </RuleCard>
                             <RuleCard title="Prohibited" icon={<Ban className="w-6 h-6"/>}>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Gambling/Martingale strategy</li>
                                    <li>Copy trading or AI signal bots</li>
                                    <li>Hedging across accounts</li>
                                </ul>
                            </RuleCard>
                        </div>
                    </div>
                </section>

                <section id="join-form" className="py-20 bg-background/80 backdrop-blur-sm scroll-mt-20">
                    <div className="container mx-auto px-4">
                        <TournamentRegistration events={events} paymentSettings={paymentSettings} />
                    </div>
                </section>
            </div>
        </main>
    );
}

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

export default function CompetitionPage() {
    return (
        <div className="dark">
            <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}>
                <ClientOnly>
                    <CompetitionSignupForm />
                </ClientOnly>
            </Suspense>
        </div>
    )
}
