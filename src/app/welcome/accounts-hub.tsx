'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { 
    PlusCircle, 
    ArrowRight, 
    Grid3x3, 
    ShieldAlert, 
    Clock, 
    CheckCircle,
    FileCheck,
    Briefcase,
    Zap,
    TrendingUp,
    ShieldCheck,
    Trophy,
    LayoutDashboard,
    Activity,
    Target,
    Timer,
    FlaskConical,
    MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

const UserAvatar = () => (
  <div className="relative h-20 w-20 shrink-0">
    <div className="absolute -inset-1 bg-gradient-to-br from-primary to-purple-600 rounded-full blur-md opacity-75 animate-pulse"></div>
    <div className="relative h-20 w-20 flex items-center justify-center bg-slate-900 rounded-full border-2 border-white/10 overflow-hidden shadow-2xl">
      <Image src="/bitmoji.png" alt="User Avatar" width={80} height={80} className="object-cover" />
    </div>
  </div>
);

const AccountCard = ({ account, kycVerified }: { account: any, kycVerified: boolean }) => {
    const paymentApproved = account.is_approved;
    const isBreached = account.status === 'breached';
    const isDeleted = account.status === 'deleted';
    const isPtp = account.account_model === 'passthrupay';
    const isTrial = account.is_trial;
    const isWaitingKyc = paymentApproved && !kycVerified && !isBreached && !isPtp && !isTrial;
    const isWaitingApproval = !paymentApproved;

    return (
        <GlassCard className={cn(
            "group transition-all duration-300 hover:scale-[1.02] border-white/5", 
            isBreached && "border-red-500/20 bg-red-500/5",
            isDeleted && "opacity-60 grayscale",
            isTrial && !isDeleted && "border-primary/40 bg-primary/5 shadow-2xl shadow-primary/10",
            (isWaitingApproval || isWaitingKyc) && "border-amber-400/20 bg-amber-400/5"
        )}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="min-w-0">
                        <CardTitle className="text-lg text-white font-black truncate flex items-center gap-2">
                            {account.plan_name}
                            {isTrial && <Badge className="bg-primary text-white text-[8px] h-4 font-black uppercase border-none">TRIAL</Badge>}
                        </CardTitle>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1.5">
                            <Grid3x3 className="w-3 h-3 opacity-50"/> {account.id.substring(0, 8)}
                        </p>
                    </div>
                    {isDeleted ? (
                        <div className="bg-gray-500/20 text-gray-500 p-2.5 rounded-xl border border-white/5"><Timer className="w-4 h-4"/></div>
                    ) : isBreached ? (
                        <div className="bg-red-500/20 text-red-400 p-2.5 rounded-xl border border-red-500/20"><ShieldAlert className="w-4 h-4"/></div>
                    ) : isWaitingApproval ? (
                        <div className="bg-amber-400/20 text-amber-400 p-2.5 rounded-xl border border-amber-400/20 animate-pulse"><Clock className="w-4 h-4"/></div>
                    ) : isWaitingKyc ? (
                         <div className="bg-amber-400/20 text-amber-400 p-2.5 rounded-xl border border-amber-400/20"><FileCheck className="w-4 h-4"/></div>
                    ) : isTrial ? (
                        <div className="bg-primary/20 text-primary p-2.5 rounded-xl border border-primary/30 animate-pulse shadow-[0_0_15px_rgba(139,44,245,0.3)]"><FlaskConical className="w-4 h-4"/></div>
                    ) : (
                        <div className="bg-green-500/20 text-green-400 p-2.5 rounded-xl border border-green-500/20"><ShieldCheck className="w-4 h-4"/></div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Status</p>
                        <p className={cn("text-xs font-bold capitalize mt-2", 
                            isDeleted ? "text-gray-500" :
                            isBreached ? "text-red-400" : 
                            isWaitingApproval ? "text-amber-400" : 
                            isWaitingKyc ? "text-amber-400" : "text-green-400"
                        )}>
                            {isDeleted ? "Access Revoked" : isBreached ? "Breached" : isWaitingApproval ? "Verifying Payment" : isWaitingKyc ? "Action Required" : "Account Live"}
                        </p>
                    </div>
                    <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">Model</p>
                        <p className="text-xs font-bold text-white mt-2 capitalize">{isTrial ? 'Trial Run' : account.account_model === 'passthrupay' ? 'PTP (6%)' : 'Standard'}</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-2">
                {isDeleted ? (
                    <Button disabled className="w-full h-11 bg-slate-900 border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-700">Session Expired</Button>
                ) : isWaitingApproval ? (
                    <Button disabled className="w-full h-11 bg-slate-900 border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-600">Checking Reference</Button>
                ) : isWaitingKyc ? (
                    <Button asChild className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-amber-500/10">
                        <Link href="/kyc">Complete Identity Check <ArrowRight className="ml-2 w-3.5 h-3.5"/></Link>
                    </Button>
                ) : (
                    <Button asChild className={cn(
                        "w-full h-11 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]", 
                        isBreached && "bg-slate-800 hover:bg-slate-700",
                        isTrial && "bg-white text-black hover:bg-gray-100 shadow-white/10"
                    )}>
                        <Link href={`/welcome/dashboard/${account.id}`}>
                            {isBreached ? "View Performance" : isTrial ? "Enter Trial Lab" : "Open Account Dashboard"} <ArrowRight className="ml-2 w-3.5 h-3.5"/>
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </GlassCard>
    );
};

export function AccountsHub({ accounts, profile, onSwitchToGetFunded }: { accounts: any[], profile: any, onSwitchToGetFunded: () => void }) {
    const kycVerified = profile.kyc_status === 'verified';
    const activeCount = accounts.filter(a => a.status === 'active').length;
    const pendingCount = accounts.filter(a => a.status === 'pending' || !a.is_approved).length;
    const firstName = profile.full_name?.split(' ')[0] || 'Trader';

    return (
        <div className="space-y-10">
            {/* Premium Hero Section */}
            <GlassCard className="p-8 md:p-12 border-primary/20 bg-primary/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 -z-0"><Trophy className="w-64 h-64 text-primary"/></div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/20 blur-[100px] rounded-full"></div>
                
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                    <UserAvatar />
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">Welcome, {firstName}!</h1>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                                {kycVerified ? 'Verified Trader' : 'Member'}
                            </Badge>
                        </div>
                        <p className="text-gray-400 font-medium text-lg max-w-lg">Manage all your accounts from one central dashboard.</p>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-8">
                            <div className="bg-black/60 px-5 py-3 rounded-2xl border border-white/5 flex flex-col gap-1 min-w-[120px]">
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Active Accounts</span>
                                <div className="flex items-center gap-2">
                                    <Target className="w-3.5 h-3.5 text-primary"/>
                                    <span className="text-lg font-black text-white">{activeCount}</span>
                                </div>
                            </div>
                            <div className="bg-black/60 px-5 py-3 rounded-2xl border border-white/5 flex flex-col gap-1 min-w-[120px]">
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Verification</span>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-amber-500"/>
                                    <span className="text-lg font-black text-white">{pendingCount}</span>
                                </div>
                            </div>
                            <div className="bg-black/60 px-5 py-3 rounded-2xl border border-white/5 flex flex-col gap-1 min-w-[120px]">
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Wallet</span>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-green-400"/>
                                    <span className="text-lg font-black text-white">₹{Number(profile.wallet_balance).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
                        <Button onClick={onSwitchToGetFunded} size="lg" className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                            Get Funding <PlusCircle className="ml-2 w-4 h-4"/>
                        </Button>
                        <Button asChild variant="outline" className="h-11 border-white/10 bg-white/5 text-white font-bold text-[10px] uppercase rounded-xl">
                            <Link href="/guide">Trading Rules</Link>
                        </Button>
                        <Button asChild variant="outline" className="h-11 border-white/10 bg-white/5 text-white font-bold text-[10px] uppercase rounded-xl shadow-lg">
                            <Link href="https://t.me/FundedStock_assistant_bot" target="_blank">Support</Link>
                        </Button>
                    </div>
                </div>
            </GlassCard>

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">Account Portfolio</h2>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Manage individual session credentials</p>
                    </div>
                    {!kycVerified && accounts.filter(a => !a.is_trial).length > 0 && (
                        <Link href="/kyc" className="flex items-center gap-2 bg-amber-400/10 text-amber-400 px-4 py-2 rounded-xl border border-amber-400/20 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-right-4">
                            <ShieldAlert className="w-3.5 h-3.5"/> Action Required: Identity Verification
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.length > 0 ? (
                        accounts.map((acc: any) => <AccountCard key={acc.id} account={acc} kycVerified={kycVerified} />)
                    ) : (
                        <GlassCard className="col-span-full p-20 text-center border-dashed border-white/10 bg-white/[0.01]">
                            <div className="mx-auto h-20 w-20 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mb-8 shadow-2xl">
                                <Activity className="h-10 w-10 text-gray-800" />
                            </div>
                            <div className="space-y-2 mb-10">
                                <h3 className="text-2xl font-black text-white tracking-tight">NO ACTIVE ACCOUNTS</h3>
                                <p className="text-gray-500 max-w-sm mx-auto text-sm font-medium uppercase tracking-[0.2em]">You have not started any funding challenges yet.</p>
                            </div>
                            <Button onClick={onSwitchToGetFunded} size="lg" className="bg-primary text-white font-black uppercase tracking-widest text-xs px-12 h-14 rounded-2xl shadow-2xl shadow-primary/20 transition-all hover:scale-110">
                                Start Evaluation <ArrowRight className="ml-3 h-5 w-5"/>
                            </Button>
                        </GlassCard>
                    )}
                </div>
            </div>
        </div>
    );
}
