
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Target, Clock, Globe } from 'lucide-react';
import Link from 'next/link';

const RuleItem = ({ title, value }: { title: React.ReactNode, value: React.ReactNode }) => (
    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
        <p className="font-medium text-muted-foreground">{title}</p>
        <p className="font-bold text-foreground">{value}</p>
    </div>
);

export default function OneStepRulesPage() {
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
                        <h1 className="text-4xl font-extrabold tracking-tight">One-Step Evaluation Rules</h1>
                    </div>
                    <div className="max-w-4xl mx-auto space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">One-Step Rules</CardTitle>
                                <CardDescription>For experienced traders — a faster path to funding.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <RuleItem title="Profit Target" value="10%" />
                                <RuleItem title="Max Drawdown" value="5%" />
                                <RuleItem title="Daily Drawdown" value="2%" />
                                <RuleItem title="Minimum Trading Days" value="5" />
                                <RuleItem title="Time Limit to Achieve Target" value="No Time Limit" />
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><Target className="h-5 w-5" /> Trading Style</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-muted-foreground">
                                <p><Check className="inline h-4 w-4 mr-2 text-green-500"/>Intraday & Swing trading are allowed.</p>
                                <p><Check className="inline h-4 w-4 mr-2 text-green-500"/>Overnight holding of positions is permitted.</p>
                                <p><Check className="inline h-4 w-4 mr-2 text-destructive"/>News trading is not allowed (alerts will be sent).</p>
                            </CardContent>
                        </Card>

                        <Card>
                             <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><Clock className="h-5 w-5" /> Consistency Rule</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <h4 className="font-bold">20% Rule:</h4>
                                <p className="text-muted-foreground">No single day’s profit can exceed 20% of the total profits made.</p>
                                <p className="text-xs text-muted-foreground mt-1">(Example: For a total profit of ₹10,000, the maximum profit in a single day cannot exceed ₹2,000).</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><Globe className="h-5 w-5" /> Markets Allowed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                    <li>Indian Markets: NSE/BSE F&O, Indices, Equity</li>
                                    <li>Global Markets: US30, NASDAQ, S&P500, DAX, FTSE</li>
                                    <li>Forex: Major & Minor Pairs</li>
                                    <li>Commodities: Gold, Silver, Crude Oil</li>
                                    <li>Crypto: BTC, ETH, LTC, etc.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
