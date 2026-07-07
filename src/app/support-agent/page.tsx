
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Users, Clock, BrainCircuit, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toggleAiSupport } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export default function SupportAgentDashboard() {
    const [stats, setStats] = useState({ openChats: 0, totalUsers: 0 });
    const [isAiEnabled, setIsAiEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const supabase = createClient();

    const fetchStats = async () => {
        const [chatRes, profileRes, settingsRes] = await Promise.all([
            supabase.from('support_conversations').select('id', { count: 'exact' }).eq('status', 'open'),
            supabase.from('profiles').select('id', { count: 'exact' }),
            supabase.from('payment_details').select('is_ai_support_enabled').eq('id', 1).single()
        ]);
        setStats({
            openChats: chatRes.count || 0,
            totalUsers: profileRes.count || 0
        });
        if (settingsRes.data) setIsAiEnabled(settingsRes.data.is_ai_support_enabled);
        setLoading(false);
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleAiToggle = (checked: boolean) => {
        startTransition(async () => {
            const res = await toggleAiSupport(checked);
            if (res.error) toast({ title: "Toggle Failed", description: res.error, variant: "destructive" });
            else {
                setIsAiEnabled(checked);
                toast({ title: checked ? "Neural Support Active" : "Manual Mode Restored" });
            }
        });
    };

    const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) => (
        <Card className="bg-white/5 border-white/10 overflow-hidden relative group transition-all hover:border-primary/50">
            <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${color}`}>
                <Icon className="w-20 h-20" />
            </div>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-white">{loading ? <Skeleton className="h-9 w-16 bg-white/5"/> : value}</div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-gray-500">
                    <Clock className="w-3 h-3" /> Real-time update
                </div>
            </CardContent>
        </Card>
    );

    return (
        <main className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Agent Dashboard</h2>
                    <p className="text-gray-400 text-sm font-medium">Monitor active support sessions and platform health.</p>
                </div>

                <Card className="w-full md:w-80 bg-primary/5 border-primary/20 shadow-2xl">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BrainCircuit className={isAiEnabled ? "text-primary" : "text-gray-600"} />
                                <Label className="text-xs font-black uppercase tracking-widest text-white">Neural Protocol</Label>
                            </div>
                            <Switch checked={isAiEnabled} onCheckedChange={handleAiToggle} disabled={isPending} />
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                            {isAiEnabled 
                                ? "AI is currently handling L1 queries using live database context." 
                                : "Neural engine is in standby. All queries routed to manual queue."}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                <StatCard title="Active Live Chats" value={stats.openChats} icon={MessageSquare} color="text-primary" />
                <StatCard title="Total Traders" value={stats.totalUsers} icon={Users} color="text-blue-400" />
            </div>
            
            <div className="pt-20 text-center">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 mx-auto mb-6 shadow-[0_0_50px_rgba(139,44,245,0.1)]">
                    <ShieldCheck className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-white">Security Protocol Active</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2">The support grid is online. Select Live Chat from the sidebar to begin assistance.</p>
            </div>
        </main>
    );
}
