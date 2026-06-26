import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Check, Target, Clock, Globe, Shield, FileText, HelpCircle, IndianRupee } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/server';

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

const FaqItem = ({ question, answer }: { question: string, answer: string }) => (
    <AccordionItem value={question}>
        <AccordionTrigger>{question}</AccordionTrigger>
        <AccordionContent>
            {answer}
        </AccordionContent>
    </AccordionItem>
);


export default async function OneStepRulesPage() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const backUrl = session ? "/welcome" : "/pricing";
    const backLabel = session ? "Back to Dashboard" : "Back to Plans";

    return (
        <div className="dark-theme">
            <div className="bg-background min-h-screen text-foreground">
                <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
                    <div className="container mx-auto flex h-16 items-center justify-center px-4">
                        <Button asChild variant="outline" className="rounded-full">
                            <Link href={backUrl}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {backLabel}
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
                                <CardTitle className="text-xl">One-Step Rules (Summary)</CardTitle>
                                <CardDescription>For experienced traders — a faster path to funding.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <RuleItem title="Profit Target" value="10%" />
                                <RuleItem title="Overall Trailing Drawdown" value="10%" />
                                <RuleItem title="Daily Trailing Drawdown" value="5%" />
                                <RuleItem title="Max Loss per Trade" value="2%" />
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

                        <Separator className="my-12" />

                        {/* --- Detailed Rules --- */}
                        <div className="text-center pt-8">
                            <h2 className="text-3xl font-bold tracking-tight">Detailed Breakdown & Live Account Rules</h2>
                            <p className="text-muted-foreground mt-2">Stocks & F&O · Indian Markets (NSE/BSE) · SEBI-regulated exchange leverage</p>
                        </div>

                        <div className="flex justify-center flex-wrap gap-4 font-semibold text-muted-foreground">
                            <span>₹1 Lakh</span>
                            <span>₹2 Lakh</span>
                            <span>₹5 Lakh</span>
                            <span>₹10 Lakh</span>
                            <span>₹25 Lakh</span>
                            <span>₹50 Lakh</span>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><Shield className="text-primary"/> Evaluation Rules — 1 Step to Funding</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DetailedRule title="Profit Target" tag="10% of account" description="Achieve a net profit of 10% on your starting account balance to qualify for a funded account. For a ₹5 Lakh account, that means ₹50,000 in net profit. The target must be reached while keeping all other rules intact." />
                                <DetailedRule title="Maximum Daily Loss" tag="5% of account" description="You cannot lose more than 5% of your account balance in a single trading day. This is calculated from your account balance at the start of that day. On a ₹10 Lakh account, ₹50,000 in losses on one day will immediately fail the evaluation." tagVariant="destructive" />
                                <DetailedRule title="Maximum Overall Drawdown" tag="10% of account" description="Your account equity must never fall more than 10% below the original starting balance at any point during the evaluation. This is a real-time check. If equity breaches this 10% threshold, the account is failed immediately." tagVariant="destructive" />
                                <DetailedRule title="Maximum Loss Per Trade" tag="2% of capital" description="No single trade may result in a loss exceeding 2% of your total account capital. This rule promotes proper risk management and ensures no single mistake ends your evaluation." tagVariant="destructive" />
                                <DetailedRule title="Minimum Trading Days" tag="5 separate days" description="At least one trade must be executed on 5 different calendar days. Hitting the profit target in fewer than 5 days will not qualify you — the evaluation continues until the day count is met." tagVariant="secondary" />
                                <DetailedRule title="Time Limit" tag="No time limit" description="There is no expiry on the 1-Step evaluation. You may take as many days as needed to reach the profit target. Trade at your own pace." tagVariant="secondary" />
                                <DetailedRule title="Leverage" tag="Exchange limit only" description="Leverage is capped at the maximum permitted by NSE/BSE under SEBI regulations. For F&O, standard SPAN + Exposure margin rules apply as defined by the exchange." tagVariant="destructive" />
                                <DetailedRule title="Maximum Capital Per Trade" tag="80% of account" description="No single open position may use more than 80% of total account capital at any time. Going all-in on a single trade is a direct violation." tagVariant="destructive" />
                                <DetailedRule title="Minimum Holding Time" tag="45 seconds per trade" description="Each trade must be held for a minimum of 45 seconds from entry to exit. High-frequency scalping strategies that open and close positions in seconds are a violation of this rule and will fail the evaluation." tagVariant="destructive" />
                                <DetailedRule title="News Trading Restriction" tag="±5 min window banned" description="Trading is not permitted 5 minutes before or after any major scheduled market event. Trades placed during these windows will be voided." tagVariant="destructive" />
                                <DetailedRule title="Consistency Rule — 20% Cap" tag="Max 20% of total profit per day" description="No single trading day's profit can exceed 20% of your total accumulated profits at that point. Any excess profit from that day will be excluded from the final target calculation." tagVariant="destructive" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><IndianRupee className="text-primary"/> Funded Account — Live Trading Rules</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DetailedRule title="Profit Split" tag="80% Trader / 20% Firm" description="You keep 80% of all profits on your funded account. FundedStock retains 20% as its share." />
                                <DetailedRule title="Payout Cycle" tag="Every 14 days" description="Payout requests are available every 14 days, provided you have traded on at least 5 days within that cycle. Minimum payout amount is ₹2,000." />
                                <DetailedRule title="Evaluation Fee Refund" tag="100% on 3rd Payout" description="Your full evaluation fee is automatically refunded on your 3rd successful payout — provided each payout meets the 5 trading day minimum and ₹2,000 threshold." />
                                <DetailedRule title="Stop Loss — Mandatory" tag="Required on every trade" description="Every position on the live funded account must have a stop loss set at the time of entry. Positions without a stop loss will be flagged and may be force-closed." tagVariant="destructive" />
                                <DetailedRule title="Max Daily Loss (Funded)" tag="5% of account" description="The 5% daily loss limit carries into the funded account. Breaching this triggers an automatic account suspension." tagVariant="destructive" />
                                <DetailedRule title="Max Overall Drawdown (Funded)" tag="10% of account" description="The overall drawdown limit on funded accounts is 10% from the original account balance. Breaching this results in immediate termination." tagVariant="destructive" />
                                <DetailedRule title="Minimum Holding Time" tag="45 seconds per trade" description="The 45-second minimum holding time per trade rule carries over to the live funded account. Trades closed before this window are a compliance violation." tagVariant="destructive" />
                            </CardContent>
                        </Card>
                        
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><FileText className="text-primary"/> Terms & Conditions — Section 8.2 (Important Clauses)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Overnight Position Risk:</strong> While overnight holding is permitted, any position held beyond market hours that results in a gap loss will count fully toward that day's 5% daily loss limit. Gap losses are the sole responsibility of the trader.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Swing Trade Drawdown Monitoring:</strong> Overnight positions are subject to real-time mark-to-market valuation. If unrealised loss on any position causes overall drawdown to breach 10%, the account will be flagged for review.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Third-Party Tools & Copy Trading:</strong> Use of automated trade copiers, signal services, or any third-party algorithmic execution tools is strictly prohibited.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Inactive Account Policy:</strong> Accounts showing zero trading activity for 60 consecutive calendar days will be placed under dormancy review. Inactivity beyond 90 days results in account closure.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><HelpCircle className="text-primary"/> Frequently Asked Questions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    <FaqItem
                                        question="Is the 1-Step evaluation easier than the 2-Step?"
                                        answer="Not necessarily. The 1-Step has no time limit and allows overnight holding, making it flexible. However, the profit target is higher at 10%. Risk management is critical regardless of the plan chosen."
                                    />
                                    <FaqItem
                                        question="Can I hold F&O positions overnight?"
                                        answer="Yes, both equity and F&O positions can be held overnight and across multiple days. However, any gap loss that occurs when the market reopens will count toward your daily loss limit (5%) for that day."
                                    />
                                    <FaqItem
                                        question="How does the 20% consistency rule work in practice?"
                                        answer="The rule tracks your cumulative profit. If your total profit is ₹15,000, you cannot earn more than ₹3,000 (20%) on any single day toward passing. Excess profit from that day is excluded from the qualification calculation."
                                    />
                                    <FaqItem
                                        question="How is the 5% daily loss limit calculated for overnight positions?"
                                        answer="The daily loss limit is calculated from your account balance at the start of each trading day. Gap losses at market open are counted against the new day's 5% limit."
                                    />
                                </Accordion>
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
