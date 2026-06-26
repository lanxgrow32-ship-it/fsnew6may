'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, LifeBuoy, Users, Zap, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SupportAgentDashboard() {
    const [stats, setStats] = useState({ openChats: 0, openTickets: 0, totalUsers: 0 });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            const [chatRes, ticketRes, profileRes] = await Promise.all([
                supabase.from('support_conversations').select('id', { count: 'exact' }).eq('status', 'open'),
                supabase.from('tickets').select('id', { count: 'exact' }).eq('status', 'Open'),
                supabase.from('profiles').select('id', { count: 'exact' })
            ]);
            setStats({
                openChats: chatRes.count || 0,
                openTickets: ticketRes.count || 0,
                totalUsers: profileRes.count || 0
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) => (
        <Card className="bg-white/5 border-white/10 overflow-hidden relative group transition-all hover:border-primary/50">
            <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${color}`}>
                <Icon className="w-20 h-20" />
            </div>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-white">{loading ? <Skeleton className="h-9 w-16 bg-white/5"/> : value}</div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <Clock className="w-3 h-3" /> Real-time Sync
                </div>
            </CardContent>
        </Card>
    );

    return (
        <main className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">Agent Overview</h2>
                <p className="text-gray-400 text-sm font-medium">Monitor active protocols and system health.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Active Live Chats" value={stats.openChats} icon={MessageSquare} color="text-primary" />
                <StatCard title="Open Support Tickets" value={stats.openTickets} icon={LifeBuoy} color="text-purple-400" />
                <StatCard title="Total Traders" value={stats.totalUsers} icon={Users} color="text-blue-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                            <Zap className="w-5 h-5 text-primary" /> System Directives
                        </CardTitle>
                        <CardDescription className="text-xs font-medium">Standard operating procedures for agents.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-sm leading-relaxed text-gray-300">
                            <p className="font-bold text-white mb-2">Rule 01: Protocol Compliance</p>
                            Ensure all KYC verifications are manually cross-referenced with Aadhaar/PAN data before approval.
                        </div>
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-sm leading-relaxed text-gray-300">
                            <p className="font-bold text-white mb-2">Rule 02: Response SLA</p>
                            Maintain a maximum first-response time of 5 minutes for live chat sessions.
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 flex flex-col justify-center items-center text-center p-8">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 mb-6 shadow-[0_0_40px_rgba(139,44,245,0.15)]">
                        <Users className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Protocol Ready</h3>
                    <p className="text-sm text-gray-500 max-w-xs mb-8 font-medium">Select a module from the sidebar to begin assisting traders in the arena.</p>
                </Card>
            </div>
        </main>
    );
}
