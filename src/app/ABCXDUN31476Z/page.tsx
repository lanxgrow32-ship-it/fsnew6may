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

    const fetchLeads = async () => {
        setLoading(true);
        const client = await supabase;
        
        // Fetch only uncalled, non-hidden users who are not admins
        const { data, error } = await client
            .from('profiles')
            .select('id, full_name, mobile_number, created_at')
            .or('role.neq.admin,role.is.null')
            .or('is_hidden.eq.false,is_hidden.is.null')
            .order('created_at', { ascending: false })
            .range(0, 500);

        if (error) {
            console.error("Fetch Failure:", error);
            toast({ title: "Fetch Error", variant: "destructive" });
        } else {
            setLeads(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLeads();
        
        // Real-time listener for new signups
        const channel = supabase
            .channel('lead-stream-terminal')
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
                toast({ title: "Lead Processed", description: "Entry removed from queue." });
            } else {
                toast({ title: "Error", description: res.error, variant: "destructive" });
            }
        });
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white font-poppins p-4 md:p-8">
            <header className="max-w-4xl mx-auto flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Lead Terminal</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Real-time call queue</p>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchLeads} disabled={loading} className="text-gray-500 hover:text-white">
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
            </header>

            <div className="max-w-4xl mx-auto">
                <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <CardHeader className="bg-white/[0.02] border-b border-white/5 py-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Signups</CardTitle>
                            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase">{leads.length} Pending</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading && leads.length === 0 ? (
                            <div className="py-20 text-center">
                                <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary opacity-30" />
                            </div>
                        ) : leads.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-black/20">
                                        <TableRow className="border-white/5 h-12">
                                            <TableHead className="text-[10px] font-bold text-gray-600 uppercase pl-6">Trader Name</TableHead>
                                            <TableHead className="text-[10px] font-bold text-gray-600 uppercase">Mobile Number</TableHead>
                                            <TableHead className="text-[10px] font-bold text-gray-600 uppercase">Joined (IST)</TableHead>
                                            <TableHead className="text-right text-[10px] font-bold text-gray-600 uppercase pr-6">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leads.map((lead) => {
                                            const utcDate = new Date(lead.created_at);
                                            const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
                                            
                                            return (
                                                <TableRow key={lead.id} className="border-white/5 hover:bg-white/[0.02] transition-colors h-20 group">
                                                    <TableCell className="pl-6">
                                                        <p className="font-bold text-white text-sm">{lead.full_name || 'Anonymous'}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-primary font-bold font-mono text-sm">
                                                            <Phone className="h-3 w-3 opacity-50" />
                                                            {lead.mobile_number || 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-gray-500 text-[11px] font-medium">
                                                            <Clock className="h-3 w-3 opacity-30" />
                                                            {format(istDate, 'dd MMM, hh:mm a')}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => handleDone(lead.id)}
                                                            disabled={isPending}
                                                            className="bg-green-600 hover:bg-green-500 text-white font-bold text-[10px] uppercase tracking-widest h-9 px-4 rounded-xl shadow-lg"
                                                        >
                                                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1.5" />}
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
                            <div className="py-32 text-center space-y-4">
                                <Inbox className="h-12 w-12 text-slate-900 mx-auto" />
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-white">Queue empty</h3>
                                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">No new signups to call right now</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <footer className="max-w-4xl mx-auto mt-20 pt-8 border-t border-white/5 text-center">
                <p className="text-[9px] text-gray-800 font-bold uppercase tracking-[0.5em]">Internal lead queue</p>
            </footer>
        </main>
    );
}