
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Check, Timer, Zap, Shield, Ban, Trophy, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const RuleItem = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <Check className="h-5 w-5 text-green-500 mt-1 shrink-0" />
        <p className="text-muted-foreground">{children}</p>
    </div>
);

export default function InstantProRulesPage() {
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-primary/10 border-primary/20 text-center p-6">
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

                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-3">
                                <Shield className="text-primary w-6 h-6" /> Execution & Risk Limits
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <RuleItem><strong>Instant Activation:</strong> No challenge, no targets. Start trading live capital immediately.</RuleItem>
                                <RuleItem><strong>Daily Payouts:</strong> Profits can be withdrawn every single day once eligibility criteria are met.</RuleItem>
                                <RuleItem><strong>Overall Drawdown:</strong> 10% Trailing. If equity drops below 10% of your peak balance, the account is breached.</RuleItem>
                                <RuleItem><strong>Daily Drawdown:</strong> 5% per day based on the opening balance of the session.</RuleItem>
                            </div>
                            
                            <Separator className="bg-white/5" />
                            
                            <div className="space-y-3">
                                <h4 className="text-sm font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                                    <Ban className="w-4 h-4" /> Prohibited Actions
                                </h4>
                                <ul className="list-disc list-inside text-sm text-gray-400 space-y-2 ml-1">
                                    <li>News Trading is restricted ±5 minutes around high-impact events.</li>
                                    <li>Martingale, Hedging, and Signal Bots result in immediate termination.</li>
                                    <li>Minimum holding time per individual position is mandatory.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-3">
                                <FileText className="text-primary w-6 h-6" /> Compliance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-gray-400 leading-relaxed">
                            <p>All Instant Pro accounts are governed by our standard execution policies and weekly risk protocols. Please ensure you have reviewed the full terms before commencing trading.</p>
                            <div className="pt-4">
                                <Button asChild variant="outline" className="bg-black/20 border-white/10 hover:bg-white/5 text-white font-bold text-xs">
                                    <Link href="/rules/terms-and-conditions" className="flex items-center gap-2">
                                        View Full Terms & Conditions <ChevronRight className="w-4 h-4"/>
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-white/5 bg-white/[0.01]">
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">T&C Apply</p>
                        </CardFooter>
                    </Card>

                    <div className="text-center">
                        <Button asChild size="lg" className="rounded-full px-12 h-14 bg-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/20">
                            <Link href="/signup">Secure Your Pro Seat</Link>
                        </Button>
                    </div>
                </main>
            </div>
        </div>
    );
}
