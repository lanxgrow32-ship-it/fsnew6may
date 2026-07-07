
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { 
    ShieldCheck, 
    IndianRupee, 
    MessageSquare, 
    ArrowRight,
    Inbox,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function SpecialistPanel() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
        const sub = supabase.channel('specialist_sync').on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations' }, fetchSpecialistTickets).subscribe();
        return () => { supabase.removeChannel(sub); };
    }, []);

    return (
        <main className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 font-poppins text-white">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <ShieldCheck className="text-primary h-6 w-6"/> Specialist Desk
                    </h2>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">KYC & Payout Priority Ledger</p>
                </div>
                <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Queue Status: Active</p>
                </div>
            </div>

            <div className="grid gap-4">
                {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20"/></div> : tickets.length > 0 ? (
                    tickets.map(t => (
                        <Link key={t.id} href={`/support-agent/chat?id=${t.id}`} className="group">
                            <Card className="bg-white/5 border-white/10 hover:border-primary/50 transition-all overflow-hidden relative">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center border",
                                            t.escalation_reason === 'kyc' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"
                                        )}>
                                            {t.escalation_reason === 'kyc' ? <ShieldCheck className="h-6 w-6"/> : <IndianRupee className="h-6 w-6"/>}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{t.profiles?.full_name}</h3>
                                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Reason: {t.escalation_reason} protocol</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden md:block">
                                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Escalated</p>
                                            <p className="text-xs text-gray-400 font-medium mt-1">{formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-gray-700 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </CardContent>
                                {t.unread_count_admin > 0 && <div className="absolute top-0 right-0 w-1.5 h-full bg-primary" />}
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="py-32 text-center space-y-4">
                        <Inbox className="h-16 w-16 text-gray-900 mx-auto" />
                        <p className="text-gray-600 font-black uppercase text-xs tracking-[0.3em]">Protocol Idle · No Pending Escalations</p>
                    </div>
                )}
            </div>
        </main>
    );
}
