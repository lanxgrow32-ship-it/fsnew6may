
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
    IndianRupee, 
    LayoutGrid, 
    Zap,
    KeyRound,
    ShieldCheck,
    Lock,
    Unlock,
    Activity,
    Briefcase,
    History,
    FileCheck,
    Video,
    ExternalLink,
    Users,
    ChevronRight,
    Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, resetPassword } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [pwState, pwAction, isPwPending] = useActionState(resetPassword, { error: null, success: null });

  const fetchData = async () => {
    const [pRes, aRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('user_accounts').select('*').eq('user_id', id).order('created_at', { ascending: false })
    ]);
    if (pRes.data) setProfile(pRes.data);
    if (aRes.data) setAccounts(aRes.data);
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
    if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
    } else {
        toast({ title: "Profile Updated" });
        fetchData();
    }
    setIsSaving(false);
  };

  if (isFetching) return <div className="h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

  return (
    <div className="bg-slate-950 min-h-screen font-poppins pb-20 text-gray-200">
        <header className="flex h-16 items-center gap-4 px-6 border-b border-white/5 bg-slate-900/50 sticky top-0 z-50">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full text-white"><ArrowLeft className="h-5 w-5"/></Button>
            {profile && (
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">{profile.full_name || 'Incomplete Profile'}</h1>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{profile.email}</p>
                </div>
            )}
            <div className="ml-auto flex items-center gap-3">
                {profile && (
                    <Badge variant="outline" className={cn("text-[9px] font-black border-none px-3", profile.kyc_status === 'verified' ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400")}>
                        {profile.kyc_status?.toUpperCase()}
                    </Badge>
                )}
            </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Core Identity & KYC */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-muted/10 border-white/5">
                        <CardHeader><CardTitle className="text-white text-lg font-bold">Profile Identity</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-gray-500 font-bold uppercase">Full Name</Label>
                                        <Input name="full_name" defaultValue={profile?.full_name} className="bg-black/40 border-white/10 text-white h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-gray-500 font-bold uppercase">KYC Protocol</Label>
                                        <Select name="kyc_status" defaultValue={profile?.kyc_status}>
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

                    {/* KYC Documents Section */}
                    <Card className="bg-muted/10 border-white/5">
                        <CardHeader>
                            <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                                <FileCheck className="text-primary w-5 h-5"/> Identity Evidence
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-gray-500 uppercase">Selfie / Aadhaar</p>
                                {profile?.selfie_url ? (
                                    <div className="relative aspect-video rounded-xl border border-white/5 overflow-hidden group">
                                        <Image src={profile.selfie_url} alt="KYC 1" fill className="object-cover" />
                                        <a href={profile.selfie_url} target="_blank" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                            <ExternalLink className="w-5 h-5 text-white" />
                                        </a>
                                    </div>
                                ) : <div className="aspect-video rounded-xl bg-black/40 border border-dashed border-white/10 flex items-center justify-center text-[10px] text-gray-600 font-bold uppercase">No Document</div>}
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-gray-500 uppercase">Selfie with Aadhaar</p>
                                {profile?.selfie_with_aadhaar_url ? (
                                    <div className="relative aspect-video rounded-xl border border-white/5 overflow-hidden group">
                                        <Image src={profile.selfie_with_aadhaar_url} alt="KYC 2" fill className="object-cover" />
                                        <a href={profile.selfie_with_aadhaar_url} target="_blank" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                            <ExternalLink className="w-5 h-5 text-white" />
                                        </a>
                                    </div>
                                ) : <div className="aspect-video rounded-xl bg-black/40 border border-dashed border-white/10 flex items-center justify-center text-[10px] text-gray-600 font-bold uppercase">No Document</div>}
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-gray-500 uppercase">Video KYC</p>
                                {profile?.video_kyc_url ? (
                                    <div className="relative aspect-video rounded-xl border border-white/5 overflow-hidden group bg-black/20 flex items-center justify-center">
                                        <Video className="w-8 h-8 text-gray-700" />
                                        <a href={profile.video_kyc_url} target="_blank" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                            <Badge variant="outline" className="text-white border-white/20">Open Video</Badge>
                                        </a>
                                    </div>
                                ) : <div className="aspect-video rounded-xl bg-black/40 border border-dashed border-white/10 flex items-center justify-center text-[10px] text-gray-600 font-bold uppercase">No Video</div>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Ledger Section */}
                    <Card className="bg-muted/10 border-white/5">
                        <CardHeader>
                            <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                                <Activity className="text-primary w-5 h-5"/> Account Lifecycle
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {accounts.length > 0 ? accounts.map((acc) => (
                                    <div key={acc.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 rounded-xl bg-white/5 text-gray-400 group-hover:text-primary transition-colors">
                                                <Briefcase className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{acc.plan_name}</p>
                                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{acc.id.substring(0, 8)} · {acc.status}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {acc.is_blocked && <Badge className="bg-red-600 text-white text-[8px] font-black uppercase">Blocked</Badge>}
                                            <Badge variant="outline" className="text-[9px] font-bold border-white/10 capitalize">{acc.account_classification?.replace(/_/g, ' ') || 'Evaluation'}</Badge>
                                        </div>
                                    </div>
                                )) : <div className="py-10 text-center text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">No trading history found</div>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Balances & Security */}
                <div className="space-y-6">
                    <Card className="bg-muted/10 border-white/5">
                        <CardHeader><CardTitle className="text-white text-lg font-bold">Market Access</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <StatCard title="Wallet Balance" value={`₹${profile?.wallet_balance?.toLocaleString() || 0}`} icon={IndianRupee} color="text-green-400" />
                            <StatCard title="Referral Credit" value={`₹${profile?.referral_balance?.toLocaleString() || 0}`} icon={Users} color="text-amber-400" />
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
                                {pwState?.success && <p className="text-[10px] text-green-400 font-bold text-center">Password successfully overwritten.</p>}
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-500/5 border-red-500/10">
                        <CardHeader className="pb-2"><CardTitle className="text-red-400 text-sm font-black uppercase">System Breach Alert</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-red-500/10">
                                <Label className="font-bold text-red-400 text-xs">Flag as Breached</Label>
                                <Switch checked={profile?.is_breached} readOnly />
                            </div>
                            <div className="p-3 bg-red-500/10 rounded-lg">
                                <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Breach Context</p>
                                <p className="text-xs text-gray-400 mt-1 italic">"{profile?.breach_reason || 'No breach recorded'}"</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom Section: StockMint Terminal Insight Access */}
            <div className="max-w-7xl mx-auto px-0 pt-10 border-t border-white/5 mt-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(139,44,245,0.1)]">
                        <LayoutGrid className="w-5 h-5"/>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Terminal Orchestration</h2>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em]">Engine State Mirroring Grid</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.filter(a => a.credentials_provided).map(acc => (
                        <GlassCard key={acc.id} className="p-6 border-white/5 bg-slate-900/40 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"><Zap className="w-20 h-20 text-primary" /></div>
                            <div className="relative space-y-6">
                                <div>
                                    <h3 className="text-lg font-black text-white truncate">{acc.plan_name}</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">HUB ID: {acc.trading_username}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="bg-black/40 border-white/5 text-[8px] font-black uppercase">{acc.account_classification?.replace(/_/g, ' ') || 'Evaluation'}</Badge>
                                    <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase">Mirror Ready</Badge>
                                </div>
                                <Button asChild className="w-full h-11 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                                    <Link href={`/admin/profile/${id}/stockmint/${acc.id}`}>
                                        View StockMint Info <ChevronRight className="ml-2 w-4 h-4"/>
                                    </Link>
                                </Button>
                            </div>
                        </GlassCard>
                    ))}
                    {accounts.filter(a => a.credentials_provided).length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                            <p className="text-gray-600 font-black uppercase text-[10px] tracking-[0.3em]">No Hub sessions active for this profile</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    </div>
  );
}
