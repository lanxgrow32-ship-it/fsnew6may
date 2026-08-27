
'use client';

import { useState, useEffect, use, useTransition, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
    Loader2, 
    ArrowLeft, 
    ShieldAlert, 
    CheckCircle, 
    XCircle, 
    User as UserIcon, 
    Trophy, 
    IndianRupee, 
    LayoutGrid, 
    Zap,
    Mail,
    KeyRound,
    ShieldCheck,
    RefreshCw,
    Lock,
    Unlock,
    Activity,
    Briefcase,
    History,
    TrendingUp,
    Target,
    Database,
    Shield,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
    updateProfile, 
    resetPassword, 
    getMasterSync, 
    resetAccount, 
    calibrateAccount, 
    updateClassification, 
    updateTerminalStatus 
} from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
    <Card className="bg-muted/20 border-white/5">
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</p>
                    <p className="text-2xl font-black mt-1 text-white">{value}</p>
                </div>
                <div className={cn("p-2.5 rounded-xl bg-white/5", color)}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </CardContent>
    </Card>
);

function TerminalInsight({ email }: { email: string }) {
    const [syncData, setSyncData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const fetchSync = async () => {
        setLoading(true);
        const res = await getMasterSync(email);
        if (res.error) toast({ title: "Sync Failed", description: res.error, variant: "destructive" });
        else setSyncData(res.data);
        setLoading(false);
    };

    useEffect(() => { fetchSync(); }, [email]);

    const handleAction = (action: () => Promise<any>, successMsg: string) => {
        startTransition(async () => {
            const res = await action();
            if (res.error) toast({ title: "Action Failed", description: res.error, variant: "destructive" });
            else {
                toast({ title: successMsg });
                fetchSync();
            }
        });
    };

    if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary opacity-20"/></div>;
    if (!syncData) return <div className="py-20 text-center text-gray-500 font-bold uppercase text-[10px]">No Engine Connection</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Live Financial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-black/40 border-white/5">
                    <CardHeader className="py-4"><CardTitle className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Live Cash Balance</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-black text-white">₹{syncData.balance?.toLocaleString()}</p></CardContent>
                </Card>
                <Card className="bg-black/40 border-white/5">
                    <CardHeader className="py-4"><CardTitle className="text-[10px] font-black uppercase text-gray-500 tracking-widest">High Water Mark</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-black text-primary">₹{syncData.highWaterMark?.toLocaleString()}</p></CardContent>
                </Card>
                <Card className="bg-black/40 border-white/5">
                    <CardHeader className="py-4"><CardTitle className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Today's Opening</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-black text-white">₹{syncData.openingBalance?.toLocaleString()}</p></CardContent>
                </div>

            {/* Risk Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/10 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Max Drawdown</p>
                        <p className="text-sm font-bold text-red-400">{syncData.maxDrawdownPct}%</p>
                    </div>
                    <ShieldAlert className="w-4 h-4 text-red-500 opacity-20" />
                </div>
                <div className="p-4 bg-muted/10 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Daily Loss</p>
                        <p className="text-sm font-bold text-amber-400">{syncData.dailyLossPct}%</p>
                    </div>
                    <Activity className="w-4 h-4 text-amber-500 opacity-20" />
                </div>
                <div className="p-4 bg-muted/10 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Per Trade</p>
                        <p className="text-sm font-bold text-blue-400">{syncData.perTradePct}%</p>
                    </div>
                    <Target className="w-4 h-4 text-blue-500 opacity-20" />
                </div>
            </div>

            {/* Command Bar */}
            <div className="flex flex-wrap gap-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                        const bal = prompt("Enter Reset Balance:", syncData.balance);
                        if(bal) handleAction(() => resetAccount(email, parseFloat(bal)), "Engine Reset Complete");
                    }}
                    className="h-8 text-[9px] font-black uppercase tracking-widest bg-black/20 border-white/10"
                    disabled={isPending}
                >
                    <RefreshCw className={cn("w-3 h-3 mr-1.5", isPending && "animate-spin")} /> Reset Account
                </Button>
                
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                        const bal = prompt("New Balance:", syncData.balance);
                        const hwm = prompt("New HWM:", syncData.highWaterMark);
                        if(bal && hwm) handleAction(() => calibrateAccount(email, parseFloat(bal), parseFloat(hwm)), "Calibration Successful");
                    }}
                    className="h-8 text-[9px] font-black uppercase tracking-widest bg-black/20 border-white/10"
                    disabled={isPending}
                >
                    <Zap className="w-3 h-3 mr-1.5" /> Calibrate
                </Button>

                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                        const status = syncData.status === 'active' ? 'blocked' : 'active';
                        handleAction(() => updateTerminalStatus(email, status, "ADMIN_OVERRIDE"), `Terminal status: ${status}`);
                    }}
                    className={cn(
                        "h-8 text-[9px] font-black uppercase tracking-widest",
                        syncData.status === 'active' ? "text-red-400 hover:text-red-300 border-red-500/20" : "text-green-400 hover:text-green-300 border-green-500/20"
                    )}
                    disabled={isPending}
                >
                    {syncData.status === 'active' ? <Lock className="w-3 h-3 mr-1.5" /> : <Unlock className="w-3 h-3 mr-1.5" />}
                    {syncData.status === 'active' ? 'Freeze Terminal' : 'Release Terminal'}
                </Button>

                <div className="ml-auto">
                    <Select onValueChange={(val) => handleAction(() => updateClassification(email, val), `Promoted to ${val}`)}>
                        <SelectTrigger className="h-8 text-[9px] font-black uppercase tracking-widest w-40 bg-black/40 border-white/10">
                            <SelectValue placeholder="PROMOTION" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="evaluation">Evaluation</SelectItem>
                            <SelectItem value="one_step_live">1-Step Live</SelectItem>
                            <SelectItem value="two_step_phase_2">2-Step P2</SelectItem>
                            <SelectItem value="two_step_live">2-Step Live</SelectItem>
                            <SelectItem value="instant_pro">Instant Pro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Terminal Ledgers */}
            <Tabs defaultValue="trades" className="w-full">
                <TabsList className="bg-black/40 border border-white/5 p-1 h-10 rounded-xl mb-4">
                    <TabsTrigger value="trades" className="text-[9px] font-black uppercase tracking-widest">Executions (Last 50)</TabsTrigger>
                    <TabsTrigger value="pnl" className="text-[9px] font-black uppercase tracking-widest">P&L Records</TabsTrigger>
                </TabsList>
                
                <TabsContent value="trades">
                    <div className="rounded-2xl border border-white/5 bg-black/20 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow>
                                    <TableHead className="text-[9px] font-bold uppercase text-gray-500">Timestamp</TableHead>
                                    <TableHead className="text-[9px] font-bold uppercase text-gray-500">Asset</TableHead>
                                    <TableHead className="text-[9px] font-bold uppercase text-gray-500">Type</TableHead>
                                    <TableHead className="text-[9px] font-bold uppercase text-gray-500">Price</TableHead>
                                    <TableHead className="text-right text-[9px] font-bold uppercase text-gray-500">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {syncData.executionRequests?.length > 0 ? syncData.executionRequests.map((req: any, i: number) => (
                                    <TableRow key={i} className="border-white/5 hover:bg-white/[0.02]">
                                        <TableCell className="text-[10px] font-mono text-gray-400">{format(new Date(req.createdAt), 'dd MMM, HH:mm:ss')}</TableCell>
                                        <TableCell className="text-[10px] font-black text-white">{req.symbol}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-2", req.side === 'BUY' ? "text-green-400 border-green-500/20" : "text-red-400 border-red-500/20")}>
                                                {req.side}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-[10px] font-bold text-gray-300">₹{req.price}</TableCell>
                                        <TableCell className="text-right">
                                            <span className={cn("text-[9px] font-bold uppercase", req.status === 'FILLED' ? "text-green-500" : "text-gray-500")}>
                                                {req.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={5} className="py-10 text-center text-gray-600 font-bold uppercase text-[9px]">No trade history</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="pnl">
                    <div className="rounded-2xl border border-white/5 bg-black/20 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow>
                                    <TableHead className="text-[9px] font-bold uppercase text-gray-500">Trading Date</TableHead>
                                    <TableHead className="text-[9px] font-bold uppercase text-gray-500">Starting</TableHead>
                                    <TableHead className="text-[9px] font-bold uppercase text-gray-500">Closing</TableHead>
                                    <TableHead className="text-right text-[9px] font-bold uppercase text-gray-500">Net Profit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {syncData.pnlRecords?.length > 0 ? syncData.pnlRecords.map((rec: any, i: number) => (
                                    <TableRow key={i} className="border-white/5 hover:bg-white/[0.02]">
                                        <TableCell className="text-[10px] font-bold text-gray-400">{format(new Date(rec.date), 'dd MMM yyyy')}</TableCell>
                                        <TableCell className="text-[10px] font-medium">₹{rec.startBalance?.toLocaleString()}</TableCell>
                                        <TableCell className="text-[10px] font-medium">₹{rec.endBalance?.toLocaleString()}</TableCell>
                                        <TableCell className={cn("text-right text-[10px] font-black", rec.netPnl >= 0 ? "text-green-400" : "text-red-400")}>
                                            {rec.netPnl >= 0 ? '+' : ''}₹{rec.netPnl?.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={4} className="py-10 text-center text-gray-600 font-bold uppercase text-[9px]">No daily records</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeAccount, setActiveAccount] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [pwState, pwAction, isPwPending] = useActionState(resetPassword, { error: null, success: null });

  const fetchData = async () => {
    const [pRes, aRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('user_accounts').select('*').eq('user_id', id).order('created_at', { ascending: false })
    ]);
    if (pRes.data) setProfile(pRes.data);
    if (aRes.data) {
        setAccounts(aRes.data);
        if (aRes.data.length > 0 && !activeAccount) setActiveAccount(aRes.data[0]);
    }
    setIsFetching(false);
  };

  useEffect(() => {
    fetchData();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    formData.append('id', id);
    const res = await updateProfile(formData);
    if (res.error) toast({ title: "Error", description: res.error, variant: "destructive" });
    else toast({ title: "Profile Updated" });
    setIsSaving(false);
  };

  if (isFetching) return <div className="h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

  return (
    <div className="bg-slate-950 min-h-screen font-poppins pb-20 text-gray-200">
        <header className="flex h-16 items-center gap-4 px-6 border-b border-white/5 bg-slate-900/50 sticky top-0 z-50">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full text-white"><ArrowLeft className="h-5 w-5"/></Button>
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white">{profile.full_name}</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{profile.email}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
                <Badge variant="outline" className={cn("text-[9px] font-black border-none px-3", profile.kyc_status === 'verified' ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400")}>
                    {profile.kyc_status.toUpperCase()}
                </Badge>
            </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Engine Command Center */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-muted/10 border-white/5 overflow-hidden">
                        <CardHeader className="border-b border-white/5 bg-white/[0.01] flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-white text-xl font-black flex items-center gap-3">
                                    <Database className="text-primary h-5 w-5" /> TERMINAL ORCHESTRATION
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Real-time Stateless Data Bridge</CardDescription>
                            </div>
                            <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                                {accounts.map(acc => (
                                    <button 
                                        key={acc.id} 
                                        onClick={() => setActiveAccount(acc)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
                                            activeAccount?.id === acc.id ? "bg-primary text-white" : "text-gray-500 hover:text-gray-300"
                                        )}
                                    >
                                        {acc.plan_name?.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {activeAccount ? (
                                <TerminalInsight email={activeAccount.trading_username} key={activeAccount.id} />
                            ) : (
                                <div className="py-20 text-center text-gray-600 font-bold uppercase text-[10px]">No trading accounts detected</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Standard Database Sync Form */}
                    <Card className="bg-muted/10 border-white/5">
                        <CardHeader><CardTitle className="text-white text-lg font-bold">Profile Identity</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-gray-500 font-bold uppercase">Full Name</Label>
                                        <Input name="full_name" defaultValue={profile.full_name} className="bg-black/40 border-white/10 text-white h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-gray-500 font-bold uppercase">KYC Protocol</Label>
                                        <Select name="kyc_status" defaultValue={profile.kyc_status}>
                                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-11"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="submitted">Needs Review</SelectItem>
                                                <SelectItem value="verified">Verified</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4 border-t border-white/5">
                                    <Button type="submit" disabled={isSaving} className="font-bold h-11 px-8">
                                        {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null} Sync Profile Details
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Privilege & Security */}
                <div className="space-y-6">
                    <Card className="bg-muted/10 border-white/5">
                        <CardHeader><CardTitle className="text-white text-lg font-bold">Market Access</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <StatCard title="Wallet Balance" value={`₹${profile.wallet_balance?.toLocaleString()}`} icon={IndianRupee} color="text-green-400" />
                            <StatCard title="Referral Credit" value={`₹${profile.referral_balance?.toLocaleString()}`} icon={Users} color="text-amber-400" />
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/10 border-white/5">
                        <CardHeader><CardTitle className="text-white text-lg font-bold">Security Override</CardTitle></CardHeader>
                        <CardContent>
                            <form action={pwAction} className="space-y-4">
                                <input type="hidden" name="id" value={id} />
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Force Password Reset</Label>
                                    <Input name="password" type="text" placeholder="New temporary password" required className="bg-black/40 border-white/10 text-white h-10 font-mono" />
                                </div>
                                <Button type="submit" disabled={isPwPending} className="w-full h-10 bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold text-[10px] uppercase">
                                    {isPwPending ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-2"/> : <KeyRound className="w-3.5 h-3.5 mr-2" />} Update Access Key
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-500/5 border-red-500/10">
                        <CardHeader className="pb-2"><CardTitle className="text-red-400 text-sm font-black uppercase">System Breach Alert</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-red-500/10">
                                <Label className="font-bold text-red-400 text-xs">Flag as Breached</Label>
                                <Switch checked={profile.is_breached} readOnly />
                            </div>
                            <div className="p-3 bg-red-500/10 rounded-lg">
                                <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Breach Context</p>
                                <p className="text-xs text-gray-400 mt-1 italic">"{profile.breach_reason || 'No breach recorded'}"</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  );
}
