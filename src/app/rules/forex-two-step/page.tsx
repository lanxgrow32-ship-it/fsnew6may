
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Ban, Check, Globe, Target, Clock, Shield, IndianRupee, FileText, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const RuleItem = ({ title, value }: { title: React.ReactNode, value: React.ReactNode }) => (
    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
        <p className="font-medium text-muted-foreground">{title}</p>
        <p className="font-bold text-foreground">{value}</p>
    </div>
);

const DetailedRule = ({ title, tag, description, tagVariant = 'default' }: { title: string, tag: string, description: string, tagVariant?: 'default' | 'destructive' | 'secondary' }) => (
    <div className="border-t py-4">
        <div className="flex justify-between items-start">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <div className={`text-xs font-semibold px-2 py-1 rounded-md ${tagVariant === 'destructive' ? 'bg-destructive/10 text-destructive' : tagVariant === 'secondary' ? 'bg-secondary/10 text-secondary-foreground' : 'bg-primary/10 text-primary'}`}>
                {tag}
            </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
);

export default function ForexRulesPage() {
    return (
        <div className="dark-theme">
            <div className="bg-background min-h-screen text-foreground pb-20">
                <main className="container mx-auto p-4 md:p-8 pt-12">
                    <div className="text-center mb-12">
                        <div className="flex justify-center mb-6">
                            <Button variant="ghost" asChild className="rounded-full text-gray-500 hover:text-white">
                                <Link href="/forex-pricing"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Pricing</Link>
                            </Button>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight">Forex 2-Step Rules</h1>
                    </div>
                    <div className="max-w-4xl mx-auto space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Global Forex Arena (Summary)</CardTitle>
                                <CardDescription>Rules for international currency pairs, crypto, and commodities.</CardDescription>
                            </CardHeader>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader><CardTitle>Phase 1: Challenge</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    <RuleItem title="Profit Target" value="8%" />
                                    <RuleItem title="Daily Drawdown" value="5%" />
                                    <RuleItem title="Overall Drawdown" value="10%" />
                                    <RuleItem title="Min. Trading Days" value="5" />
                                    <RuleItem title="Max Time" value="30 days" />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>Phase 2: Verification</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    <RuleItem title="Profit Target" value="5%" />
                                    <RuleItem title="Daily Drawdown" value="5%" />
                                    <RuleItem title="Overall Drawdown" value="10%" />
                                    <RuleItem title="Min. Trading Days" value="8" />
                                    <RuleItem title="Max Time" value="60 days" />
                                </CardContent>
                            </Card>
                        </div>
                        
                        <Card>
                             <CardHeader><CardTitle className="text-xl">Arena Protocols</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-3"><Ban className="h-5 w-5 text-destructive mt-1 shrink-0" /><p className="text-muted-foreground"><strong>Leverage:</strong> Fixed at 1:100 for Forex, 1:50 for Commodities.</p></div>
                                <div className="flex items-start gap-3"><Check className="h-5 w-5 text-green-500 mt-1 shrink-0" /><p className="text-muted-foreground"><strong>Holding:</strong> Overnight and Weekend holding permitted on Forex plans.</p></div>
                                <div className="flex items-start gap-3"><Ban className="h-5 w-5 text-destructive mt-1 shrink-0" /><p className="text-muted-foreground"><strong>Prohibited:</strong> Hedging, copy trading, and martingale bots result in breach.</p></div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><Globe className="text-primary"/> Allowed Instruments</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    <li><strong>Major/Minor Forex Pairs:</strong> EURUSD, GBPUSD, USDJPY, AUDCAD, etc.</li>
                                    <li><strong>Commodities:</strong> Gold (XAUUSD), Silver (XAGUSD), WTI Crude Oil.</li>
                                    <li><strong>Crypto:</strong> BTCUSD, ETHUSD (High volatility awareness required).</li>
                                    <li><strong>Indices:</strong> US30, NAS100, GER30.</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary/10 border-primary">
                            <CardHeader><CardTitle className="text-xl">Reward Share</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-primary">80% Profit Split — Paid Bi-Weekly</p>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
