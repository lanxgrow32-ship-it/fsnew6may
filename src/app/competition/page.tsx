'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowRight, Award, TrendingDown, CheckCircle2, Copy, ShieldCheck, Trophy, Target, Ban, Zap, Clock, IndianRupee, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerForTournament, getCompetitionEvents, getLeaderboard } from './actions';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ClientOnly } from '@/components/ui/client-only';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { FundedStockLogo } from '@/components/ui/logo';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';

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

function TournamentRegistration({ events, paymentSettings }: { events: any[], paymentSettings: any }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string>(events.find(e => e.status === 'ongoing')?.id || events[0]?.id || '');
    const [isSuccess, setIsSuccess] = useState(false);

    const selectedEvent = events.find(e => e.id === selectedEventId);
    const ongoingEvent = events.find(e => e.status === 'ongoing');
    const upcomingEvents = events.filter(e => e.status === 'upcoming').slice(0, 3);

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

    if (events.length === 0) {
        return (
            <Card className="bg-card/50 border-white/10 text-center p-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold text-white">No Tournaments Scheduled</h3>
                <p className="text-muted-foreground">Check back soon for upcoming weekly competitions!</p>
            </Card>
        );
    }

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
        <div className="space-y-12 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold tracking-tight text-white">Join the Battle</h2>
                <p className="text-muted-foreground text-lg">Pick a week, complete payment, and start trading.</p>
            </div>

            <div className="space-y-8">
                {/* 1. SELECTION SECTION */}
                <div className="space-y-6">
                    {ongoingEvent && (
                        <div className="space-y-4">
                            <Label className="text-lg font-bold text-white uppercase tracking-wider text-primary">Live Now</Label>
                            <div 
                                onClick={() => setSelectedEventId(ongoingEvent.id)}
                                className={cn(
                                    "relative group cursor-pointer transition-all duration-300 rounded-2xl overflow-hidden border-2 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6",
                                    selectedEventId === ongoingEvent.id 
                                        ? "bg-primary/10 border-primary shadow-[0_0_30px_rgba(234,179,8,0.2)]" 
                                        : "bg-card/50 border-white/5 hover:border-white/20"
                                )}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-2xl font-bold text-white">{ongoingEvent.week_label}</h3>
                                        <Badge className="bg-red-500 animate-pulse text-[10px] uppercase font-bold">Ongoing</Badge>
                                    </div>
                                    <p className="text-muted-foreground">{new Date(ongoingEvent.start_date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })} — {new Date(ongoingEvent.end_date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                                <div className="text-left md:text-right">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Entry Fee</p>
                                    <p className="text-3xl font-black text-primary">₹{Number(ongoingEvent.entry_fee).toLocaleString('en-IN')}</p>
                                </div>
                                <div className={cn("absolute right-4 top-4", selectedEventId === ongoingEvent.id ? "text-primary" : "text-transparent")}>
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    )}

                    {upcomingEvents.length > 0 && (
                        <div className="space-y-4">
                            <Label className="text-lg font-bold text-white uppercase tracking-wider text-gray-400">Upcoming Weeks</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {upcomingEvents.map((event) => (
                                    <div 
                                        key={event.id}
                                        onClick={() => setSelectedEventId(event.id)}
                                        className={cn(
                                            "cursor-pointer transition-all duration-300 rounded-2xl border-2 p-6 space-y-4",
                                            selectedEventId === event.id 
                                                ? "bg-primary/5 border-primary shadow-[0_0_20px_rgba(234,179,8,0.1)]" 
                                                : "bg-card/50 border-white/5 hover:border-white/20"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-bold text-white">{event.week_label}</h3>
                                            {selectedEventId === event.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{new Date(event.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - {new Date(event.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                                        <p className="text-2xl font-bold text-white">₹{Number(event.entry_fee).toLocaleString('en-IN')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. REGISTRATION FORM */}
                <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-8 items-start">
                    <Card className="bg-card/50 border-white/10 shadow-2xl">
                        <CardHeader>
                            <CardTitle>Registration Details</CardTitle>
                            <CardDescription>We'll use these to create your competition account.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && <Alert variant="destructive" className="bg-destructive/10 border-destructive/20"><AlertDescription>{error}</AlertDescription></Alert>}
                            <input type="hidden" name="event_id" value={selectedEventId} />
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="full_name">Full Name</Label><Input id="full_name" name="full_name" required className="bg-black/20 border-white/10" /></div>
                                <div className="space-y-2"><Label htmlFor="mobile_number">Mobile Number</Label><Input id="mobile_number" name="mobile_number" required className="bg-black/20 border-white/10" /></div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required className="bg-black/20 border-white/10" /></div>
                            <div className="space-y-2"><Label htmlFor="password">Login Password</Label><Input id="password" name="password" type="password" required className="bg-black/20 border-white/10" /></div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 border-primary/20 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="h-24 w-24 text-primary" /></div>
                        <CardHeader>
                            <CardTitle>Manual Payment</CardTitle>
                            <CardDescription>Entry for <span className="text-white font-bold">{selectedEvent?.week_label}</span></CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="mx-auto w-fit p-3 bg-white rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                                {paymentSettings?.qr_code_url ? <Image src={paymentSettings.qr_code_url} alt="UPI QR Code" width={220} height={220} className="rounded-lg" /> : <div className="w-[220px] h-[220px] bg-slate-100 flex items-center justify-center text-slate-800 font-black text-xl">SCAN & PAY</div>}
                            </div>
                            
                            <div className="text-center space-y-2">
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Amount Due</p>
                                <p className="text-4xl font-black text-primary">₹{selectedEvent ? Number(selectedEvent.entry_fee).toLocaleString('en-IN') : '0'}</p>
                                <div className="flex items-center justify-center gap-2 text-xs font-mono bg-black/40 p-2.5 rounded-lg border border-white/5">
                                    <span className="text-gray-300">{paymentSettings?.upi_id || 'payout@fundedstock'}</span>
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10" onClick={() => { navigator.clipboard.writeText(paymentSettings?.upi_id); toast({ title: "Copied UPI ID" }); }}><Copy className="h-3.5 w-3.5"/></Button>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-white/5">
                                <Label htmlFor="utr">Enter Transaction ID (UTR)</Label>
                                <Input id="utr" name="utr" placeholder="12-digit UPI reference number" required className="bg-black/50 border-white/10 text-white h-12" />
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Award className="mr-2 h-5 w-5" />}
                                Complete Registration
                            </Button>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </div>
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
        <section id="leaderboard" className="py-20">
            <div className="container mx-auto px-4 max-w-4xl space-y-12">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">
                        <TrendingDown className="h-3 w-3 rotate-180" /> Live Rankings
                    </div>
                    <h2 className="text-4xl font-bold tracking-tighter text-white">Competition Leaderboard</h2>
                    <p className="text-muted-foreground text-lg">Real-time performance ranking for the ongoing week.</p>
                </div>

                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 bg-white/5 h-14">
                                    <TableHead className="w-24 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">Rank</TableHead>
                                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Trader Name</TableHead>
                                    <TableHead className="text-right text-gray-400 font-bold uppercase text-[10px] tracking-widest pr-8">Current Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={3} className="text-center py-16"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                                ) : data.length > 0 ? data.map((row, i) => (
                                    <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-colors h-16">
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                {i === 0 ? <div className="h-8 w-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center font-bold text-sm">1</div> : 
                                                 i === 1 ? <div className="h-8 w-8 rounded-full bg-gray-300/20 text-gray-300 flex items-center justify-center font-bold text-sm">2</div> : 
                                                 i === 2 ? <div className="h-8 w-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-sm">3</div> : 
                                                 <span className="text-gray-500 font-mono text-sm">#{i + 1}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-white">{row.profiles?.full_name}</TableCell>
                                        <TableCell className="text-right font-mono text-primary font-bold text-lg pr-8">₹{Number(row.current_balance).toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={3} className="text-center py-16 text-muted-foreground">The battle is starting soon! Leaderboard will update live.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </div>
            </div>
        </section>
    );
}

function CompetitionLanding() {
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
            {/* Background Animations */}
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
                         <Button asChild className="rounded-full shadow-lg shadow-primary/20"><Link href="#join-form">Register Now</Link></Button>
                    </div>
                </div>
            </header>
            
            <div className="relative">
                {/* Hero Section */}
                <section className="container mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 items-center min-h-[85vh] pt-8 pb-12">
                    <div className="space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">
                            <Zap className="h-3 w-3" /> The Ultimate Trading Battle
                        </div>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter !leading-[1.1] text-white">Where Traders <br /> <span className="text-primary">Become Champions.</span></h1>
                        <p className="text-muted-foreground max-w-md mx-auto lg:mx-0 text-lg">Weekly tournaments with live capital rewards. Join the ongoing battle or secure your spot for upcoming weeks.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                             <Button size="lg" className="h-14 px-10 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-xl shadow-primary/20 transition-all hover:scale-105" asChild><a href="#join-form">Join Tournament <ArrowRight className="ml-2 h-5 w-5" /></a></Button>
                             <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white" asChild><a href="#leaderboard">View Leaderboard <Award className="ml-2 h-5 w-5" /></a></Button>
                        </div>
                    </div>
                    <div className="relative h-full flex items-center justify-center min-h-[350px] lg:min-h-0">
                        <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full scale-75"></div>
                        <Image src="/competition.png" alt="Competition Trophy" width={600} height={600} priority className="object-contain relative z-10 drop-shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-float" />
                    </div>
                </section>
                
                {/* Leaderboard Section */}
                <LeaderboardView ongoingEventId={ongoingEvent?.id} />

                {/* Prizes Section */}
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

                {/* Rules Section */}
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

                {/* Registration Section */}
                <section id="join-form" className="py-24 bg-white/[0.01] scroll-mt-20 border-t border-white/5">
                    <div className="container mx-auto px-4">
                        <TournamentRegistration events={events} paymentSettings={paymentSettings} />
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
