
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Ban, Check, Globe } from 'lucide-react';
import Link from 'next/link';

const RuleItem = ({ title, value }: { title: React.ReactNode, value: React.ReactNode }) => (
    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
        <p className="font-medium text-muted-foreground">{title}</p>
        <p className="font-bold text-foreground">{value}</p>
    </div>
);

const RestrictionItem = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <Ban className="h-5 w-5 text-destructive mt-1 shrink-0" />
        <p className="text-muted-foreground">{children}</p>
    </div>
);

export default function TwoStepRulesPage() {
    return (
        <div className="dark-theme">
            <div className="bg-background min-h-screen text-foreground">
                <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4">
                        <h1 className="text-2xl font-bold text-primary">Two-Step Evaluation Rules</h1>
                        <Button asChild variant="outline">
                            <Link href="/pricing">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Plans
                            </Link>
                        </Button>
                    </div>
                </header>
                <main className="container mx-auto p-4 md:p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Two-Step Evaluation Model</CardTitle>
                                <CardDescription>Prove your consistency & discipline to get funded for multi-market access.</CardDescription>
                            </CardHeader>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Step 1 Rules</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <RuleItem title="Profit Target" value="10%" />
                                    <RuleItem title="Max Daily Loss" value="5%" />
                                    <RuleItem title="Max Overall Loss" value="10%" />
                                    <RuleItem title="Minimum Trading Days" value="5" />
                                    <RuleItem title="Maximum Duration" value="30 days" />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Step 2 Rules</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <RuleItem title="Profit Target" value="5%" />
                                    <RuleItem title="Max Daily Loss" value="5%" />
                                    <RuleItem title="Max Overall Loss" value="10%" />
                                    <RuleItem title="Minimum Trading Days" value="5" />
                                    <RuleItem title="Maximum Duration" value="60 days" />
                                </CardContent>
                            </Card>
                        </div>
                        
                        <Card>
                             <CardHeader>
                                <CardTitle className="text-xl">Common Rules for Both Steps</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <RestrictionItem><strong>Trading Style:</strong> Intraday only (no overnight positions).</RestrictionItem>
                                <RestrictionItem><strong>News Time Trading:</strong> Not allowed (alerts sent before restricted times).</RestrictionItem>
                                <RestrictionItem><strong>Manual Trading Only:</strong> No Algo/API based trading.</RestrictionItem>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><Globe className="h-5 w-5" /> Markets Allowed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Indian, Forex, Crypto, and Global Indices markets are allowed during the evaluation.</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                             <CardHeader>
                                <CardTitle className="text-xl">Funded Stage (After Passing)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                                    <p className="text-muted-foreground">Trade any approved market: Indian, Forex, Crypto, Global.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                                    <p className="text-muted-foreground"><strong>Profit Split:</strong> 80% for the Trader, 20% for FundedStock.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                                    <p className="text-muted-foreground">First payout is available after 7 active trading days.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                                    <p className="text-muted-foreground"><strong>Payout Methods:</strong> Bank Transfer / UPI / Crypto (USDT).</p>
                                </div>
                                 <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                                    <p className="text-muted-foreground">Drawdown resets after each successful payout.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
