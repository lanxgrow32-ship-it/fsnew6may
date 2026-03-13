
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Check, IndianRupee, Shield, Globe, Ban } from 'lucide-react';
import Link from 'next/link';

const RuleItem = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <Check className="h-5 w-5 text-green-500 mt-1 shrink-0" />
        <p className="text-muted-foreground">{children}</p>
    </div>
);

const RestrictionItem = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <Ban className="h-5 w-5 text-destructive mt-1 shrink-0" />
        <p className="text-muted-foreground">{children}</p>
    </div>
);

export default function InstantFundingRulesPage() {
    return (
        <div className="dark-theme">
            <div className="bg-background min-h-screen text-foreground">
                <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
                    <div className="container mx-auto flex h-16 items-center justify-center px-4">
                        <Button asChild variant="outline">
                            <Link href="/pricing">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Plans
                            </Link>
                        </Button>
                    </div>
                </header>
                <main className="container mx-auto p-4 md:p-8">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold tracking-tight">Instant Funding Rules</h1>
                    </div>
                    <div className="max-w-4xl mx-auto space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Instant Funding (No Evaluation Needed)</CardTitle>
                                <CardDescription>Trade instantly within 15 minutes — no challenges, no waiting!</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="font-semibold flex items-center gap-2"><IndianRupee className="h-5 w-5" /> Account Sizes & Fees</h3>
                                    <p className="text-muted-foreground">₹1,00,000 / ₹2,00,000 / ₹5,00,000 / ₹10,00,000 / ₹25,00,000</p>
                                    <p className="text-sm text-muted-foreground">One-Time Fee: ₹5,999 – ₹54,999 (based on plan)</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><Shield className="h-5 w-5" /> Risk Rules</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <RuleItem><strong>Overall Trailing Drawdown:</strong> 10% of account balance</RuleItem>
                                <RuleItem><strong>Daily Trailing Drawdown:</strong> 5% of account balance</RuleItem>
                                <RuleItem><strong>Max Loss per Trade:</strong> 2% of capital</RuleItem>
                                <RuleItem><strong>Max Capital Usage per Trade:</strong> 80%</RuleItem>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Withdrawal Rules</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <RuleItem>Minimum <strong>4 profitable trading days</strong> required before the first payout.</RuleItem>
                                <RuleItem>Weekly payouts are available, subject to performance review.</RuleItem>
                                <RuleItem>Non-compliance with rules may lead to payout rejection or account suspension.</RuleItem>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Trading Restrictions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <RestrictionItem>Trading is prohibited during major high-impact news events. Alert notifications will be sent.</RestrictionItem>
                                <RestrictionItem>Maximum of 3 open positions at any given time.</RestrictionItem>
                                <RestrictionItem>No hedging or copy trading is allowed.</RestrictionItem>
                                <p className="text-sm font-semibold pt-2">All decisions made by the firm are final.</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><Globe className="h-5 w-5" /> Markets Allowed</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold">Indian Stock Market:</h4>
                                    <p className="text-muted-foreground">NSE/BSE – Futures, Options, Equity, Indices (NIFTY, BANKNIFTY, FINNIFTY)</p>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold">Global & International Markets:</h4>
                                    <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                                        <li><strong>Major Indices:</strong> US30, NASDAQ, S&P500, DAX, FTSE</li>
                                        <li><strong>Forex Pairs:</strong> Major & Minor (EURUSD, GBPJPY, USDINR, etc.)</li>
                                        <li><strong>Commodities:</strong> Gold, Silver, Crude Oil, Natural Gas</li>
                                        <li><strong>Crypto Assets:</strong> BTC, ETH, LTC, etc.</li>
                                    </ul>
                                </div>
                                <p className="text-xs text-muted-foreground pt-2">(Trading conditions may vary based on platform availability)</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary/10 border-primary">
                            <CardHeader>
                                <CardTitle className="text-xl">Profit Split</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-primary">80% for You / 20% for FundedStock 2.0</p>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
