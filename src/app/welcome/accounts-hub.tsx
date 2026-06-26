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
    // PTP accounts do not require KYC according to user instructions
    const isPtp = account.account_model === 'passthrupay';
    const isWaitingKyc = paymentApproved && !kycVerified && !isBreached && !isPtp;
    const isWaitingApproval = !paymentApproved;

    return (
        <GlassCard className={cn("group transition-all duration-300 hover:scale-[1.01] border-white/10", isBreached && "border-destructive/30", (isWaitingApproval || isWaitingKyc) && "border-amber-400/30")}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg text-white font-bold">{account.plan_name}</CardTitle>
                        <CardDescription className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-1.5">
                            <Grid3x3 className="w-3.5 h-3.5 opacity-50"/> {account.id.substring(0, 8)}
                        </CardDescription>
                    </div>
                    {isBreached ? (
                        <div className="bg-destructive/10 text-destructive p-2 rounded-full"><ShieldAlert className="w-4 h-4"/></div>
                    ) : isWaitingApproval ? (
                        <div className="bg-amber-400/10 text-amber-400 p-2 rounded-full animate-pulse"><Clock className="w-4 h-4"/></div>
                    ) : isWaitingKyc ? (
                         <div className="bg-amber-400/10 text-amber-400 p-2 rounded-full"><FileCheck className="w-4 h-4"/></div>
                    ) : (
                        <div className="bg-green-500/10 text-green-400 p-2 rounded-full"><CheckCircle className="w-4 h-4"/></div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[11px] font-semibold text-gray-500">Status</p>
                        <p className={cn("text-sm font-bold capitalize mt-1", 
                            isBreached ? "text-red-400" : 
                            isWaitingApproval ? "text-amber-400" : 
                            isWaitingKyc ? "text-amber-400" : "text-green-400"
                        )}>
                            {isBreached ? "Breached" : 
                             isWaitingApproval ? "Pending" : 
                             isWaitingKyc ? "Needs KYC" : "Active"}
                        </p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[11px] font-semibold text-gray-500">Model</p>
                        <p className="text-sm font-bold text-white mt-1 capitalize">{account.account_model === 'passthrupay' ? 'PTP' : 'Standard'}</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-0">
                {isWaitingApproval ? (
                    <Button disabled className="w-full h-10 bg-slate-800 text-gray-500 border border-white/5 text-xs font-bold">Verifying Payment</Button>
                ) : isWaitingKyc ? (
                    <Button asChild className="w-full h-10 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs">
                        <Link href="/kyc">Finalize KYC <ArrowRight className="ml-2 w-4 h-4"/></Link>
                    </Button>
                ) : (
                    <Button asChild className={cn("w-full h-10 bg-primary hover:bg-primary/90 text-white shadow-lg text-xs font-bold", isBreached && "bg-slate-800 hover:bg-slate-700")}>
                        <Link href={`/welcome/dashboard/${account.id}`}>
                            {isBreached ? "Audit History" : "Account Dashboard"} <ArrowRight className="ml-2 w-4 h-4"/>
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </GlassCard>
    );
};

export function AccountsHub({ accounts, profile, onSwitchToGetFunded }: { accounts: any[], profile: any, onSwitchToGetFunded: () => void }) {
    const kycVerified = profile.kyc_status === 'verified';
    const hasAccounts = accounts.length > 0;

    return (
        <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Your Portfolio</h2>
                    <p className="text-gray-400 text-base font-medium">Manage multiple accounts and track your performance.</p>
                </div>
                 {!kycVerified && hasAccounts && (
                    <div className="flex items-center gap-2 bg-amber-400/10 text-amber-400 px-3 py-1.5 rounded-full border border-amber-400/20 text-xs font-bold">
                        <ShieldAlert className="w-4 h-4"/> Action Required: KYC
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
                {hasAccounts ? (
                    accounts.map((acc: any) => <AccountCard key={acc.id} account={acc} kycVerified={kycVerified} />)
                ) : (
                    <GlassCard className="col-span-full p-16 text-center border-dashed border-white/10">
                        <div className="mx-auto h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <PlusCircle className="h-8 w-8 text-gray-800" />
                        </div>
                        <h3 className="text-xl font-bold text-white">No active accounts</h3>
                        <p className="text-gray-400 max-w-xs mx-auto mt-2 mb-8 text-sm font-medium">Choose a funding plan to start your journey into the markets.</p>
                        <Button onClick={onSwitchToGetFunded} size="lg" className="bg-primary text-white font-bold rounded-xl px-10 h-12 text-sm shadow-xl shadow-primary/20">
                            Get Funded <ArrowRight className="ml-2 h-4 w-4"/>
                        </Button>
                    </GlassCard>
                )}
            </div>
        </section>
    );
}