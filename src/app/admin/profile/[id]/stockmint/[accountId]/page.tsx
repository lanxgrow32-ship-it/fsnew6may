
'use client';

import { useState, useEffect, use, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Loader2, 
    ArrowLeft, 
    ShieldAlert, 
    Zap,
    RefreshCw,
    Lock,
    Unlock,
    Activity,
    Target,
    History,
    TrendingUp,
    Database,
    ShieldCheck,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    IndianRupee,
    LayoutGrid,
    Target as TargetIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
    getMasterSync, 
    resetAccount, 
    calibrateAccount, 
    updateClassification, 
    updateTerminalStatus 
} from '../../actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
    <Card className="bg-black/40 border-white/5 shadow-2xl">
        <CardHeader className="py-4">
            <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em]">{title}</CardTitle>
                <div className={cn("p-1.5 rounded-lg bg-white/5", color)}>
                    <Icon className="h-3 w-3" />
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-2xl font-black text-white">{value}</p>
        </CardContent>
    </Card>
);

function TerminalInsight({ email }: { email: string }) {
    const [syncData, setSyncData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const fetchSync = async () => {
        if (!email) return;
        setLoading(true);
        const res = await getMasterSync(email);
        
        if (res.error) {
            toast({ title: "Sync Failed", description: res.error, variant: "destructive" });
        } else {
            // Handle both {success, data} wrapper and direct payload
            const actualData = res.data || (res.success ? res.data : res);
            setSyncData(actualData);
        }
        setLoading(false);
    };

    useEffect(() => { 
        fetchSync(); 
    }, [email]);

    const handleAction = (action: () => Promise<any>, successMsg: string) => {
        startTransition(async () => {
            const res = await action();
            if (res.error) {
                toast({ title: "Action Failed", description: res.error, variant: "destructive" });
            } else {
                toast({ title: successMsg });
                fetchSync();
            }
        });
    };

    if (loading) return (
        <div className="py-40 text-center space-y-4">
            <Loader2 className="animate-spin h-10 w-10 mx-auto text-primary opacity-30"/>
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Establishing Secure Sync...</p>
        </div>
    );

    if (!syncData || (Object.keys(syncData).length === 0 && !loading)) {
        return (
            <div className="py-40 text-center space-y-6 bg-white/[0.01] rounded-[40px] border border-dashed border-white/5">
                <Database className="h-12 w-12 text-slate-900 mx-auto" />
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Handshake Failed</h2>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">Engine could not resolve trading ID: {email}</p>
                </div>
                <Button onClick={fetchSync} variant="outline" className="border-white/10 text-white font-black text-[10px] uppercase h-10 rounded-xl px-8">Retry Connection</Button>
            </div>
        );
    }

    // Normalized Data Mapping (supports multiple API versions)
    const balance = syncData.balance ?? syncData.live_cash_balance ?? 0;
    const highWaterMark = syncData.highWaterMark ?? syncData.high_water_mark ?? 0;
    const openingBalance = syncData.openingBalance ?? syncData.opening_balance ?? 0;
    const maxDrawdown = syncData.maxDrawdownPct ?? syncData.max_drawdown_pct ?? '--';
    const dailyLoss = syncData.dailyLossPct ?? syncData.daily_loss_pct ?? '--';
    const perTrade = syncData.perTradePct ?? syncData.per_trade_pct ?? '--';
    const trades = syncData.executionRequests ?? syncData.execution_requests ?? [];
    const pnlRecords = syncData.pnlRecords ?? syncData.pnl_records ?? [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Live Financial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Live Cash Balance" value={`₹${Number(balance).toLocaleString()}`} icon={IndianRupee} color="text-white" />
                <StatCard title="High Water Mark" value={`₹${Number(highWaterMark).toLocaleString()}`} icon={TrendingUp} color="text-primary" />
                <StatCard title="Opening Balance" value={`₹${Number(openingBalance).toLocaleString()}`} icon={History} color="text-gray-500" />
            </div>

            {/* Risk Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/10 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Max Drawdown</p>
                        <p className="text-xl font-bold text-white">{maxDrawdown}%</p>
                    </div>
                    <ShieldAlert className="w-5 h-5 text-red-500 opacity-30" />
                </div>
                <div className="p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Daily Loss Limit</p>
                        <p className="text-xl font-bold text-white">{dailyLoss}%</p>
                    </div>
                    <Activity className="w-5 h-5 text-amber-500 opacity-30" />
                </div>
                <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Risk Per Trade</p>
                        <p className="text-xl font-bold text-white">{perTrade}%</p>
                    </div>
                    <TargetIcon className="w-5 h-5 text-blue-500 opacity-30" />
                </div>
            </div>

            {/* Hub Command Module */}
            <GlassCard className="p-6 bg-primary/5 border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12"><Database className="w-40 h-40" /></div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.4em]">Engine Command Module</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button 
                            variant="outline" 
                            size="lg" 
                            onClick={() => {
                                const bal = prompt("Enter Start Balance for Reset:", balance);
                                if(bal) handleAction(() => resetAccount(email, parseFloat(bal)), "Engine Reset Complete");
                            }}
                            className="h-12 text-[10px] font-black uppercase tracking-widest bg-black/40 border-white/10 hover:bg-black/60 rounded-xl"
                            disabled={isPending}
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isPending && "animate-spin")} /> Re-Initialize Account
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            size="lg" 
                            onClick={() => {
                                const bal = prompt("Enter New Balance:", balance);
                                const hwm = prompt("Enter New HWM:", highWaterMark);
                                if(bal && hwm) handleAction(() => calibrateAccount(email, parseFloat(bal), parseFloat(hwm)), "Calibration Successful");
                            }}
                            className="h-12 text-[10px] font-black uppercase tracking-widest bg-black/40 border-white/10 hover:bg-black/60 rounded-xl"
                            disabled={isPending}
                        >
                            <Zap className="w-3.5 h-3.5 mr-2 text-primary fill-primary" /> Calibrate Metrics
                        </Button>

                        <Button 
                            variant="outline" 
                            size="lg" 
                            onClick={() => {
                                const status = syncData.status === 'active' ? 'blocked' : 'active';
                                handleAction(() => updateTerminalStatus(email, status, "ADMIN_MITIGATION"), `Terminal status: ${status.toUpperCase()}`);
                            }}
                            className={cn(
                                "h-12 text-[10px] font-black uppercase tracking-widest rounded-xl",
                                syncData.status === 'active' ? "text-red-400 hover:text-red-300 border-red-500/20 bg-red-500/5" : "text-green-400 hover:text-green-300 border-green-500/20 bg-green-500/5"
                            )}
                            disabled={isPending}
                        >
                            {syncData.status === 'active' ? <Lock className="w-3.5 h-3.5 mr-2" /> : <Unlock className="w-3.5 h-3.5 mr-2" />}
                            {syncData.status === 'active' ? 'Freeze Terminal' : 'Release Terminal'}
                        </Button>

                        <div className="ml-auto min-w-[220px]">
                            <Select onValueChange={(val) => handleAction(() => updateClassification(email, val), `Tier Updated to ${val}`)}>
                                <SelectTrigger className="h-12 text-[10px] font-black uppercase tracking-widest bg-black/60 border-white/10 rounded-xl">
                                    <SelectValue placeholder="TIER PROMOTION" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                    <SelectItem value="evaluation" className="text-[10px] font-bold uppercase">Evaluation</SelectItem>
                                    <SelectItem value="one_step_live" className="text-[10px] font-bold uppercase">1-Step Live</SelectItem>
                                    <SelectItem value="two_step_phase_2" className="text-[10px] font-bold uppercase">2-Step Phase 2</SelectItem>
                                    <SelectItem value="two_step_live" className="text-[10px] font-bold uppercase">2-Step Live</SelectItem>
                                    <SelectItem value="instant_pro" className="text-[10px] font-bold uppercase">Instant Pro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Terminal Ledgers */}
            <Tabs defaultValue="trades" className="w-full">
                <TabsList className="bg-black/60 border border-white/5 p-1 h-12 rounded-[20px] mb-6">
                    <TabsTrigger value="trades" className="px-8 text-[10px] font-black uppercase tracking-widest rounded-[14px] data-[state=active]:bg-primary data-[state=active]:text-white">Execution Stream (Last 50)</TabsTrigger>
                    <TabsTrigger value="pnl" className="px-8 text-[10px] font-black uppercase tracking-widest rounded-[14px] data-[state=active]:bg-primary data-[state=active]:text-white">Historical P&L</TabsTrigger>
                </TabsList>
                
                <TabsContent value="trades" className="animate-in slide-in-from-bottom-2">
                    <div className="rounded-[32px] border border-white/5 bg-black/30 overflow-hidden shadow-2xl">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="h-14 border-white/5">
                                    <TableHead className="text-[10px] font-black uppercase text-gray-500 pl-8">Timestamp</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-gray-500">Symbol</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-gray-500">Side</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-gray-500">Price</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-gray-500 pr-8">Result</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trades.length > 0 ? trades.map((req: any, i: number) => (
                                    <TableRow key={i} className="h-16 border-white/5 hover:bg-white/[0.03] transition-colors">
                                        <TableCell className="text-[11px] font-mono text-gray-400 pl-8">{req.createdAt ? format(new Date(req.createdAt), 'dd MMM, HH:mm:ss') : 'N/A'}</TableCell>
                                        <TableCell className="text-[11px] font-black text-white">{req.symbol}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-3 h-6", req.side === 'BUY' ? "text-green-400 border-green-500/20 bg-green-500/5" : "text-red-400 border-red-500/20 bg-red-500/5")}>
                                                {req.side}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-[11px] font-bold text-gray-300">₹{req.price}</TableCell>
                                        <TableCell className="text-right pr-8">
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", req.status === 'FILLED' ? "text-green-500" : "text-gray-500")}>
                                                {req.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={5} className="py-20 text-center text-gray-700 font-black uppercase text-[10px] tracking-widest">No terminal activity found</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="pnl" className="animate-in slide-in-from-bottom-2">
                    <div className="rounded-[32px] border border-white/5 bg-black/30 overflow-hidden shadow-2xl">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="h-14 border-white/5">
                                    <TableHead className="text-[10px] font-black uppercase text-gray-500 pl-8">Trading Date</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-gray-500">Start Balance</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-gray-500">Close Balance</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-gray-500 pr-8">Net P&L</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pnlRecords.length > 0 ? pnlRecords.map((rec: any, i: number) => (
                                    <TableRow key={i} className="h-16 border-white/5 hover:bg-white/[0.03] transition-colors">
                                        <TableCell className="text-[11px] font-bold text-gray-400 pl-8">{rec.date ? format(new Date(rec.date), 'dd MMM yyyy') : 'N/A'}</TableCell>
                                        <TableCell className="text-[11px] font-medium">₹{rec.startBalance?.toLocaleString()}</TableCell>
                                        <TableCell className="text-[11px] font-medium">₹{rec.endBalance?.toLocaleString()}</TableCell>
                                        <TableCell className={cn("text-right pr-8 text-sm font-black", rec.netPnl >= 0 ? "text-green-400" : "text-red-400")}>
                                            {rec.netPnl >= 0 ? '+' : ''}₹{rec.netPnl?.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={4} className="py-20 text-center text-gray-700 font-black uppercase text-[10px] tracking-widest">No historical P&L records</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function StockmintInfoPage({ params }: { params: Promise<{ id: string, accountId: string }> }) {
  const { id, accountId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [account, setAccount] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchAccount = async () => {
        const { data } = await supabase.from('user_accounts').select('*').eq('id', accountId).single();
        if (data) setAccount(data);
        setIsFetching(false);
    };
    fetchAccount();
  }, [accountId, supabase]);

  if (isFetching) return (
    <div className="bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary opacity-30"/>
    </div>
  );

  return (
    <div className="bg-slate-950 min-h-screen font-poppins pb-20 text-gray-200">
        <header className="flex h-20 items-center gap-6 px-8 border-b border-white/5 bg-slate-900/50 sticky top-0 z-50 backdrop-blur-xl">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl bg-black/40 border border-white/10 text-white hover:bg-white/5"><ArrowLeft className="h-5 w-5"/></Button>
            <div>
                <h1 className="text-2xl font-black tracking-tight text-white uppercase">{account?.plan_name || 'Terminal Insight'}</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.5em] mt-1.5">Hub Username: {account?.trading_username}</p>
            </div>
            <div className="ml-auto">
                 <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest">Live Engine Feed</Badge>
            </div>
        </header>

        <main className="max-w-6xl mx-auto p-8 pt-12">
            {account?.trading_username ? (
                <TerminalInsight email={account.trading_username} />
            ) : (
                <div className="py-40 text-center">
                    <Database className="w-20 h-20 text-slate-900 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Connection Severed</h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.4em] mt-2">No valid trading ID found for this record</p>
                </div>
            )}
        </main>
    </div>
  );
}
