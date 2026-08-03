
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';
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

                    <div className="space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShieldCheck className="text-primary w-5 h-5" /> 1. Instant Pro Execution Policy
                            </h2>
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="pt-6 space-y-4 text-sm text-gray-400 leading-relaxed">
                                    <p>
                                        To maintain liquidity standards and ensure professional execution, all Instant Pro category accounts are subject to a performance hurdle. 
                                        A trader is eligible for a performance reward disbursement only once the account balance has reached a minimum threshold of 1.5x the initial starting capital. 
                                        Withdrawal requests made below this balance level will be automatically deferred.
                                    </p>
                                    <p>
                                        The 7-day validity period is absolute. Upon expiration, the account session will be terminated and all open positions will be force-closed by the risk engine. 
                                        Any remaining positive equity that meets the withdrawal hurdle will be processed according to the standard payout cycle.
                                    </p>
                                </CardContent>
                            </Card> section
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="text-primary w-5 h-5" /> 2. Trading Conduct
                            </h2>
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="pt-6 space-y-4 text-sm text-gray-400 leading-relaxed">
                                    <p>
                                        All trades must be held for a minimum of 45 seconds. High-frequency automated strategies or "tick-scalping" techniques that bypass this duration are strictly prohibited 
                                        and will result in the immediate disqualification of the account without refund of activation fees.
                                    </p>
                                    <p>
                                        Hedging across multiple accounts or using third-party signal services to manipulate simulated execution metrics is considered a violation of our fair-trading agreement.
                                    </p>
                                </CardContent>
                            </Card>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShieldCheck className="text-primary w-5 h-5" /> 3. Simulated Environment Disclosure
                            </h2>
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="pt-6 space-y-4 text-sm text-gray-400 leading-relaxed">
                                    <p>
                                        All trading provided by FundedStock is conducted in a 100% simulated environment. Performance Rewards are professional fees paid to traders for successful 
                                        adherence to risk protocols and consistency targets. These rewards do not constitute investment returns, dividends, or guaranteed income.
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
