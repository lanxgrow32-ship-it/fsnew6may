'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Eye, EyeOff, History, Copy, Clock, ShieldCheck, CheckCircle, PlusCircle, Zap, Timer, Trophy, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { purchaseTournamentEntry, getCompetitionEvents } from './actions';

type Registration = {
    id: string;
    is_approved: boolean;
    stockmint_username: string | null;
    stockmint_password: string | null;
    current_balance: number;
    created_at: string;
    competition_events: {
        id: string;
        week_label: string;
        start_date: string;
        end_date: string;
        entry_fee: number;
        is_free: boolean;
        status: string;
    };
};

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

export function CompetitionView({ registrations, profile, onSwitchToWallet }: { registrations: Registration[], profile: any, onSwitchToWallet: () => void }) {
    const { toast } = useToast();
    const [view, setView] = useState<'hub' | 'browser'>('hub');
    const [events, setEvents] = useState<any[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    const handleBrowse = async () => {
        setIsLoadingEvents(true);
        const data = await getCompetitionEvents();
        setEvents(data);
        setIsLoadingEvents(false);
        setView('browser');
    };

    const handleJoin = async (event: any) => {
        if (!event.is_free && profile.wallet_balance < event.entry_fee) {
            toast({ title: "Insufficient Cash", description: "Top up your wallet to join this competition.", variant: "destructive" });
            onSwitchToWallet();
            return;
        }

        setIsPurchasing(event.id);
        const res = await purchaseTournamentEntry(profile.id, event.id);
        if (res.error) toast({ title: "Failed", description: res.error, variant: "destructive" });
        else {
            toast({ title: "Welcome to the Arena!", description: "You are registered for this competition." });
            window.location.reload();
        }
        setIsPurchasing(null);
    };

    const activeReg = registrations.find(r => r.competition_events.status === 'ongoing') || registrations[0];

    if (view === 'browser') {
        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => setView('hub')} className="text-gray-500 hover:text-white font-bold p-0 h-auto"><ArrowRight className="rotate-180 mr-1.5 h-4 w-4" /> Back to Hub</Button>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Browse Arena</h2>
                </div>

                <div className="grid gap-4">
                    {isLoadingEvents ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary"/></div> : (
                        events.map(event => (
                            <GlassCard key={event.id} className={cn("p-5 flex flex-col md:flex-row items-center justify-between gap-6", event.status === 'ongoing' && "border-primary/30 bg-primary/5")}>
                                <div className="space-y-1 text-center md:text-left">
                                    <div className="flex items-center gap-3 justify-center md:justify-start">
                                        <h3 className="text-lg font-bold text-white">{event.week_label}</h3>
                                        {event.status === 'ongoing' && <Badge className="bg-red-500 animate-pulse text-[9px] font-bold">LIVE</Badge>}
                                        {event.is_free && <Badge className="bg-green-600 text-[9px] font-bold">FREE</Badge>}
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {new Date(event.start_date).toLocaleDateString()} — {new Date(event.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-center md:text-right">
                                        <p className="text-[10px] text-gray-600 font-bold uppercase">Entry Fee</p>
                                        <p className="text-lg font-bold text-primary">{event.is_free ? 'Free' : `₹${event.entry_fee}`}</p>
                                    </div>
                                    <Button onClick={() => handleJoin(event)} disabled={isPurchasing !== null} className="rounded-xl px-6 font-bold h-10 text-xs">
                                        {isPurchasing === event.id ? <Loader2 className="animate-spin h-3.5 w-3.5"/> : 'Secure Entry'}
                                    </Button>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            </div>
        );
    }

    if (!activeReg) {
        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Competition</h2>
                    <p className="text-gray-400 text-sm font-medium">Battle with other traders for massive funded rewards.</p>
                </div>
                <GlassCard className="text-center p-16 border-dashed border-white/5">
                    <Trophy className="h-12 w-12 text-gray-800 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No active protocols</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mt-2 mb-8 text-sm font-medium">Join the next competition to prove your consistency and earn instant funding.</p>
                    <Button onClick={handleBrowse} size="lg" className="px-8 h-12 rounded-xl font-bold shadow-xl shadow-primary/20 text-sm">
                        Browse Competitions <ArrowRight className="ml-2 h-4 w-4"/>
                    </Button>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Competition</h2>
                    <p className="text-gray-400 text-sm font-medium">Tracking your performance for the current tournament.</p>
                </div>
                <Button onClick={handleBrowse} variant="outline" className="bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10 rounded-full font-bold h-9 text-[11px]">
                    <PlusCircle className="mr-1.5 h-3.5 w-3.5 text-primary"/> Join Next Week
                </Button>
            </div>

            <GlassCard className="border-primary/20 bg-primary/5">
                <CardHeader className="border-b border-white/5 pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl font-bold text-white">{activeReg.competition_events.week_label}</CardTitle>
                            <CardDescription className="text-xs text-gray-500 font-medium mt-1">
                                Period: {new Date(activeReg.competition_events.start_date).toLocaleDateString()} — {new Date(activeReg.competition_events.end_date).toLocaleDateString()}
                            </CardDescription>
                        </div>
                        <Badge className="bg-primary text-white font-bold px-2.5 py-0.5 rounded-full text-[10px]">Live Session</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                         <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Balance</p>
                                    <p className="text-lg font-bold text-primary mt-0.5">₹{Number(activeReg.current_balance).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Rank</p>
                                    <p className="text-lg font-bold text-white mt-0.5">#--</p>
                                </div>
                            </div>
                            <div className="p-5 bg-black/40 rounded-2xl border border-white/10 space-y-3">
                                <div className="space-y-0.5">
                                    <Label className="text-[10px] text-gray-600 font-bold uppercase">Trading ID</Label>
                                    <div className="flex items-center justify-between">
                                        <p className="font-mono font-bold text-white text-xs">{activeReg.stockmint_username || 'Awaiting Hub'}</p>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500" onClick={() => { navigator.clipboard.writeText(activeReg.stockmint_username || ''); toast({title: "Copied"}); }}><Copy className="w-3.5 h-3.5"/></Button>
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <Label className="text-[10px] text-gray-600 font-bold uppercase">Master Access</Label>
                                    <div className="flex items-center justify-between">
                                        <p className="font-mono font-bold text-white text-xs">{visiblePasswords[activeReg.id] ? activeReg.stockmint_password : '••••••••••'}</p>
                                        <div className="flex gap-0.5">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500" onClick={() => setVisiblePasswords(p => ({...p, [activeReg.id]: !p[activeReg.id]}))}>{visiblePasswords[activeReg.id] ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}</Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500" onClick={() => { navigator.clipboard.writeText(activeReg.stockmint_password || ''); toast({title: "Copied"}); }}><Copy className="w-3.5 h-3.5"/></Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                         </div>
                         <div className="text-center space-y-4">
                            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_25px_rgba(139,44,245,0.2)]">
                                <Zap className="h-6 w-6 text-primary animate-pulse" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-base font-bold text-white">Terminal Ready.</h3>
                                <p className="text-[11px] text-gray-500 max-w-[180px] mx-auto font-medium">Launch StockMint and use your provided credentials.</p>
                            </div>
                            <Button asChild className="w-full h-10 text-xs font-bold rounded-xl shadow-lg">
                                <a href="https://stockmint.io/login" target="_blank">Launch Platform <ExternalLink className="ml-1.5 h-3.5 w-3.5"/></a>
                            </Button>
                         </div>
                    </div>
                </CardContent>
            </GlassCard>
        </div>
    );
}
