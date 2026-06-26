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
            toast({ title: "Insufficient Cash", description: "Top up your wallet to join this tournament.", variant: "destructive" });
            onSwitchToWallet();
            return;
        }

        setIsPurchasing(event.id);
        const res = await purchaseTournamentEntry(profile.id, event.id);
        if (res.error) toast({ title: "Failed", description: res.error, variant: "destructive" });
        else {
            toast({ title: "Welcome to the Arena!", description: "You are registered for this week." });
            window.location.reload();
        }
        setIsPurchasing(null);
    };

    const activeReg = registrations.find(r => r.competition_events.status === 'ongoing') || registrations[0];

    if (view === 'browser') {
        return (
            <div className="space-y-8 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => setView('hub')} className="text-gray-500 hover:text-white"><ArrowRight className="rotate-180 mr-2 h-4 w-4" /> Back to Hub</Button>
                    <h2 className="text-3xl font-black text-white tracking-tight">Tournament Browser</h2>
                </div>

                <div className="grid gap-6">
                    {isLoadingEvents ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary"/></div> : (
                        events.map(event => (
                            <GlassCard key={event.id} className={cn("p-6 flex flex-col md:flex-row items-center justify-between gap-6", event.status === 'ongoing' && "border-primary/30 bg-primary/5")}>
                                <div className="space-y-1 text-center md:text-left">
                                    <div className="flex items-center gap-3 justify-center md:justify-start">
                                        <h3 className="text-xl font-bold text-white">{event.week_label}</h3>
                                        {event.status === 'ongoing' && <Badge className="bg-red-500 animate-pulse text-[8px] font-black uppercase">LIVE NOW</Badge>}
                                        {event.is_free && <Badge className="bg-green-600 text-[8px] font-black uppercase">FREE</Badge>}
                                    </div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                        {new Date(event.start_date).toLocaleDateString()} — {new Date(event.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-center md:text-right">
                                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Entrance Fee</p>
                                        <p className="text-2xl font-black text-primary">{event.is_free ? 'FREE' : `₹${event.entry_fee}`}</p>
                                    </div>
                                    <Button onClick={() => handleJoin(event)} disabled={isPurchasing !== null} className="rounded-xl px-8 font-black uppercase tracking-widest h-12">
                                        {isPurchasing === event.id ? <Loader2 className="animate-spin h-4 w-4"/> : 'Join Week'}
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
            <div className="space-y-8 animate-in fade-in">
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tight">Tournaments</h2>
                    <p className="text-gray-400 text-lg mt-1 font-medium">Battle with other traders for massive funded rewards.</p>
                </div>
                <GlassCard className="text-center p-20 border-dashed border-white/5">
                    <Trophy className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white">No active entries</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mt-2 mb-8 text-sm">Join the next weekly tournament to prove your consistency and earn instant funding.</p>
                    <Button onClick={handleBrowse} size="lg" className="px-10 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                        Browse Active Tournaments <ArrowRight className="ml-2 w-4 h-4"/>
                    </Button>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tight">Active Tournament</h2>
                    <p className="text-gray-400 text-lg mt-1 font-medium">Tracking your performance for the current tournament week.</p>
                </div>
                <Button onClick={handleBrowse} variant="outline" className="bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10 rounded-full font-bold uppercase text-[10px] tracking-widest">
                    <PlusCircle className="mr-2 w-4 h-4 text-primary"/> Join Next Week
                </Button>
            </div>

            <GlassCard className="border-primary/20 bg-primary/5">
                <CardHeader className="border-b border-white/5 pb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl font-black text-white">{activeReg.competition_events.week_label}</CardTitle>
                            <CardDescription className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2">
                                Starts: {new Date(activeReg.competition_events.start_date).toLocaleDateString()} · Ends: {new Date(activeReg.competition_events.end_date).toLocaleDateString()}
                            </CardDescription>
                        </div>
                        <Badge className="bg-primary text-white font-black px-4 py-1 rounded-full text-[10px] tracking-widest">SECURED ENTRY</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                         <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Current Balance</p>
                                    <p className="text-2xl font-black text-primary mt-1">₹{Number(activeReg.current_balance).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Rank</p>
                                    <p className="text-2xl font-black text-white mt-1">#--</p>
                                </div>
                            </div>
                            <div className="p-6 bg-black/40 rounded-2xl border border-white/10 space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Trading ID</Label>
                                    <div className="flex items-center justify-between">
                                        <p className="font-mono font-bold text-white">{activeReg.stockmint_username || 'AWAITING SETUP'}</p>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => { navigator.clipboard.writeText(activeReg.stockmint_username || ''); toast({title: "Copied"}); }}><Copy className="w-4 h-4"/></Button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Master Password</Label>
                                    <div className="flex items-center justify-between">
                                        <p className="font-mono font-bold text-white">{visiblePasswords[activeReg.id] ? activeReg.stockmint_password : '••••••••••'}</p>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => setVisiblePasswords(p => ({...p, [activeReg.id]: !p[activeReg.id]}))}>{visiblePasswords[activeReg.id] ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => { navigator.clipboard.writeText(activeReg.stockmint_password || ''); toast({title: "Copied"}); }}><Copy className="w-4 h-4"/></Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                         </div>
                         <div className="text-center space-y-6">
                            <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(139,44,245,0.2)]">
                                <Zap className="h-10 w-10 text-primary animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white">Software Ready.</h3>
                                <p className="text-xs text-gray-400 max-w-[250px] mx-auto">Launch the StockMint terminal and login using the credentials on the left.</p>
                            </div>
                            <Button asChild size="lg" className="w-full h-14 text-lg font-black tracking-widest rounded-2xl shadow-xl shadow-primary/20">
                                <a href="https://stockmint.io/login" target="_blank">LAUNCH TERMINAL <ExternalLink className="ml-2 h-4 w-4"/></a>
                            </Button>
                         </div>
                    </div>
                </CardContent>
            </GlassCard>
        </div>
    );
}