
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Check, Target, Clock, Globe, Shield, FileText, HelpCircle, IndianRupee } from 'lucide-react';
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

const FaqItem = ({ question, answer }: { question: string, answer: string }) => (
    <AccordionItem value={question}>
        <AccordionTrigger>{question}</AccordionTrigger>
        <AccordionContent>
            {answer}
        </AccordionContent>
    </AccordionItem>
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
                                <CardTitle className="text-xl">One-Step Rules (Summary)</CardTitle>
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

                        <Separator className="my-12" />

                        {/* --- New Detailed Rules --- */}
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
                                <DetailedRule title="Profit Target" tag="10% of account" description="Achieve a net profit of 10% on your starting account balance to qualify for a funded account. For a ₹5 Lakh account, that means ₹50,000 in net profit. The target must be reached while keeping all other rules intact — a high profit alone is not sufficient to pass." />
                                <DetailedRule title="Maximum Daily Loss" tag="2% of account" description="You cannot lose more than 2% of your account balance in a single trading day. This is calculated from your account balance at the start of that day. On a ₹10 Lakh account, just ₹20,000 in losses on one day will immediately fail the evaluation — no exceptions." tagVariant="destructive" />
                                <DetailedRule title="Maximum Overall Drawdown" tag="5% of account" description="Your account equity must never fall more than 5% below the original starting balance — at any point, including open positions. This is a real-time check. Three consecutive bad days of 2% loss each will breach the overall drawdown and fail the account immediately." tagVariant="destructive" />
                                <DetailedRule title="Minimum Trading Days" tag="5 separate days" description="At least one trade must be executed on 5 different calendar days. Hitting the profit target in fewer than 5 days will not qualify you — the evaluation continues until the day count is met. Consistency is verified, not just profitability." tagVariant="secondary" />
                                <DetailedRule title="Time Limit" tag="No time limit" description="There is no expiry on the 1-Step evaluation. You may take as many days as needed to reach the profit target. Trade at your own pace — whether that takes 2 weeks or 6 months. The only deadline is the one you set for yourself." tagVariant="secondary" />
                                <DetailedRule title="Leverage" tag="Exchange limit only" description="Leverage is capped at the maximum permitted by NSE/BSE under SEBI regulations — no additional margin will be provided. For F&O, standard SPAN + Exposure margin as defined by the exchange applies. This is strictly enforced across both evaluation and funded accounts." tagVariant="destructive" />
                                <DetailedRule title="Maximum Capital Per Trade" tag="80% of account" description="No single open position may use more than 80% of total account capital at any time. This applies to all instruments — equity and F&O. Going all-in on a single trade is a direct violation and will fail the account regardless of the trade outcome." tagVariant="destructive" />
                                <DetailedRule title="Allowed Instruments" tag="Stocks, Options (Buy & Sell), Futures" description="You may trade equity stocks, index & stock options (both buying and writing), and futures listed on NSE/BSE. There are no lot size restrictions — trade as many lots as needed as long as risk rules are not breached." />
                                <DetailedRule title="Trading Style" tag="Intraday & Swing allowed" description="Both intraday and swing trading styles are permitted. You are not required to close positions by end of day — overnight holding of equity and F&O positions is allowed. Trade in a style that suits your strategy, subject to the overnight risk rules in the T&C." />
                                <DetailedRule title="News Trading Restriction" tag="±5 min window banned" description="Trading is not permitted 5 minutes before or after any major scheduled market event — including RBI policy decisions, Union Budget, SEBI announcements, and major earnings releases. You will receive an automated SMS and email alert 30 minutes before each restricted window. Trades placed during these windows will be voided." tagVariant="destructive" />
                                <DetailedRule title="Consistency Rule — 20% Cap" tag="Max 20% of total profit per day" description="No single trading day's profit can exceed 20% of your total accumulated profits at that point. For example, if your total profit so far is ₹10,000, you cannot book more than ₹2,000 on any one day. Any excess profit from that day will be excluded from the final calculation. This rule resets daily against the updated total." tagVariant="destructive" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><IndianRupee className="text-primary"/> Funded Account — Live Trading Rules</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DetailedRule title="Profit Split" tag="80% Trader / 20% Firm" description="You keep 80% of all profits on your funded account. FundedStock retains 20%. There is no cap on earnings — the more consistent your trading, the more you take home." />
                                <DetailedRule title="Payout Cycle" tag="Every 14 days" description="Payout requests are available every 14 days, provided you have traded on at least 5 days within that cycle. Processing takes 3–5 business days. Minimum payout amount is ₹2,000." />
                                <DetailedRule title="Evaluation Fee Refund" tag="100% on 3rd Payout" description="Your full evaluation fee is automatically refunded on your 3rd successful payout — provided each payout meets the 5 trading day minimum and ₹2,000 threshold. The refund is credited alongside your 3rd disbursement." />
                                <DetailedRule title="Stop Loss — Mandatory" tag="Required on every trade" description="Every position on the live funded account must have a stop loss set at the time of entry. This rule does not apply during evaluation, but is strictly enforced once you go live. Positions without a stop loss will be flagged and may be force-closed." tagVariant="destructive" />
                                <DetailedRule title="Max Daily Loss (Funded)" tag="2% of account" description="The 2% daily loss limit carries into the funded account. Breaching this triggers an automatic account suspension. Protecting capital on live accounts is non-negotiable." tagVariant="destructive" />
                                <DetailedRule title="Max Overall Drawdown (Funded)" tag="4% — tighter than evaluation" description="The overall drawdown limit on funded accounts is tightened to 4% from the original account balance. This is stricter than the 5% in evaluation. Breaching this results in immediate account termination with no reinstatement." tagVariant="destructive" />
                            </CardContent>
                        </Card>
                        
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><FileText className="text-primary"/> Terms & Conditions — Section 8.2 (Important Clauses)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Overnight Position Risk:</strong> While overnight holding is permitted, any position held beyond market hours that results in a gap loss will count fully toward that day's 2% daily loss limit. Gap losses from overnight F&O positions — including due to global events, exchange halts, or circuit breakers — are the sole responsibility of the trader.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Swing Trade Drawdown Monitoring:</strong> Overnight and multi-day positions are subject to real-time mark-to-market valuation. If the unrealised loss on any open swing position causes the overall drawdown to breach 5% — even outside market hours — the account will be flagged for immediate review upon market open.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Third-Party Tools & Copy Trading:</strong> Use of automated trade copiers, signal services, or any third-party algorithmic execution tools is strictly prohibited. Detection will result in immediate account termination without refund of evaluation fees.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Inactive Account Policy:</strong> Although there is no time limit on the evaluation, accounts showing zero trading activity for 60 consecutive calendar days will be placed under dormancy review. Reactivation requires written confirmation from the trader. Continued inactivity beyond 90 days may result in account closure.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Minimum Payout Threshold:</strong> Payout requests below ₹2,000 will be automatically rejected. The 14-day cycle resets only after a successful payout is processed. Rejected requests do not restart the cycle.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">1-Step vs 2-Step:</strong> The 1-Step evaluation has a higher profit target (10% vs 8%) and a significantly tighter daily loss limit (2% vs 4%) — meaning just one bad day can consume the entire drawdown buffer. In exchange, there is no time limit and overnight holding is permitted. It is designed for traders with a proven, disciplined strategy.</p>
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
                                        answer="Not necessarily. The 1-Step has no time limit and allows overnight holding, which makes it feel more flexible. However, the daily loss limit is just 2% — half of what the 2-Step allows — and the profit target is higher at 10%. A single bad day can consume your entire drawdown buffer in the 1-Step, making risk management far more critical."
                                    />
                                    <FaqItem
                                        question="Can I hold F&O positions overnight?"
                                        answer="Yes, both equity and F&O positions can be held overnight and across multiple days. However, any gap loss that occurs when the market reopens will count toward your daily loss limit for that day. If a gap loss causes your daily drawdown to exceed 2% or the overall drawdown to breach 5%, the account will fail. Overnight holding is a privilege, not a safety net."
                                    />
                                    <FaqItem
                                        question="How does the 20% consistency rule work in practice?"
                                        answer="The rule tracks your cumulative profit at all times. If your total profit is ₹15,000, you cannot earn more than ₹3,000 (20%) on any single day. If you earn ₹5,000 on one day, only ₹3,000 will count toward your target — the excess ₹2,000 is excluded. This resets against your updated total each day, making it progressively harder to pass using one or two big winning days."
                                    />
                                    <FaqItem
                                        question="Since there is no time limit, can I trade just once a week?"
                                        answer="You can trade at whatever frequency suits your strategy. However, accounts with zero activity for 60 consecutive days will enter dormancy review, and accounts inactive for 90 days may be closed. There is also a minimum of 5 separate trading days required before you can pass — so occasional trading is fine, but complete inactivity for extended periods is not."
                                    />
                                    <FaqItem
                                        question="How is the 2% daily loss limit calculated for overnight positions?"
                                        answer="The daily loss limit is calculated from your account balance at the start of each trading day. If you are holding a swing position and the stock gaps down at market open, that gap loss is counted against the new day's 2% limit — not the previous day. This means a single overnight gap event could simultaneously breach your daily loss limit and push you close to the overall 5% drawdown threshold."
                                    />
                                    <FaqItem
                                        question="Can I do option selling (writing) in the 1-Step evaluation?"
                                        answer="Yes. Option buying and option selling (writing) are both permitted across all NSE/BSE listed instruments. There are no lot size restrictions. However, option selling carries unlimited risk on naked positions — any margin call or sudden spike that causes losses beyond the 2% daily limit will fail the account immediately. Hedged strategies are strongly recommended."
                                    />
                                    <FaqItem
                                        question="What happens to my evaluation if I never breach any rule but also never hit 10%?"
                                        answer="Your evaluation remains open indefinitely — there is no time limit. You can continue trading until you reach the 10% target. The account will only close if you breach a risk rule, trigger the dormancy policy (90 days of inactivity), or choose to forfeit the evaluation."
                                    />
                                    <FaqItem
                                        question="Which should I choose — 1-Step or 2-Step evaluation?"
                                        answer="Choose 1-Step if you are an experienced trader with a swing or positional strategy and strong risk discipline. The no-time-limit and overnight holding flexibility suit patient, methodical traders. Choose 2-Step if you are an intraday or scalping trader who can build profit more quickly with tighter daily sessions — the 4% daily loss buffer in 2-Step gives more room per day, at the cost of a fixed time window."
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
