
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Trophy, TrendingDown, Zap, Medal } from 'lucide-react';
import { getLeaderboard, getCompetitionEvents } from '../actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FundedStockLogo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { ClientOnly } from '@/components/ui/client-only';

function LeaderboardContent() {
    const [data, setData] = useState<any[]>([]);
    const [ongoingEvent, setOngoingEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            const events = await getCompetitionEvents();
            const active = events.find(e => e.status === 'ongoing');
            
            if (active) {
                setOngoingEvent(active);
                const rankings = await getLeaderboard(active.id);
                setData(rankings);
            }
            setLoading(false);
        };
        fetchLeaderboard();
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 text-white font-poppins relative overflow-hidden pb-20">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-25%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full filter blur-3xl opacity-20 " />
                <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-purple-600 rounded-full filter blur-3xl opacity-10" />
            </div>

            <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto flex items-center justify-between px-4 h-20">
                    <Link href="/competition" className="flex items-center gap-2 group">
                        <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                        <FundedStockLogo className="h-8 w-auto text-primary" />
                        <span className="font-bold text-lg hidden sm:inline-block">Competition Hub</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Link href="/competition#join-form">Join Next Battle</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <section className="relative z-10 pt-12">
                <div className="container mx-auto px-4 max-w-5xl space-y-12">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">
                            <Zap className="h-3 w-3" /> Live Rankings
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white">The Champions <br /> <span className="text-primary">Leaderboard.</span></h1>
                        {ongoingEvent && (
                            <p className="text-gray-400 text-lg">
                                Tracking performance for <span className="text-white font-bold">{ongoingEvent.week_label}</span>
                            </p>
                        )}
                    </div>

                    {!loading && data.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                             {/* 2nd Place */}
                             {data[1] && (
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center space-y-4 order-2 md:order-1 self-end md:h-[280px] flex flex-col justify-center">
                                    <div className="text-4xl grayscale opacity-70">🥈</div>
                                    <h3 className="text-xl font-bold text-white truncate px-2">{data[1].name}</h3>
                                    <p className="text-2xl font-black text-gray-300 font-mono">₹{Number(data[1].balance).toLocaleString('en-IN')}</p>
                                </div>
                             )}
                             {/* 1st Place */}
                             {data[0] && (
                                <div className="bg-primary/10 backdrop-blur-xl border-2 border-primary p-8 rounded-3xl text-center space-y-6 order-1 md:order-2 md:-translate-y-6 shadow-[0_0_50px_rgba(234,179,8,0.2)] md:h-[340px] flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.2),transparent)] opacity-50 animate-pulse" />
                                    <div className="text-6xl relative z-10">🥇</div>
                                    <h3 className="text-3xl font-bold text-white relative z-10 truncate px-2">{data[0].name}</h3>
                                    <p className="text-4xl font-black text-primary font-mono relative z-10">₹{Number(data[0].balance).toLocaleString('en-IN')}</p>
                                    <div className="bg-primary/20 text-primary text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full w-fit mx-auto relative z-10">Current Champion</div>
                                </div>
                             )}
                             {/* 3rd Place */}
                             {data[2] && (
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center space-y-4 order-3 md:order-3 self-end md:h-[280px] flex flex-col justify-center">
                                    <div className="text-4xl sepia opacity-70">🥉</div>
                                    <h3 className="text-xl font-bold text-white truncate px-2">{data[2].name}</h3>
                                    <p className="text-2xl font-black text-orange-600 font-mono">₹{Number(data[2].balance).toLocaleString('en-IN')}</p>
                                </div>
                             )}
                        </div>
                    )}

                    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden mt-12">
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
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-24">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                                    <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Fetching Live Scores...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : data.length > 0 ? (
                                        data.map((row, i) => (
                                            <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-all duration-300 h-20 group">
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center">
                                                        {i === 0 ? <div className="h-10 w-10 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 flex items-center justify-center font-black text-sm">1</div> : 
                                                         i === 1 ? <div className="h-10 w-10 rounded-full bg-gray-300/20 text-gray-300 border border-gray-300/30 flex items-center justify-center font-black text-sm">2</div> : 
                                                         i === 2 ? <div className="h-10 w-10 rounded-full bg-orange-500/20 text-orange-500 border border-orange-500/30 flex items-center justify-center font-black text-sm">3</div> : 
                                                         <span className="text-gray-500 font-mono font-bold text-sm group-hover:text-white transition-colors">#{i + 1}</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-lg text-white group-hover:text-primary transition-colors">{row.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-primary font-black text-2xl pr-8">
                                                    ₹{Number(row.balance).toLocaleString('en-IN')}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-24 text-gray-500">
                                                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                <p className="text-lg font-bold">The battle is starting soon!</p>
                                                <p className="text-sm">Leaderboard will automatically update as soon as the first trade is placed.</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </div>
                </div>
            </section>
            
            <footer className="py-20 text-center text-sm text-gray-600">
                <div className="container mx-auto px-4 space-y-4">
                    <FundedStockLogo className="h-8 w-8 mx-auto opacity-20 grayscale" />
                    <p className="font-bold tracking-widest uppercase text-[10px]">Proprietary Simulated Rankings · Real-time Feed</p>
                </div>
            </footer>
        </main>
    );
}

export default function LeaderboardPage() {
    return (
        <div className="dark">
            <ClientOnly>
                <LeaderboardContent />
            </ClientOnly>
        </div>
    )
}
