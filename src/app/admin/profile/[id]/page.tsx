
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, ShieldAlert, CheckCircle, XCircle, User as UserIcon, Trophy, IndianRupee, LayoutGrid, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, resetPassword } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
    <Card className="bg-muted/20 border-white/5">
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</p>
                    <p className="text-2xl font-black mt-1">{value}</p>
                </div>
                <div className={cn("p-2.5 rounded-xl bg-white/5", color)}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </CardContent>
    </Card>
);

import { cn } from '@/lib/utils';

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
  const instantCount = accounts.filter(a => a.plan_name.toLowerCase().includes('instant')).length;
  const oneStepCount = accounts.filter(a => a.plan_name.toLowerCase().includes('1-step')).length;
  const twoStepCount = accounts.filter(a => a.plan_name.toLowerCase().includes('2-step')).length;
  const ptpCount = accounts.filter(a => a.account_model === 'passthrupay').length;

  return (
    <div className="bg-slate-950 min-h-screen font-poppins pb-20">
        <header className="flex h-16 items-center gap-4 px-6 border-b border-white/5 bg-slate-900/50 sticky top-0 z-50">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-5 w-5"/></Button>
            <div>
                <h1 className="text-xl font-black tracking-tight text-white">{profile.full_name}</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{profile.email}</p>
            </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Funded Accounts" value={fundedCount} icon={IndianRupee} color="text-green-400" />
                <StatCard title="PTP Accounts" value={ptpCount} icon={Zap} color="text-amber-400" />
                <StatCard title="Tournaments" value={competitions.length} icon={Trophy} color="text-primary" />
                <StatCard title="Wallet Balance" value={`₹${profile.wallet_balance?.toLocaleString()}`} icon={LayoutGrid} color="text-blue-400" />
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-muted/10 border-white/5">
                        <CardHeader><CardTitle>KYC & Verification Details</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500 font-bold uppercase">PAN Number</Label>
                                    <p className="font-mono text-white font-bold">{profile.pan_number || 'Not Linked'}</p>
                                    <Badge variant={profile.is_pan_verified ? "default" : "destructive"}>{profile.is_pan_verified ? 'Verified' : 'Unverified'}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500 font-bold uppercase">Identity Photo</Label>
                                    <div className="flex gap-4">
                                        {profile.selfie_url && <Image src={profile.selfie_url} alt="Aadhaar" width={100} height={60} className="rounded-md border border-white/10" />}
                                        {profile.selfie_with_aadhaar_url && <Image src={profile.selfie_with_aadhaar_url} alt="Selfie" width={100} height={60} className="rounded-md border border-white/10" />}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Manual KYC Status</Label>
                                    <Select name="kyc_status" defaultValue={profile.kyc_status}>
                                        <SelectTrigger className="bg-black/40 border-white/10"><SelectValue/></SelectTrigger>
                                        <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="submitted">Review Required</SelectItem><SelectItem value="verified">Verified</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Account Classification</Label>
                                    <Select name="account_classification" defaultValue={profile.account_classification || 'evaluation'}>
                                        <SelectTrigger className="bg-black/40 border-white/10"><SelectValue/></SelectTrigger>
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
                    </Card>

                    <Card className="bg-muted/10 border-white/5">
                        <CardHeader><CardTitle>Portfolio History</CardTitle><CardDescription>Detailed list of all accounts owned by this trader.</CardDescription></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {accounts.length > 0 ? accounts.map(acc => (
                                    <div key={acc.id} className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-white">{acc.plan_name}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">ID: {acc.id.substring(0,8)} · {acc.account_classification?.replace(/_/g, ' ')}</p>
                                        </div>
                                        <Badge className={acc.status === 'active' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>{acc.status}</Badge>
                                    </div>
                                )) : <div className="py-12 text-center text-gray-500 font-bold italic">No account records found.</div>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="bg-muted/10 border-white/5">
                        <CardHeader><CardTitle>Portfolio Mix</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center text-sm"><span className="text-gray-400">Instant</span> <span className="font-bold">{instantCount}</span></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-gray-400">1-Step</span> <span className="font-bold">{oneStepCount}</span></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-gray-400">2-Step</span> <span className="font-bold">{twoStepCount}</span></div>
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5 text-primary"><span className="font-bold">PassThenPay</span> <span className="font-bold">{ptpCount}</span></div>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/10 border-white/5">
                        <CardHeader><CardTitle>Admin Controls</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <Label className="font-bold">Payment Approved</Label>
                                <Switch name="is_approved" defaultChecked={profile.is_approved} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="font-bold text-red-400">Account Breached</Label>
                                <Switch name="is_breached" defaultChecked={profile.is_breached} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSaving} className="w-full h-11 font-black">
                                {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null}
                                Save Global Profile
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </main>
    </div>
  );
}
