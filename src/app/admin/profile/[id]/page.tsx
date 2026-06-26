'use client';

import { useState, useEffect, use, useActionState } from 'react';
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
    ShieldCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, resetPassword, sendBreachRecoveryEmail } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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

  // Recovery States
  const [recoveryState, recoveryAction, isRecoveryPending] = useActionState(sendBreachRecoveryEmail, { error: null, success: null });
  const [pwState, pwAction, isPwPending] = useActionState(resetPassword, { error: null, success: null });

  useEffect(() => {
    if (recoveryState.success) toast({ title: "Email Sent", description: recoveryState.success });
    if (recoveryState.error) toast({ title: "Error", description: recoveryState.error, variant: "destructive" });
  }, [recoveryState, toast]);

  useEffect(() => {
    if (pwState.success) toast({ title: "Password Reset", description: "The trader's password has been updated." });
    if (pwState.error) toast({ title: "Error", description: pwState.error, variant: "destructive" });
  }, [pwState, toast]);

  useEffect(() => {
    const fetchData = async () => {
      const [pRes, aRes, cRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('user_accounts').select('*').eq('user_id', id),
        supabase.from('competition_registrations').select('*').eq('user_id', id)
      ]);
      if (pRes.data) setProfile(pRes.data);
      if (aRes.data) setAccounts(aRes.data);
      if (cRes.data) setCompetitions(cRes.data);
      setIsFetching(false);
    };
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

  const fundedCount = accounts.filter(a => a.account_model !== 'passthrupay').length;
  const ptpCount = accounts.filter(a => a.account_model === 'passthrupay').length;

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
                <StatCard title="Funded Accounts" value={fundedCount} icon={IndianRupee} color="text-green-400" />
                <StatCard title="PTP Accounts" value={ptpCount} icon={Zap} color="text-amber-400" />
                <StatCard title="Tournaments" value={competitions.length} icon={Trophy} color="text-primary" />
                <StatCard title="Wallet Balance" value={`₹${profile.wallet_balance?.toLocaleString('en-IN')}`} icon={LayoutGrid} color="text-blue-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <Card className="bg-muted/10 border-white/5">
                            <CardHeader><CardTitle className="text-white text-2xl font-bold">KYC & Verification</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500 font-bold uppercase">PAN Number</Label>
                                        <p className="font-mono text-white font-bold">{profile.pan_number || 'Not Linked'}</p>
                                        <Badge variant={profile.is_pan_verified ? "default" : "destructive"}>{profile.is_pan_verified ? 'Verified' : 'Unverified'}</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500 font-bold uppercase">Identity Proof</Label>
                                        <div className="flex gap-4">
                                            {profile.selfie_url && <Image src={profile.selfie_url} alt="Aadhaar" width={120} height={80} className="rounded-lg border border-white/10 object-cover" />}
                                            {profile.selfie_with_aadhaar_url && <Image src={profile.selfie_with_aadhaar_url} alt="Selfie" width={120} height={80} className="rounded-lg border border-white/10 object-cover" />}
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-white">Manual KYC Status</Label>
                                        <Select name="kyc_status" defaultValue={profile.kyc_status}>
                                            <SelectTrigger className="bg-black/40 border-white/10 text-white"><SelectValue/></SelectTrigger>
                                            <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="submitted">Review Required</SelectItem><SelectItem value="verified">Verified</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white">Primary Classification</Label>
                                        <Select name="account_classification" defaultValue={profile.account_classification || 'evaluation'}>
                                            <SelectTrigger className="bg-black/40 border-white/10 text-white"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="evaluation">Evaluation</SelectItem>
                                                <SelectItem value="instant_live">Instant Live</SelectItem>
                                                <SelectItem value="one_step_phase_1">1-Step Phase 1</SelectItem>
                                                <SelectItem value="two_step_phase_1">2-Step Phase 1</SelectItem>
                                                <SelectItem value="live">Live/Funded</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end">
                                <Button type="submit" disabled={isSaving} className="font-bold h-11 px-8 shadow-xl shadow-primary/20">
                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null}
                                    Save Core Profile
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="bg-muted/10 border-white/5">
                            <CardHeader>
                                <CardTitle className="text-white text-2xl font-bold">Portfolio Records</CardTitle>
                                <CardDescription className="text-gray-400">Review all accounts associated with this trader.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {accounts.length > 0 ? accounts.map(acc => (
                                        <div key={acc.id} className="p-5 bg-black/20 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-black/30 transition-all">
                                            <div>
                                                <p className="font-bold text-white text-base">{acc.plan_name}</p>
                                                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                                    <span className="opacity-50">ID: {acc.id.substring(0,8)}</span>
                                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                                    <span className="text-primary">{acc.account_classification?.replace(/_/g, ' ')}</span>
                                                </p>
                                            </div>
                                            <Badge variant="outline" className={cn("capitalize h-7 px-3 border-none font-bold", acc.status === 'active' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>{acc.status}</Badge>
                                        </div>
                                    )) : <div className="py-20 text-center text-gray-600 font-bold italic border-2 border-dashed border-white/5 rounded-3xl">No trading history available.</div>}
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>

                <div className="space-y-8">
                    {/* Access Controls */}
                    <Card className="bg-muted/10 border-white/5">
                        <CardHeader><CardTitle className="text-white text-xl font-bold">Admin Controls</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                    <Label className="font-bold text-white">Payment Status</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">{profile.is_approved ? 'Verified' : 'Pending'}</span>
                                        <Switch name="is_approved" defaultChecked={profile.is_approved} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                                    <Label className="font-bold text-red-400">Account Breached</Label>
                                    <Switch name="is_breached" defaultChecked={profile.is_breached} />
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Security & Recovery Actions */}
                    <Card className="bg-muted/10 border-white/5 shadow-2xl border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-primary" /> Security & Recovery
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Breach Email Action */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Breach Protocol</Label>
                                <form action={recoveryAction}>
                                    <input type="hidden" name="userId" value={id} />
                                    <Button 
                                        type="submit" 
                                        variant="outline" 
                                        disabled={isRecoveryPending}
                                        className="w-full h-11 bg-purple-600/10 border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white font-bold transition-all rounded-xl"
                                    >
                                        {isRecoveryPending ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Mail className="mr-2 h-4 w-4" />}
                                        Send Recovery Email
                                    </Button>
                                    <p className="text-[9px] text-gray-600 mt-2 px-1">Sends RETRY15 discount & breach report to trader.</p>
                                </form>
                            </div>

                            <Separator className="bg-white/5" />

                            {/* Password Reset Action */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Authentication Override</Label>
                                <form action={pwAction} className="space-y-3">
                                    <input type="hidden" name="id" value={id} />
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
                                        <Input 
                                            name="password" 
                                            placeholder="New temporary password" 
                                            required 
                                            className="pl-9 bg-black/40 border-white/10 text-white text-xs h-10 rounded-xl" 
                                        />
                                    </div>
                                    <Button 
                                        type="submit" 
                                        disabled={isPwPending}
                                        className="w-full h-10 bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold text-[10px] uppercase tracking-widest rounded-xl"
                                    >
                                        {isPwPending ? <Loader2 className="animate-spin h-3.5 w-3.5"/> : null}
                                        Force Reset Password
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  );
}

const Separator = ({ className }: { className?: string }) => (
    <div className={cn("h-px w-full", className)} />
);
