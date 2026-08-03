
'use server';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
    ArrowLeft, 
    Check, 
    Timer, 
    Zap, 
    Shield, 
    Ban, 
    Trophy, 
    FileText, 
    ChevronRight,
    TrendingUp,
    Target,
    HeartHandshake,
    Rocket,
    Gem,
    Percent,
    ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const RuleItem = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <Check className="h-5 w-5 text-green-500 mt-1 shrink-0" />
        <p className="text-muted-foreground">{children}</p>
    </div>
);

const ProhibitedItem = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-start gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
        <span className="text-lg">❌</span>
        <p className="text-white font-medium text-sm">{children}</p>
    </div>
);

const BenefitItem = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-colors">
        <Icon className="h-6 w-6 text-primary shrink-0" />
        <span className="text-sm font-bold text-white">{title}</span>
    </div>
);

export default async function InstantProRulesPage() {
    return (
        <div className="dark">
            <div className="bg-slate-950 min-h-screen text-gray-200 pb-20 font-poppins">
                <main className="container mx-auto p-4 md:p-8 pt-12 max-w-4xl space-y-12">
                    <div className="text-center space-y-4">
                        <Button variant="ghost" asChild className="text-gray-500 hover:text-white mb-4">
                            <Link href="/pricing"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Plans</Link>
                        </Button>
                        <h1 className="text-5xl font-black tracking-tighter text-white uppercase">Instant PRO Rules</h1>
                        <p className="text-gray-400 text-lg">High-Intensity Weekly Execution Grid</p>
                    </div>

                    {/* Top Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-primary/10 border-primary/20 text-center p-6 shadow-[0_0_30px_rgba(139,44,245,0.1)]">
                            <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                            <h3 className="font-bold text-white uppercase text-xs tracking-widest">Payout Cycle</h3>
                            <p className="text-xl font-black text-primary mt-1">DAILY</p>
                            <p className="text-[10px] text-gray-500 uppercase mt-1">Withdraw Whenever You Want</p>
                        </Card>
                        <Card className="bg-white/5 border-white/10 text-center p-6">
                            <Timer className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                            <h3 className="font-bold text-white uppercase text-xs tracking-widest">Validity</h3>
                            <p className="text-xl font-black text-white mt-1">7 DAYS</p>
                            <p className="text-[10px] text-gray-500 uppercase mt-1">One-Week Cycle</p>
                        </Card>
                        <Card className="bg-white/5 border-white/10 text-center p-6">
                            <Trophy className="h-8 w-8 text-green-500 mx-auto mb-3" />
                            <h3 className="font-bold text-white uppercase text-xs tracking-widest">Profit Share</h3>
                            <p className="text-xl font-black text-white mt-1">80%</p>
                            <p className="text-[10px] text-gray-500 uppercase mt-1">Trader Performance Reward</p>
                        </Card>
                    </div>

                    {/* Execution & Risk Section */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <ShieldCheck className="text-primary w-6 h-6" /> Execution & Risk Parameters
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 text-center space-y-2">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Daily Drawdown</p>
                                <p className="text-3xl font-black text-white">3%</p>
                            </div>
                            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 text-center space-y-2">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Max Drawdown</p>
                                <p className="text-3xl font-black text-white">6%</p>
                            </div>
                            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 text-center space-y-2">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Risk Per Trade</p>
                                <p className="text-3xl font-black text-white">1.5%</p>
                            </div>
                        </div>
                    </section>

                    {/* Detailed Rules Card */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-3">
                                <Shield className="text-primary w-6 h-6" /> Mandatory Protocols
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <RuleItem><strong>Instant Activation:</strong> No challenge, no targets. Start trading live capital immediately.</RuleItem>
                                <RuleItem><strong>Payout Threshold:</strong> Minimum payout is <strong>₹20,000</strong>.</RuleItem>
                                <RuleItem><strong>Trading Days:</strong> Minimum of <strong>2 profitable trading days</strong> required before any withdrawal.</RuleItem>
                                <RuleItem><strong>Risk per Trade:</strong> Maximum loss per single trade is 1.5% of account balance.</RuleItem>
                            </div>
                            
                            <Separator className="bg-white/5" />
                            
                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                                    <Ban className="w-4 h-4" /> Prohibited Trading Conduct
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <ProhibitedItem>Martingale & Grid Strategy Not Allowed</ProhibitedItem>
                                    <ProhibitedItem>High-Frequency / Latency Arbitrage Not Allowed</ProhibitedItem>
                                    <ProhibitedItem>Copy Trading Between Different Users Not Allowed</ProhibitedItem>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Premium Benefits Grid */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2 px-2">
                            <Gem className="text-primary w-6 h-6" /> Premium Benefits
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <BenefitItem icon={Rocket} title="Fast Account Activation" />
                            <BenefitItem icon={Zap} title="Daily Payouts" />
                            <BenefitItem icon={TrendingUp} title="Scaling Opportunity" />
                            <BenefitItem icon={Target} title="Transparent Rules" />
                            <BenefitItem icon={HeartHandshake} title="Dedicated Pro Support" />
                        </div>
                    </section>

                    {/* T&C Redirect Card */}
                    <Card className="bg-white/5 border-white/10 overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-3">
                                <FileText className="text-primary w-6 h-6" /> Institutional Compliance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-gray-400 leading-relaxed">
                            <p>By activating an Instant Pro session, you agree to the full platform protocols. Risk limits are monitored in real-time by the StockMint engine.</p>
                            <div className="pt-4">
                                <Button asChild variant="outline" className="bg-black/20 border-white/10 hover:bg-white/5 text-white font-bold text-xs rounded-xl h-11 px-8">
                                    <a href="https://www.fundedstock.io/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                        Read Full Terms & Conditions <ChevronRight className="w-4 h-4"/>
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-white/5 bg-white/[0.01] py-3">
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">T&C Apply · Official Protocol</p>
                        </CardFooter>
                    </Card>

                    <div className="text-center pt-8">
                        <Button asChild size="lg" className="rounded-full px-12 h-16 bg-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                            <Link href="/signup">Initialize Pro Session</Link>
                        </Button>
                    </div>
                </main>
            </div>
        </div>
    );
}
