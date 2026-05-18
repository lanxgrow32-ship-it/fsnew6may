'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Eye, EyeOff, History, Copy, Clock, ShieldCheck, CheckCircle, PlusCircle, Zap, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Registration = {
    id: string;
    is_approved: boolean;
    stockmint_username: string | null;
    stockmint_password: string | null;
    current_balance: number;
    created_at: string;
    competition_events: {
        week_label: string;
        start_date: string;
        end_date: string;
    };
};

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        const calculateTime = () => {
            // Set target time to 9:00 AM on the start date
            const target = new Date(targetDate);
            target.setHours(9, 0, 0, 0);
            
            const now = new Date();
            const difference = target.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft(null);
                return;
            }

            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            });
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    if (!timeLeft) return null;

    const TimeBlock = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center bg-black/40 rounded-xl p-3 min-w-[70px] border border-white/5">
            <span className="text-2xl font-black text-primary leading-none">{value}</span>
            <span className="text-[9px] uppercase font-bold text-gray-500 mt-1 tracking-tighter">{label}</span>
        </div>
    );

    return (
        <div className="flex gap-2 justify-center py-4">
            <TimeBlock value={timeLeft.days} label="Days" />
            <TimeBlock value={timeLeft.hours} label="Hours" />
            <TimeBlock value={timeLeft.minutes} label="Mins" />
            <TimeBlock value={timeLeft.seconds} label="Secs" />
        </div>
    );
}

export function CompetitionView({ registrations }: { registrations: Registration[] }) {
    const { toast } = useToast();
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };
    
    const copyToClipboard = (text: string | null) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!" });
    }
    
    const activeReg = registrations?.[0];

    if (!activeReg) {
        return (
            <GlassCard className="text-center p-12">
                <Clock className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-white">No Active Registrations</h3>
                <p className="text-gray-400 mt-2 mb-6">You haven't joined any tournament weeks yet.</p>
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                    <Link href="/competition">Browse Tournaments</Link>
                </Button>
            </GlassCard>
        );
    }

    // Date Logic for Reveal
    const today = new Date();
    const startDate = new Date(activeReg.competition_events?.start_date);
    // Add 9 hours to start at 9:00 AM IST approx
    startDate.setHours(9, 0, 0, 0);
    
    const isLocked = isClient && today < startDate;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Competition Hub</h2>
                <Button asChild variant="outline" className="bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10 rounded-full">
                    <Link href="/competition"><PlusCircle className="mr-2 w-4 h-4"/> Join Next Week</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Primary/Active Registration */}
                <GlassCard className={cn("border-white/10", !activeReg.is_approved && "border-amber-400/30", isLocked && "border-primary/20")}>
                    <CardHeader className="bg-white/[0.02] border-b border-white/5">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-2xl font-bold text-white">{activeReg.competition_events?.week_label || 'Weekly Tournament'}</CardTitle>
                                <CardDescription className="text-gray-400">
                                    {activeReg.competition_events ? (
                                        <>
                                            {new Date(activeReg.competition_events.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} — 
                                            {new Date(activeReg.competition_events.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </>
                                    ) : (
                                        'Tournament Dates'
                                    )}
                                </CardDescription>
                            </div>
                            {!activeReg.is_approved ? (
                                <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30 px-3 py-1 animate-pulse">Verification Pending</Badge>
                            ) : isLocked ? (
                                <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5"/> Verified & Secured</Badge>
                            ) : (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">Active</Badge>
                            )}
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-8">
                        {!activeReg.is_approved ? (
                            <div className="text-center space-y-4 py-8">
                                <div className="mx-auto bg-amber-400/10 rounded-full p-4 w-fit">
                                    <Loader2 className="h-10 w-10 text-amber-400 animate-spin" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Payment Being Verified</h3>
                                <p className="text-gray-400 max-w-sm mx-auto">
                                    Our team is checking your transaction ID. Credentials will appear here automatically once approved.
                                </p>
                            </div>
                        ) : isLocked ? (
                            <div className="text-center space-y-6 py-6">
                                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">
                                    <Zap className="h-3 w-3" /> Battle Starts In
                                </div>
                                
                                <CountdownTimer targetDate={activeReg.competition_events.start_date} />
                                
                                <div className="max-w-md mx-auto space-y-3">
                                    <h3 className="text-xl font-bold text-white">Your spot is secured!</h3>
                                    <p className="text-gray-400 text-sm">
                                        To ensure a fair start for all champions, trading credentials and the platform login will be revealed here exactly when the tournament begins.
                                    </p>
                                </div>

                                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 max-w-lg mx-auto">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/5 p-3 rounded-full"><Clock className="w-6 h-6 text-gray-400"/></div>
                                        <div className="text-left">
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Release Date</p>
                                            <p className="text-white font-bold">{new Date(activeReg.competition_events.start_date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Time</p>
                                        <p className="text-white font-bold">09:00 AM IST</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-1">
                                        <Label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Trading Username</Label>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-lg font-mono font-bold text-white truncate">{activeReg.stockmint_username}</p>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => copyToClipboard(activeReg.stockmint_username)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-1">
                                        <Label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Trading Password</Label>
                                        <div className="flex items-center justify-between">
                                            <p className="text-lg font-mono font-bold text-white tracking-widest">
                                                {visiblePasswords[activeReg.id] ? activeReg.stockmint_password : '••••••••••'}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => togglePasswordVisibility(activeReg.id)}>
                                                    {visiblePasswords[activeReg.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => copyToClipboard(activeReg.stockmint_password)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button asChild size="lg" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-600/20 font-bold h-14 rounded-xl">
                                        <Link href="https://www.stockmint.io/login" target="_blank">
                                            Launch Trading Software <ExternalLink className="ml-2 h-5 w-5" />
                                        </Link>
                                    </Button>
                                    <div className="bg-white/5 px-6 py-4 rounded-xl border border-white/5 flex flex-col justify-center">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Live Balance</span>
                                        <span className="text-xl font-black text-primary">₹{Number(activeReg.current_balance).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </GlassCard>

                {/* Registration History */}
                {registrations.length > 1 && (
                    <GlassCard>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white"><History className="w-5 h-5" /> Tournament History</CardTitle>
                            <CardDescription className="text-gray-400">Past weekly entries and results.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/5">
                                        <TableHead className="text-gray-500 uppercase text-[10px] font-bold tracking-wider">Tournament</TableHead>
                                        <TableHead className="text-gray-500 uppercase text-[10px] font-bold tracking-wider">Status</TableHead>
                                        <TableHead className="text-right text-gray-500 uppercase text-[10px] font-bold tracking-wider">Ending Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {registrations.slice(1).map((reg) => (
                                        <TableRow key={reg.id} className="border-white/5">
                                            <TableCell className="font-semibold text-white">{reg.competition_events?.week_label || 'Completed Week'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] border-white/10 text-gray-400">Completed</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-white">₹{Number(reg.current_balance).toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </GlassCard>
                )}
            </div>
        </div>
    );
}
