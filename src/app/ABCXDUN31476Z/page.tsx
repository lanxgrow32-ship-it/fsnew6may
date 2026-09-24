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

    // Protocol: Only show signups from now onwards (Feb 13, 2025)
    // and only those not yet marked as 'Done' on this specific page.
    const START_TIME = '2025-02-13T00:00:00Z';

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
        
        // Listen for new signups in real-time
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
                // Instantly vanish from THIS list
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
                    <h1 className="text-3xl font-bold tracking-tight text-white">Call list</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">New signups from today</p>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchLeads} disabled={loading} className="text-gray-500 hover:text-white">
                    <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
                </Button>
            </header>

            <div className="max-w-4xl mx-auto">
                <Card className="bg-white/5 border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
                    <CardHeader className="bg-white/[0.02] border-b border-white/5 py-6 px-8">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-widest">Awaiting call</CardTitle>
                            <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase">{leads.length} Pending</span>
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
                                        <TableRow className="border-white/5 h-14">
                                            <TableHead className="text-[10px] font-bold text-gray-600 uppercase pl-8">Trader name</TableHead>
                                            <TableHead className="text-[10px] font-bold text-gray-600 uppercase">Mobile number</TableHead>
                                            <TableHead className="text-[10px] font-bold text-gray-600 uppercase">Joined (IST)</TableHead>
                                            <TableHead className="text-right text-[10px] font-bold text-gray-600 uppercase pr-8">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leads.map((lead) => {
                                            const utcDate = new Date(lead.created_at);
                                            const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
                                            
                                            return (
                                                <TableRow key={lead.id} className="border-white/5 hover:bg-white/[0.02] transition-colors h-24 group">
                                                    <TableCell className="pl-8">
                                                        <p className="font-bold text-white text-base">{lead.full_name || 'Incomplete profile'}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3 text-primary font-black font-mono text-base">
                                                            <Phone className="h-4 w-4 opacity-40" />
                                                            {lead.mobile_number || 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                                                            <Clock className="h-3.5 w-3.5 opacity-30" />
                                                            {format(istDate, 'hh:mm a')}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-8">
                                                        <Button 
                                                            onClick={() => handleDone(lead.id)}
                                                            disabled={isPending}
                                                            className="bg-green-600 hover:bg-green-500 text-white font-bold text-[10px] uppercase tracking-widest h-11 px-6 rounded-xl shadow-lg"
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
                                <Inbox className="h-16 w-16 text-slate-900 mx-auto" />
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">All caught up</h3>
                                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">No new signups to call right now</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <footer className="max-w-4xl mx-auto mt-24 pt-8 border-t border-white/5 text-center">
                <p className="text-[9px] text-gray-800 font-bold uppercase tracking-[0.6em]">Internal calling queue · Real-time data</p>
            </footer>
        </main>
    );
}