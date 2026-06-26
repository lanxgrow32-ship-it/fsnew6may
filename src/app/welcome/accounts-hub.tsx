'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
    PlusCircle, 
    ArrowRight, 
    Grid3x3, 
    ShieldAlert, 
    Clock, 
    CheckCircle,
    FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

const AccountCard = ({ account, kycVerified }: { account: any, kycVerified: boolean }) => {
    const paymentApproved = account.is_approved;
    const isBreached = account.status === 'breached';
    const isWaitingKyc = paymentApproved && !kycVerified && !isBreached;
    const isWaitingApproval = !paymentApproved;

    return (
        <GlassCard className={cn("group transition-all duration-300 hover:scale-[1.02] border-white/10", isBreached && "border-destructive/30", (isWaitingApproval || isWaitingKyc) && "border-amber-400/30")}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl text-white font-bold">{account.plan_name}</CardTitle>
                        <CardDescription className="text-gray-400 flex items-center gap-2 mt-1">
                            <Grid3x3 className="w-3 h-3"/> {account.id.substring(0, 8)}
                        </CardDescription>
                    </div>
                    {isBreached ? (
                        <div className="bg-destructive/10 text-destructive p-2 rounded-full"><ShieldAlert className="w-5 h-5"/></div>
                    ) : isWaitingApproval ? (
                        <div className="bg-amber-400/10 text-amber-400 p-2 rounded-full animate-pulse"><Clock className="w-5 h-5"/></div>
                    ) : isWaitingKyc ? (
                         <div className="bg-amber-400/10 text-amber-400 p-2 rounded-full"><FileCheck className="w-5 h-5"/></div>
                    ) : (
                        <div className="bg-green-500/10 text-green-400 p-2 rounded-full"><CheckCircle className="w-5 h-5"/></div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Status</p>
                        <p className={cn("text-sm font-semibold capitalize mt-0.5", 
                            isBreached ? "text-red-400" : 
                            isWaitingApproval ? "text-amber-400" : 
                            isWaitingKyc ? "text-amber-400" : "text-green-400"
                        )}>
                            {isBreached ? "Breached" : 
                             isWaitingApproval ? "Awaiting Verification" : 
                             isWaitingKyc ? "Needs KYC" : "Live & Active"}
                        </p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Model</p>
                        <p className="text-sm font-semibold text-white mt-0.5 capitalize">{account.account_model}</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-0">
                {isWaitingApproval ? (
                    <Button disabled className="w-full bg-slate-800 text-gray-500 border border-white/5">Order Under Review</Button>
                ) : isWaitingKyc ? (
                    <Button asChild className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold">
                        <Link href="/kyc">Complete KYC <ArrowRight className="ml-2 w-4 h-4"/></Link>
                    </Button>
                ) : (
                    <Button asChild className={cn("w-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg", isBreached && "bg-slate-800 hover:bg-slate-700")}>
                        <Link href={`/welcome/dashboard/${account.id}`}>
                            {isBreached ? "View History" : "Launch Dashboard"} <ArrowRight className="ml-2 w-4 h-4"/>
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </GlassCard>
    );
};

export function AccountsHub({ accounts, profile, onSwitchToGetFunded }: { accounts: any[], profile: any, onSwitchToGetFunded: () => void }) {
    const kycVerified = profile.kyc_status === 'verified';

    return (
        <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Your Portfolio</h2>
                    <p className="text-gray-400 mt-1 text-lg">Manage multiple accounts and track your performance.</p>
                </div>
                 {!kycVerified && (
                    <div className="flex items-center gap-2 bg-amber-400/10 text-amber-400 px-4 py-2 rounded-full border border-amber-400/20 text-sm font-semibold">
                        <ShieldAlert className="w-4 h-4"/> Identity Verification Required
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {accounts.length > 0 ? (
                    accounts.map((acc: any) => <AccountCard key={acc.id} account={acc} kycVerified={kycVerified} />)
                ) : (
                    <GlassCard className="col-span-full p-16 text-center border-dashed">
                        <PlusCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white">No active accounts</h3>
                        <p className="text-gray-400 max-w-sm mx-auto mt-2 mb-8">Ready to start trading? Select your first funding plan from our marketplace.</p>
                        <Button onClick={onSwitchToGetFunded} size="lg" className="bg-primary text-primary-foreground font-bold rounded-xl px-8">
                            Get Funding Plan <ArrowRight className="ml-2 h-4 w-4"/>
                        </Button>
                    </GlassCard>
                )}
            </div>
        </section>
    );
}
