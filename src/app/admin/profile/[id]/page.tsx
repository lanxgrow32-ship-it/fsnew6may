'use client';

import { useState, useEffect, use, useActionState, useTransition } from 'react';
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
    Video,
    RefreshCw,
    Lock,
    Unlock,
    ExternalLink,
    Trash2,
    Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, resetPassword, sendBreachRecoveryEmail, syncAccountCredentials, toggleAccountBlock, purgeHubAccount } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

function MasterPurgeButton({ accountId }: { accountId: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handlePurge = () => {
        if (!confirm("CRITICAL: This will permanently delete this account from the StockMint Hub terminal. Proceed?")) return;
        startTransition(async () => {
            const res = await purgeHubAccount(accountId);
            if (res.error) toast({ title: "Purge Failed", description: res.error, variant: "destructive" });
            else toast({ title: "Hub Account Purged", description: "Terminal record removed." });
        });
    }

    return (
        <Button 
            onClick={handlePurge} 
            disabled={isPending}
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
        >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
        </Button>
    )
}

function ProvisionButton({ accountId }: { accountId: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSync = () => {
        startTransition(async () => {
            const res = await syncAccountCredentials(accountId);
            if (res.error) toast({ title: "Sync Failed", description: res.error, variant: "destructive" });
            else toast({ title: "Hub Credentialed", description: "Account is now live on Stockmint." });
        });
    }

    return (
        <Button 
            onClick={handleSync} 
            disabled={isPending}
            variant="outline" 
            size="sm" 
            className="h-7 px-3 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 text-[9px] font-black uppercase tracking-widest"
        >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <RefreshCw className="w-3 h-3 mr-1" />}
            Force Sync
        </Button>
    )
}

function AccountBlockToggle({ accountId, isBlocked }: { accountId: string, isBlocked: boolean }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggle = () => {
        const newStatus = !isBlocked;
        startTransition(async () => {
            const res = await toggleAccountBlock(accountId, newStatus);
            if (res.error) toast({ title: "Update Failed", description: res.error, variant: "destructive" });
            else toast({ title: newStatus ? "Account Blocked" : "Account Released" });
        });
    }

    return (
        <Button 
            onClick={handleToggle} 
            disabled={isPending}
            variant={isBlocked ? "destructive" : "outline"}
            size="sm" 
            className="h-7 px-3 text-[9px] font-black uppercase tracking-widest"
        >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : isBlocked ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
            {isBlocked ? "Unblock" : "Block"}
        </Button>
    )
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [pwState, pwAction, isPwPending] = useActionState(resetPassword, { error: null, success: null });

  const fetchData = async () => {
    const [pRes, aRes, cRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('user_accounts').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('competition_registrations').select('*').eq('user_id', id)
    ]);
    if (pRes.data) setProfile(pRes.data);
    if (aRes.data) setAccounts(aRes.data);
    if (cRes.data) setCompetitions(cRes.data);
    setIsFetching(false);
  };

  useEffect(() => {
    fetchData();
    const sub = supabase.channel(`profile_${id}_sync`).on('postgres_changes', { event: '*', schema: 'public', table: 'user_accounts', filter: `user_id=eq.${id}` }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    formData.append('id', id);
    const res = await updateProfile(formData);
    if (res.error) toast({ title: "Error", description: res.error, variant: "destructive" });
    else toast({ title: "Sync Success" });
    setIsSaving(false);
  };

  if (isFetching) return <div className="h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

  return (
    <div className="bg-slate-950 min-h-screen font-poppins pb-20">
        <header className="flex h-16 items-center gap-4 px-6 border-b border-white/5 bg-slate-900/50 sticky top-0 z-50">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-5 w-5 text-white"/></Button>
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white">{profile.full_name}</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{profile.email}</p>
            </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Accounts" value={accounts.length} icon={Briefcase} color="text-primary" />
                <StatCard title="KYC Status" value={profile.kyc_status} icon={ShieldCheck} color="text-green-400" />
                <StatCard title="Wallet" value={`₹${profile.wallet_balance?.toLocaleString()}`} icon={IndianRupee} color="text-amber-400" />
                <StatCard title="Tournaments" value={competitions.length} icon={Trophy} color="text-purple-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <Card className="bg-muted/10 border-white/5">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 mb-6 pb-6">
                                <CardTitle className="text-white text-2xl font-bold flex items-center gap-3">
                                    <Activity className="text-primary" /> Master Terminal Control
                                </CardTitle>
                                <Button asChild variant="outline" className="h-10 px-6 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 font-black text-[10px] uppercase tracking-widest rounded-xl">
                                    <a href={`https://stockmint.io/admin/users?search=${encodeURIComponent(profile.email)}`} target="_blank">
                                        Open Hub Console
                                    </a>
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-500 font-bold uppercase">Manual KYC Toggle</Label>
                                        <Select name="kyc_status" defaultValue={profile.kyc_status}>
                                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-11"><SelectValue/></SelectTrigger>
                                            <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="submitted">Needs Review</SelectItem><SelectItem value="verified">Verified</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-500 font-bold uppercase">Global Promotion</Label>
                                        <Select name="account_classification" defaultValue={profile.account_classification || 'evaluation'}>
                                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-11"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="evaluation">Evaluation</SelectItem>
                                                <SelectItem value="passthenpay">PassThenPay</SelectItem>
                                                <SelectItem value="instant_pro">Instant Pro</SelectItem>
                                                <SelectItem value="one_step_phase_1">1-Step P1</SelectItem>
                                                <SelectItem value="one_step_live">1-Step Live</SelectItem>
                                                <SelectItem value="two_step_phase_1">2-Step P1</SelectItem>
                                                <SelectItem value="two_step_phase_2">2-Step P2</SelectItem>
                                                <SelectItem value="two_step_live">2-Step Live</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-xs text-gray-500 font-bold uppercase">User Portfolio Grid</Label>
                                    <div className="space-y-3">
                                        {accounts.length > 0 ? accounts.map(acc => (
                                            <div key={acc.id} className={cn(
                                                "p-5 bg-black/20 rounded-2xl border flex items-center justify-between group transition-all",
                                                acc.is_blocked ? "border-red-500/30" : "border-white/5"
                                            )}>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <p className="font-bold text-white text-base truncate">{acc.plan_name}</p>
                                                        {acc.is_blocked && <Badge className="bg-red-500 text-white text-[8px] font-black uppercase px-2 h-4">BLOCKED</Badge>}
                                                    </div>
                                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Hub UID: {acc.trading_username || 'Pending'}</p>
                                                </div>
                                                <div className="flex items-center gap-3 ml-4">
                                                    <AccountBlockToggle accountId={acc.id} isBlocked={acc.is_blocked} />
                                                    {!acc.credentials_provided && acc.is_approved && <ProvisionButton accountId={acc.id} />}
                                                    <MasterPurgeButton accountId={acc.id} />
                                                </div>
                                            </div>
                                        )) : <div className="py-12 text-center text-gray-600 font-bold uppercase text-xs border-2 border-dashed border-white/5 rounded-3xl">No accounts detected</div>}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end border-t border-white/5 pt-6 mt-6">
                                <Button type="submit" disabled={isSaving} className="font-bold h-11 px-10 shadow-xl shadow-primary/20">
                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null}
                                    Execute System Sync
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </div>

                <div className="space-y-8">
                    <Card className="bg-muted/10 border-white/5">
                        <CardHeader><CardTitle className="text-white text-xl font-bold">Admin Privileges</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                <Label className="font-bold text-white">Identity Verified</Label>
                                <Switch checked={profile.kyc_status === 'verified'} readOnly />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                                <Label className="font-bold text-red-400">Account Breached</Label>
                                <Switch checked={profile.is_breached} readOnly />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/10 border-white/5">
                        <CardHeader><CardTitle className="text-white text-xl font-bold">Security Override</CardTitle></CardHeader>
                        <CardContent>
                            <form action={pwAction} className="space-y-4">
                                <input type="hidden" name="id" value={id} />
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Force Password Reset</Label>
                                    <Input name="password" type="text" placeholder="New temporary password" required className="bg-black/40 border-white/10 text-white h-10" />
                                </div>
                                <Button type="submit" disabled={isPwPending} className="w-full h-10 bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold text-[10px] uppercase">
                                    {isPwPending ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-2"/> : null} Update Access Key
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  );
}
