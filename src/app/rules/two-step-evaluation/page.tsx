
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Ban, Check, Globe, Target, Clock, Shield, AlertTriangle, FileText, HelpCircle, IndianRupee } from 'lucide-react';
import Link from 'next/link';

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


export default function TwoStepRulesPage() {
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
                        <h1 className="text-4xl font-extrabold tracking-tight">Two-Step Evaluation Rules</h1>
                    </div>
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* --- Existing Simple Rules --- */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Two-Step Evaluation Model (Summary)</CardTitle>
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
                                <div className="flex items-start gap-3"><Ban className="h-5 w-5 text-destructive mt-1 shrink-0" /><p className="text-muted-foreground"><strong>Trading Style:</strong> Intraday only (no overnight positions).</p></div>
                                <div className="flex items-start gap-3"><Ban className="h-5 w-5 text-destructive mt-1 shrink-0" /><p className="text-muted-foreground"><strong>News Time Trading:</strong> Not allowed (alerts sent before restricted times).</p></div>
                                <div className="flex items-start gap-3"><Ban className="h-5 w-5 text-destructive mt-1 shrink-0" /><p className="text-muted-foreground"><strong>Manual Trading Only:</strong> No Algo/API based trading.</p></div>
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
                                <CardTitle className="text-xl flex items-center gap-2"><Shield className="text-primary"/> Phase 1 — Challenge (Step 1 of 2)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DetailedRule title="Profit Target" tag="8% of account" description="You must grow your account by 8% within the allotted time. For example, a ₹5 Lakh account requires ₹40,000 in net profit. This target must be reached without breaching any other rule simultaneously." />
                                <DetailedRule title="Maximum Daily Loss" tag="4% of account" description="Losses in a single trading day cannot exceed 4% of your starting account balance. Daily loss is calculated from the account balance at the start of that trading day. Breaching this on any single day results in immediate account failure." tagVariant="destructive" />
                                <DetailedRule title="Maximum Overall Drawdown" tag="8% of account" description="Your account equity must never fall more than 8% below the initial starting balance at any point during the evaluation. This is tracked in real-time across all open and closed positions." tagVariant="destructive" />
                                <DetailedRule title="Minimum Trading Days" tag="5 trading days" description="You must place at least one trade on a minimum of 5 separate trading days. Reaching the profit target on fewer days will not qualify you for Phase 2. This ensures the result reflects consistent skill, not a single lucky trade." tagVariant="secondary" />
                                <DetailedRule title="Time Limit" tag="30 calendar days" description="The Phase 1 window is 30 calendar days from the date of account activation. Weekends and public holidays are included in this count. No extensions will be granted. Unused days do not carry over." tagVariant="secondary" />
                                <DetailedRule title="Leverage" tag="Exchange limit only" description="Leverage is capped at the maximum permitted by NSE/BSE under SEBI regulations. No additional margin or leverage will be provided by FundedStock. For F&O, standard SPAN + Exposure margin rules apply as defined by the exchange." tagVariant="destructive" />
                                <DetailedRule title="Maximum Capital Per Trade" tag="80% of account" description="No single open trade or position may utilize more than 80% of your total account capital at any given moment. This applies to both equity and F&O positions. Deploying 100% of capital in one trade is a violation and will result in immediate account failure." tagVariant="destructive" />
                                <DetailedRule title="Allowed Instruments" tag="Stocks, Options, Futures" description="You may trade equity stocks, equity & index option buying, option selling (writing), and futures contracts listed on NSE/BSE. There are no lot size restrictions — trade any number of lots as long as other risk rules are not breached." />
                                <DetailedRule title="Overnight & Weekend Holding" tag="Not Allowed" description="All positions — equity and F&O — must be squared off before market close (3:30 PM IST) each day. Positions left open will be auto-closed by the system. This will be recorded as a rule violation regardless of profit or loss on that trade." tagVariant="destructive" />
                                <DetailedRule title="News Trading Restriction" tag="±5 min window banned" description="Trading is prohibited 5 minutes before and 5 minutes after any major scheduled event — including RBI policy announcements, SEBI circulars, Union Budget, and company earnings results. You will receive an SMS and email alert 30 minutes before each such event. Trades placed within this window will be voided." tagVariant="destructive" />
                                <DetailedRule title="Minimum Holding Time" tag="45 seconds per trade" description="Each trade must be held for a minimum of 45 seconds. High-frequency scalping strategies that open and close positions in seconds are a violation of this rule and will fail the evaluation." tagVariant="destructive" />
                            </CardContent>
                            <CardFooter><p className="text-sm font-semibold text-center w-full">Phase 1 Passed — Proceed to Phase 2 Verification</p></CardFooter>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><Check className="text-green-500"/> Phase 2 — Verification (Step 2 of 2)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DetailedRule title="Profit Target" tag="5% of account" description="Phase 2 requires a 5% net profit on your account balance. The lower target reflects that this phase is about verifying consistency, not just performance. All risk rules from Phase 1 remain active." />
                                <DetailedRule title="Maximum Daily Loss" tag="4% of account" description="The 4% daily loss rule remains unchanged in Phase 2. Consistent risk management across both phases is what separates funded traders from the rest." tagVariant="destructive" />
                                <DetailedRule title="Maximum Overall Drawdown" tag="8% of account" description="The overall drawdown limit remains 8% from the initial account balance. Your cumulative losses from day one of Phase 2 must not exceed this threshold at any point." tagVariant="destructive" />
                                <DetailedRule title="Minimum Trading Days" tag="8 trading days" description="You must trade on at least 8 separate days during Phase 2. This higher bar compared to Phase 1 confirms that your Phase 1 performance was not a one-time event. Consistent participation is mandatory." tagVariant="secondary" />
                                <DetailedRule title="Time Limit" tag="60 calendar days" description="You have 60 calendar days to complete Phase 2. The extended window accommodates the higher minimum trading day requirement, but consistent participation is still expected throughout." tagVariant="secondary" />
                                <DetailedRule title="Leverage" tag="Exchange limit only" description="Same as Phase 1 — leverage is strictly limited to what NSE/BSE permits under SEBI regulations. No enhancements or exceptions are made in Phase 2." tagVariant="destructive" />
                                <DetailedRule title="Maximum Capital Per Trade" tag="80% of account" description="The 80% single-trade capital limit applies in Phase 2 as well. Diversifying across multiple positions is strongly encouraged. Concentrated bets on a single instrument carry a higher risk of triggering both the daily loss and capital rules simultaneously." tagVariant="destructive" />
                                <DetailedRule title="Allowed Instruments" tag="Stocks, Options, Futures" description="All instruments permitted in Phase 1 remain available — equity stocks, index & stock options (both buying and writing), and futures. No lot size restrictions apply." />
                                <DetailedRule title="Overnight & Weekend Holding" tag="Not Allowed" description="All positions must be closed by 3:30 PM IST on every trading day. The auto-close system is active in Phase 2. Any position remaining open at market close will be forcibly squared off and flagged as a violation." tagVariant="destructive" />
                                <DetailedRule title="News Trading Restriction" tag="±5 min window banned" description="The news trading ban remains active. The 30-minute advance alert system will notify you 30 minutes before every restricted event window via SMS and email. Trades placed during restricted windows will be considered invalid." tagVariant="destructive" />
                                <DetailedRule title="Minimum Holding Time" tag="45 seconds per trade" description="Each trade must be held for a minimum of 45 seconds. High-frequency scalping strategies that open and close positions in seconds are a violation of this rule and will fail the evaluation." tagVariant="destructive" />
                            </CardContent>
                             <CardFooter><p className="text-sm font-semibold text-center w-full">Phase 2 Passed — Funded Account Activated</p></CardFooter>
                        </Card>
                        
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><IndianRupee className="text-primary"/> Funded Account — Live Trading Rules</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DetailedRule title="Profit Split" tag="80% Trader / 20% Firm" description="You keep 80% of all profits generated on your funded account. FundedStock retains 20% as its share. There are no caps on how much you can earn — the more you make, the more you take home." />
                                <DetailedRule title="Payout Cycle" tag="Every 14 days" description="Payouts are available every 14 days, provided you have traded on a minimum of 5 days within that cycle. Once your request is submitted, processing takes 3–5 business days. Minimum payout amount is ₹2,000." />
                                <DetailedRule title="Evaluation Fee Refund" tag="100% on 3rd Payout" description="Your full evaluation fee is refunded automatically upon your 3rd successful payout. Each of the three payouts must meet the minimum 5 trading day requirement and the ₹2,000 threshold. The refund is credited alongside your 3rd payout disbursement." />
                                <DetailedRule title="Stop Loss — Mandatory" tag="Required on every trade" description="Every position opened on a live funded account must have a stop loss placed at the time of entry. Trading without a stop loss is a direct violation. This rule does not apply during evaluation phases, but is strictly enforced once you go live." tagVariant="destructive" />
                                <DetailedRule title="Maximum Daily Loss (Funded)" tag="4% of account" description="The 4% daily loss rule carries into your funded account. A single bad day beyond this threshold will trigger an automatic account suspension pending review. Protecting capital is the first priority of any funded trader." tagVariant="destructive" />
                                <DetailedRule title="Maximum Overall Drawdown (Funded)" tag="6% — tighter than evaluation" description="The overall drawdown limit on live funded accounts is reduced to 6% — stricter than the 8% in evaluation. Breaching this results in immediate account termination with no reinstatement on the same account." tagVariant="destructive" />
                                <DetailedRule title="Maximum Capital Per Trade" tag="80% of account" description="No single open position may exceed 80% of total funded account capital. This rule is enforced in real-time. Positions exceeding this threshold will be flagged and may be force-closed by the risk management system." tagVariant="destructive" />
                                <DetailedRule title="Overnight & Weekend Holding" tag="Not Allowed" description="Intraday-only rule applies to the funded account as well. All positions must be closed by 3:30 PM IST. The auto-close system is active and will square off any open positions at market close." tagVariant="destructive" />
                                <DetailedRule title="News Trading Restriction" tag="±5 min window banned" description="News trading restrictions remain active on funded accounts. The 30-minute advance alert system continues to operate. Any trade executed within the restricted window on a live account will be reversed and may result in a formal warning." tagVariant="destructive" />
                                <DetailedRule title="Minimum Holding Time" tag="45 seconds per trade" description="The 45-second minimum holding time per trade rule carries over to the live funded account. Trades closed before this window are a compliance violation and may lead to profit reversal or account suspension." tagVariant="destructive" />
                            </CardContent>
                        </Card>
                        
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><FileText className="text-primary"/> Terms & Conditions — Section 7.3 (Important Clauses)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Third-Party Tools & Copy Trading:</strong> Use of automated trade copiers, signal services, or any third-party algorithmic execution tools is strictly prohibited. Detection will result in immediate account termination without refund of evaluation fees.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Inactive Account Policy:</strong> The evaluation timer runs continuously from activation regardless of trading activity. Periods of inactivity do not pause or extend the evaluation window. No extensions will be granted under any circumstances.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Minimum Payout Threshold:</strong> Payout requests below ₹2,000 in net profit will be automatically rejected. The request cycle resets only after a successful payout is processed. Rejected requests do not restart the 14-day cycle.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><HelpCircle className="text-primary"/> Frequently Asked Questions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    <FaqItem
                                        question="Can I trade both equity stocks and F&O in the same account?"
                                        answer="Yes. FundedStock accounts allow trading in equity stocks, index options, stock options, and futures — all within the same account. You may trade option buying and option selling freely. There are no lot size restrictions. The only constraints are the risk rules: daily loss limit, overall drawdown, and the 80% capital-per-trade cap."
                                    />
                                    <FaqItem
                                        question="How is the daily loss limit calculated exactly?"
                                        answer="Daily loss is calculated from your account balance at the start of that trading day — not from intraday peaks. For example, if your account opens a day at ₹5,00,000, you cannot lose more than ₹20,000 (4%) that day regardless of any profits made earlier in the session."
                                    />
                                    <FaqItem
                                        question="What happens if I breach a rule accidentally?"
                                        answer="Any hard limit breach results in immediate account failure. The system is automated — there are no manual overrides for evaluation accounts. For funded accounts, certain violations trigger a suspension and review. We recommend tracking your limits using the real-time dashboard available in your trader portal."
                                    />
                                    <FaqItem
                                        question="I hit the profit target in 2 days. Why didn't I pass Phase 1?"
                                        answer="Reaching the profit target is only one of several conditions required to pass. You must also have traded on a minimum of 5 separate trading days. If the target is hit before 5 trading days, the evaluation continues — you simply need to keep trading without breaching any limits until the minimum day count is met."
                                    />
                                    <FaqItem
                                        question="What is the news trading restriction and how will I know when it applies?"
                                        answer="Trading is prohibited 5 minutes before and 5 minutes after major scheduled events — such as RBI monetary policy decisions, Union Budget announcements, SEBI circulars, and quarterly earnings of index-heavy stocks. You will receive an automated SMS and email notification 30 minutes before each restricted window. A live calendar of upcoming restricted events is also available in your trader dashboard."
                                    />
                                    <FaqItem
                                        question="When exactly do I get my evaluation fee back?"
                                        answer="Your evaluation fee is fully refunded automatically with your 3rd successful payout. Each of the three payouts must meet both conditions: a minimum of 5 trading days in that cycle and a minimum profit of ₹2,000. Once your 3rd qualifying payout is processed, the refund is credited to your registered bank account within the same disbursement."
                                    />
                                    <FaqItem
                                        question="Is a stop loss mandatory during the evaluation phases too?"
                                        answer="No. The mandatory stop loss rule applies only to the live funded account. During Phase 1 and Phase 2, you are free to manage your trades without a hard stop loss. However, given the strict daily loss and overall drawdown limits in evaluation, using a stop loss is strongly recommended to protect your account."
                                    />
                                     <FaqItem
                                        question="Can I use algo trading or automated tools?"
                                        answer="No. Automated trade execution tools, trade copiers, signal bots, and third-party algorithmic systems are strictly prohibited. FundedStock evaluates individual trader skill. Use of any such tool — even for a single trade — will result in immediate account termination without refund."
                                    />
                                     <FaqItem
                                        question="What leverage will I get on stocks and F&O?"
                                        answer="Leverage is capped at whatever NSE/BSE permits under SEBI regulations — nothing more, nothing less. For equity intraday, this means standard MIS margins. For F&O, SPAN + Exposure margin requirements as set by the exchange apply. FundedStock does not offer any enhanced or additional leverage beyond what the exchange provides."
                                    />
                                     <FaqItem
                                        question="Does the overall drawdown reset after each phase?"
                                        answer="Yes. Each phase has its own separate drawdown calculation starting from that phase's initial account balance. Your Phase 1 drawdown does not carry over into Phase 2, and your evaluation drawdown does not carry over to the funded account. Each stage resets with a fresh balance."
                                    />
                                     <FaqItem
                                        question="What happens if I fail Phase 2 after passing Phase 1?"
                                        answer="If you fail Phase 2, your evaluation ends. You will need to purchase a new evaluation to start again. There is no direct reset or retry option for Phase 2 — a fresh evaluation purchase is required."
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
