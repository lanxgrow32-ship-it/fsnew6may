'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { 
    ShieldCheck, 
    IndianRupee, 
    ArrowRight,
    Inbox,
    Loader2,
    Search
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';

export default function SpecialistPanel() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const supabase = createClient();

    const fetchSpecialistTickets = async () => {
        const { data } = await supabase
            .from('support_conversations')
            .select('*, profiles:user_id(full_name, email)')
            .eq('assigned_role', 'specialist')
            .order('last_message_at', { ascending: false });
        setTickets(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchSpecialistTickets();
        const sub = supabase.channel('spec_v8').on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations', filter: "assigned_role=eq.specialist" }, fetchSpecialistTickets).subscribe();
        return () => { supabase.removeChannel(sub); };
    }, []);

    const filtered = tickets.filter(t => 
        t.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 font-poppins text-white">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <ShieldCheck className="text-primary h-7 w-7"/> Specialist Desk
                    </h2>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-[0.2em]">KYC & Payout High-Priority Protocol</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                    <Input 
                        placeholder="Filter protocol ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-black/40 border-white/10 h-11 text-xs font-bold uppercase tracking-widest rounded-xl"
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20"/></div> : filtered.length > 0 ? (
                    filtered.map(t => (
                        <Link key={t.id} href={`/support-agent/chat?id=${t.id}`} className="group">
                            <Card className="bg-white/5 border-white/10 hover:border-primary/50 transition-all overflow-hidden relative">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center border shadow-lg",
                                            t.escalation_reason === 'kyc' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"
                                        )}>
                                            {t.escalation_reason === 'kyc' ? <ShieldCheck className="h-6 w-6"/> : <IndianRupee className="h-6 w-6"/>}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg group-hover:text-primary transition-colors">{t.profiles?.full_name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest h-5 px-2 border-white/10">
                                                    {t.escalation_reason || 'General'} Specialist
                                                </Badge>
                                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{t.profiles?.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden md:block">
                                            <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest">Arrival</p>
                                            <p className="text-xs text-gray-400 font-medium mt-1">{formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-gray-800 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </CardContent>
                                {t.unread_count_admin > 0 && <div className="absolute top-0 right-0 w-1.5 h-full bg-primary shadow-[0_0_15px_rgba(139,44,245,0.5)]" />}
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="py-32 text-center space-y-6">
                        <Inbox className="h-16 w-16 text-gray-900 mx-auto" />
                        <div className="space-y-1">
                            <p className="text-gray-600 font-black uppercase text-xs tracking-[0.4em]">Protocol Standby</p>
                            <p className="text-gray-700 text-[10px] font-medium uppercase tracking-widest">No pending specialist escalations in the grid.</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
