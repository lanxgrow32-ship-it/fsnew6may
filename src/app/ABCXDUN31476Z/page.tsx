'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Phone, Check, Inbox, RefreshCw, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { markLeadAsDone } from './actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function LeadTerminalPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // START PROTOCOL: Only show signups from this exact moment onwards (Sep 24, 2026, 2:30 PM IST)
    const START_TIME = '2026-09-24T09:00:00Z';

    const fetchLeads = async () => {
        setLoading(true);
        const client = await supabase;
        
        const { data, error } = await client
            .from('profiles')
            .select('id, full_name, mobile_number, created_at')
            .or('role.neq.admin,role.is.null')
            .or('is_hidden.eq.false,is_hidden.is.null')
            .gte('created_at', START_TIME)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Fetch failure:", error);
            toast({ title: "Update failed", variant: "destructive" });
        } else {
            setLeads(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLeads();
        
        const channel = supabase
            .channel('new-leads-stream')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
                fetchLeads();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleDone = (userId: string) => {
        startTransition(async () => {
            const res = await markLeadAsDone(userId);
            if (res.success) {
                setLeads(prev => prev.filter(l => l.id !== userId));
                toast({ title: "Entry cleared" });
            } else {
                toast({ title: "Error", description: res.error, variant: "destructive" });
            }
        });
    };

    return (
        <main className="min-h-screen bg-slate-950 text-gray-200 font-poppins p-4 md:p-12">
            <header className="max-w-4xl mx-auto flex items-center justify-between mb-12 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white uppercase italic">Call Terminal</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-1">Live feed stream</p>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchLeads} disabled={loading} className="text-gray-500 hover:text-white">
                    <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
                </Button>
            </header>

            <div className="max-w-4xl mx-auto">
                <Card className="bg-[#11121d] border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                    <CardHeader className="bg-white/[0.01] border-b border-white/5 py-8 px-10">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg font-black text-white uppercase tracking-[0.1em]">Awaiting Call</CardTitle>
                            <span className="bg-primary/10 text-primary px-5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border border-primary/20">{leads.length} Pending</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading && leads.length === 0 ? (
                            <div className="py-24 text-center">
                                <Loader2 className="animate-spin h-10 w-10 mx-auto text-primary opacity-20" />
                            </div>
                        ) : leads.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-black/20">
                                        <TableRow className="border-white/5 h-16">
                                            <TableHead className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-10">Trader Name</TableHead>
                                            <TableHead className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mobile Number</TableHead>
                                            <TableHead className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Joined (IST)</TableHead>
                                            <TableHead className="text-right text-[10px] font-black text-gray-500 uppercase tracking-widest pr-10">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leads.map((lead) => {
                                            const utcDate = new Date(lead.created_at);
                                            // The user requested -5:30 relative to IST, which is raw UTC time.
                                            // We use utcDate directly to show the raw incoming time.
                                            
                                            return (
                                                <TableRow key={lead.id} className="border-white/5 hover:bg-white/[0.02] transition-colors h-28 group">
                                                    <TableCell className="pl-10">
                                                        <p className="font-bold text-white text-xl tracking-tight">{lead.full_name || 'Incomplete Profile'}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3 text-primary font-black text-xl">
                                                            <Phone className="h-5 w-5 opacity-40 text-primary" />
                                                            {lead.mobile_number || 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-gray-500 text-sm font-bold">
                                                            <Clock className="h-4 w-4 opacity-30" />
                                                            {format(utcDate, 'hh:mm a')}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-10">
                                                        <Button 
                                                            onClick={() => handleDone(lead.id)}
                                                            disabled={isPending}
                                                            className="bg-green-600 hover:bg-green-500 text-white font-black text-[10px] uppercase tracking-[0.2em] h-12 px-8 rounded-2xl shadow-xl shadow-green-900/20"
                                                        >
                                                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                                            Called
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-40 text-center space-y-4">
                                <Inbox className="h-20 w-20 text-slate-900 mx-auto" />
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Queue Empty</h3>
                                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.4em]">Standby for new incoming signals</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <footer className="max-w-4xl mx-auto mt-24 pt-8 border-t border-white/5 text-center">
                <p className="text-[9px] text-gray-800 font-bold uppercase tracking-[0.8em]">Secure calling node · -5:30 offset synced</p>
            </footer>
        </main>
    );
}
