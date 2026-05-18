
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Eye, EyeOff, History, Copy, Clock, ShieldCheck, CheckCircle } from 'lucide-react';
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

export function CompetitionView({ registrations }: { registrations: Registration[] }) {
    const { toast } = useToast();
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

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

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Competition Hub</h2>

            <div className="grid grid-cols-1 gap-8">
                {/* Primary/Active Registration */}
                <GlassCard className={cn("border-white/10", !activeReg.is_approved && "border-amber-400/30")}>
                    <CardHeader className="bg-white/[0.02] border-b border-white/5">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-2xl font-bold text-white">{activeReg.competition_events.week_label}</CardTitle>
                                <CardDescription className="text-gray-400">
                                    {new Date(activeReg.competition_events.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} — 
                                    {new Date(activeReg.competition_events.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </CardDescription>
                            </div>
                            {activeReg.is_approved ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">Active</Badge>
                            ) : (
                                <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30 px-3 py-1 animate-pulse">Verification Pending</Badge>
                            )}
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-8">
                        {!activeReg.is_approved ? (
                            <div className="text-center space-y-4 py-8">
                                <div className="mx-auto bg-amber-400/10 rounded-full p-4 w-fit">
                                    <Loader2 className="h-10 w-10 text-amber-400 animate-spin" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Verification in Progress</h3>
                                <p className="text-gray-400 max-w-sm mx-auto">
                                    We are currently verifying your payment UTR. Your credentials will appear here automatically once approved.
                                </p>
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
                                            <TableCell className="font-semibold text-white">{reg.competition_events.week_label}</TableCell>
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
            
            <div className="text-center pt-8">
                <Button asChild variant="outline" className="bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
                    <Link href="/competition">Join Another Week <PlusCircle className="ml-2 w-4 h-4"/></Link>
                </Button>
            </div>
        </div>
    );
}
