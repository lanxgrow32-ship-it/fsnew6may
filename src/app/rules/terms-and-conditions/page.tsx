
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    ArrowLeft, 
    ShieldCheck, 
    FileText, 
    Zap, 
    Ban, 
    TrendingUp, 
    Trophy, 
    Target, 
    Users, 
    Clock, 
    Scale,
    Gem,
    Rocket,
    IndianRupee,
    HeartHandshake
} from 'lucide-react';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
    return (
        <div className="dark">
            <div className="bg-slate-950 min-h-screen text-gray-200 pb-20 font-poppins">
                <main className="container mx-auto p-4 md:p-8 pt-12 max-w-4xl space-y-12">
                    <div className="flex items-center justify-between border-b border-white/5 pb-8">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black tracking-tight text-white uppercase">Terms & Conditions</h1>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Official Platform Protocols</p>
                        </div>
                        <Button variant="ghost" asChild className="text-gray-500 hover:text-white">
                            <Link href="/welcome"><ArrowLeft className="mr-2 h-4 w-4" /> Portfolio</Link>
                        </Button>
                    </div>

                    <div className="space-y-10">
                        {/* 1. Risk Management Parameters */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShieldCheck className="text-primary w-5 h-5" /> 1. Risk Management Parameters
                            </h2>
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-center">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Daily Drawdown</p>
                                            <p className="text-2xl font-black text-white mt-1">3%</p>
                                        </div>
                                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-center">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Max Drawdown</p>
                                            <p className="text-2xl font-black text-white mt-1">6%</p>
                                        </div>
                                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-center">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Risk Per Trade</p>
                                            <p className="text-2xl font-black text-white mt-1">1.5%</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4 italic text-center">
                                        * Risk per trade is calculated based on the starting account balance.
                                    </p>
                                </CardContent>
                            </Card>
                        </section>

                        {/* 2. Payout Protocol */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Trophy className="text-primary w-5 h-5" /> 2. Payout Protocol
                            </h2>
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="pt-6 space-y-4 text-sm text-gray-400 leading-relaxed">
                                    <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                                        <IndianRupee className="h-6 w-6 text-primary shrink-0" />
                                        <div>
                                            <p className="text-white font-bold">Minimum Payout: ₹20,000</p>
                                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Withdrawal Threshold</p>
                                        </div>
                                    </div>
                                    <p className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                        <span>A minimum of <strong>2 profitable trading days</strong> is required before any withdrawal request can be initialized.</span>
                                    </p>
                                </CardContent>
                            </Card>
                        </section>

                        {/* 3. Prohibited Trading Conduct */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Ban className="text-red-500 w-5 h-5" /> 3. Prohibited Trading Conduct
                            </h2>
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="pt-6 space-y-4 text-sm text-gray-400">
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                                            <span className="text-lg">❌</span>
                                            <p className="text-white font-medium">Martingale & Grid Strategy Not Allowed</p>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                                            <span className="text-lg">❌</span>
                                            <p className="text-white font-medium">High-Frequency / Latency Arbitrage Not Allowed</p>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                                            <span className="text-lg">❌</span>
                                            <p className="text-white font-medium">Copy Trading Between Different Users Not Allowed</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-2">
                                        Violation of these conduct rules results in immediate account termination.
                                    </p>
                                </CardContent>
                            </Card>
                        </section>

                        {/* 4. Premium Benefits */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Gem className="text-primary w-5 h-5" /> 4. Premium Benefits
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center gap-4">
                                    <Rocket className="h-6 w-6 text-primary shrink-0" />
                                    <span className="text-sm font-bold text-white">Fast Account Activation</span>
                                </div>
                                <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center gap-4">
                                    <Zap className="h-6 w-6 text-primary shrink-0" />
                                    <span className="text-sm font-bold text-white">Daily Payouts Available</span>
                                </div>
                                <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center gap-4">
                                    <TrendingUp className="h-6 w-6 text-primary shrink-0" />
                                    <span className="text-sm font-bold text-white">Scaling Opportunity (Higher Capital)</span>
                                </div>
                                <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center gap-4">
                                    <Target className="h-6 w-6 text-primary shrink-0" />
                                    <span className="text-sm font-bold text-white">Transparent & Fair Rules</span>
                                </div>
                                <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center gap-4 md:col-span-2 justify-center">
                                    <HeartHandshake className="h-6 w-6 text-primary shrink-0" />
                                    <span className="text-sm font-bold text-white">Dedicated Pro Support Access</span>
                                </div>
                            </div>
                        </section>

                        {/* 5. Institutional Liquidity Standards */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Scale className="text-primary w-5 h-5" /> 5. Institutional Liquidity Standards
                            </h2>
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="pt-6 space-y-4 text-sm text-gray-400 leading-relaxed">
                                    <p>
                                        To maintain liquidity standards and ensure professional execution, all Instant Pro category accounts are subject to a performance hurdle. 
                                        A trader is eligible for a performance reward disbursement only once the account balance has reached a minimum threshold of <strong>1.5x the initial starting capital</strong>. 
                                        Withdrawal requests made below this balance level will be automatically deferred until the target is achieved.
                                    </p>
                                    <p>
                                        The 7-day validity period is absolute. Upon expiration, the account session will be terminated and all open positions will be force-closed by the system. 
                                        Any remaining positive equity that meets the withdrawal hurdle will be processed according to the standard payout cycle.
                                    </p>
                                </CardContent>
                            </Card>
                        </section>
                    </div>

                    <footer className="text-center pt-12 border-t border-white/5">
                        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-[0.4em]">Last Updated: November 2024</p>
                    </footer>
                </main>
            </div>
        </div>
    );
}
