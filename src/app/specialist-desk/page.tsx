'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { 
    ShieldCheck, 
    ArrowRight,
    Inbox,
    Loader2,
    Search,
    ChevronRight,
    Activity,
    ShieldAlert,
    Clock
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';

export default function SpecialistDashboard() {
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
        const sub = supabase.channel('specialist_desk_sync').on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations', filter: "assigned_role=eq.specialist" }, fetchSpecialistTickets).subscribe();
        return () => { supabase.removeChannel(sub); };
    }, []);

    const filtered = tickets.filter(t => 
        t.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 font-poppins text-white">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-white/5 pb-8">
                <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tighter text-white">COMMAND CENTER</h2>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em] flex items-center gap-2">
                        <Activity className="h-3 w-3 animate-pulse text-green-400" />
                        Active Technical Mitigations
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-grow lg:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                        <Input 
                            placeholder="Filter stream..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-black/40 border-white/10 h-11 text-[10px] font-bold uppercase tracking-widest rounded-xl"
                        />
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">In Mitigation</p>
                        <p className="text-xl font-black text-green-400">{filtered.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {loading ? (
                    <div className="col-span-full py-32 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-green-500 opacity-20"/></div>
                ) : filtered.length > 0 ? (
                    filtered.map(t => (
                        <Link key={t.id} href={`/specialist-desk/chat?id=${t.id}`} className="group">
                            <Card className="bg-slate-900/50 border-white/5 hover:border-green-500/30 transition-all duration-300 rounded-3xl overflow-hidden relative shadow-2xl">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className={cn(
                                            "text-[9px] font-black uppercase tracking-widest h-6 px-3 border-none",
                                            t.escalation_reason === 'kyc' ? "bg-green-500/10 text-green-400" : "bg-primary/10 text-primary"
                                        )}>
                                            {t.escalation_reason || 'Manual'} Focus
                                        </Badge>
                                        <p className="text-[9px] text-gray-600 font-bold uppercase">{formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}</p>
                                    </div>
                                    <CardTitle className="text-xl font-black text-white mt-3 group-hover:text-green-400 transition-colors truncate">{t.profiles?.full_name}</CardTitle>
                                    <CardDescription className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t.profiles?.email}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                        <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest mb-2">Protocol Handover Context</p>
                                        <p className="text-xs text-gray-400 line-clamp-2 font-medium leading-relaxed italic">
                                            "{t.last_message_preview || 'Awaiting specialist intervention...'}"
                                        </p>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white/[0.02] border-t border-white/5 py-4 flex justify-between items-center group-hover:bg-green-500/5 transition-all">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-green-400">Initialize Response</span>
                                    <ArrowRight className="h-4 w-4 text-gray-800 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                                </CardFooter>
                                {t.unread_count_admin > 0 && (
                                    <div className="absolute top-2 right-2">
                                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]" />
                                    </div>
                                )}
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full py-40 text-center space-y-6 bg-white/[0.01] rounded-[40px] border border-dashed border-white/5">
                        <Inbox className="h-16 w-16 text-slate-900 mx-auto" />
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-white tracking-tighter">Systems Nominal</h3>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">No technical protocol escalations detected.</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
