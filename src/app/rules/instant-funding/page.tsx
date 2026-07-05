import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Check, IndianRupee, Shield, Globe, Ban, FileText, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { createClient } from '@/lib/supabase/server';

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

const StatItem = ({ title, value, subtext }: { title: string, value: string, subtext: string }) => (
    <div className="bg-muted/50 p-3 rounded-lg text-center">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
);

export default async function InstantFundingRulesPage() {
    return (
        <div className="dark-theme">
            <div className="bg-background min-h-screen text-foreground pb-20">
                <main className="container mx-auto p-4 md:p-8 pt-12">
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
                                <RestrictionItem><strong>Minimum Holding Time:</strong> 45 seconds per trade. Trades closed before 45 seconds will be considered a breach.</RestrictionItem>
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

                        <Separator className="my-12" />

                        <div className="text-center pt-8">
                            <h2 className="text-3xl font-bold tracking-tight">FundedStock — Instant Funding</h2>
                            <p className="text-muted-foreground mt-2">Indian Markets (NSE/BSE) · No Evaluation · Start Trading in 15 Minutes</p>
                        </div>
                        
                        <Card className="text-center">
                            <CardHeader>
                                <CardTitle>No Challenge Required — Instant Account Activation</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
                                <div className="bg-muted/50 p-3 rounded-lg"><p className="font-bold">₹1 Lakh</p><p className="text-muted-foreground">Fee: ₹5,999</p></div>
                                <div className="bg-muted/50 p-3 rounded-lg"><p className="font-bold">₹2 Lakh</p><p className="text-muted-foreground">Fee: ₹10,999</p></div>
                                <div className="bg-muted/50 p-3 rounded-lg"><p className="font-bold">₹5 Lakh</p><p className="text-muted-foreground">Fee: ₹22,999</p></div>
                                <div className="bg-muted/50 p-3 rounded-lg"><p className="font-bold">₹10 Lakh</p><p className="text-muted-foreground">Fee: ₹38,999</p></div>
                                <div className="bg-muted/50 p-3 rounded-lg"><p className="font-bold">₹25 Lakh</p><p className="text-muted-foreground">Fee: ₹54,999</p></div>
                            </CardContent>
                        </Card>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <StatItem title="Overall Drawdown" value="10%" subtext="trailing balance" />
                            <StatItem title="Daily Drawdown" value="5%" subtext="trailing per day" />
                            <StatItem title="Max Loss/Trade" value="2%" subtext="per position" />
                            <StatItem title="Open Positions" value="3" subtext="max at one time" />
                            <StatItem title="Profit Split" value="80%" subtext="yours to keep" />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><Shield className="text-primary"/> Risk Rules — Live from Day One</CardTitle>
                                <CardDescription>Instant Account</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DetailedRule title="Overall Trailing Drawdown" tag="10% of account balance" description="Your account uses a trailing drawdown model — not a fixed floor. The overall drawdown limit trails your highest achieved balance. For example, if your ₹5 Lakh account grows to ₹5.5 Lakh, the new drawdown floor moves to ₹4,95,000 (10% below the peak). As your balance grows, so does the floor — making it progressively harder to absorb losses." tagVariant="destructive" />
                                <DetailedRule title="Daily Trailing Drawdown" tag="5% of account balance" description="Each trading day, you cannot lose more than 5% of your account balance — calculated from the opening balance of that day. On a ₹10 Lakh account, that is ₹50,000 per day. This limit also trails: if your balance increases, the absolute rupee amount you can lose each day increases proportionally." tagVariant="destructive" />
                                <DetailedRule title="Maximum Loss Per Trade" tag="2% of capital" description="No single trade may result in a loss exceeding 2% of your total account capital. This is enforced per position. Positions that move against you beyond this threshold will be flagged. Repeated breaches will trigger a compliance review and potential account suspension." tagVariant="destructive" />
                                <DetailedRule title="Maximum Capital Per Trade" tag="80% of account" description="No single open position may use more than 80% of your total account capital at any moment. This applies across all instruments — equity, futures, and options. Concentrating all capital in a single trade is a violation regardless of the outcome." tagVariant="destructive" />
                                <DetailedRule title="Maximum Open Positions" tag="3 positions at a time" description="You may hold a maximum of 3 open positions simultaneously across all instruments and segments. This includes both intraday and overnight positions. Opening a 4th position while 3 are active is a direct violation and will result in the 4th order being rejected or force-closed by the system." tagVariant="destructive" />
                                <DetailedRule title="Stop Loss — Mandatory" tag="Required on every trade" description="Every position must have a stop loss placed at the time of entry. This is non-negotiable on an instant funded account — you are trading live capital from day one. Positions entered without a stop loss will be flagged immediately and may be force-closed by the risk management system." tagVariant="destructive" />
                                <DetailedRule title="Leverage" tag="Exchange limit only" description="Leverage is strictly capped at the maximum permitted by NSE/BSE under SEBI regulations. No additional margin or enhanced leverage is provided by FundedStock. For F&O, standard SPAN + Exposure margin as defined by the exchange applies." tagVariant="destructive" />
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">Trading Restrictions</CardTitle>
                                <CardDescription>Strictly Enforced</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DetailedRule title="News Trading" tag="Prohibited during events" description="Trading is not permitted during major high-impact market events — including RBI policy decisions, Union Budget, SEBI announcements, and significant earnings releases. You will receive an automated SMS and email alert 30 minutes before each restricted window. Any trade placed during a restricted window will be voided and may trigger a compliance flag." tagVariant="destructive" />
                                <DetailedRule title="Hedging" tag="Not Allowed" description="Holding simultaneous opposing positions on the same instrument — whether across accounts or within the same account — is strictly prohibited. Hedging strategies designed to lock in profits or neutralise losses artificially are considered a violation. Detection will result in immediate account termination without payout." tagVariant="destructive" />
                                <DetailedRule title="Copy Trading & Automation" tag="Not Allowed" description="Use of trade copiers, signal bots, algorithmic execution tools, or any third-party automated trading systems is strictly prohibited. All trades must be placed manually by the registered account holder. Detection of any automated activity will result in immediate account termination without refund." tagVariant="destructive" />
                                <DetailedRule title="Minimum Holding Time" tag="45 seconds per trade" description="Each trade must be held for a minimum of 45 seconds from entry to exit. High-frequency scalping strategies that open and close positions in seconds are a violation of this rule. The system will automatically flag any trade closed before the 45-second mark." tagVariant="destructive" />
                                <DetailedRule title="Allowed Instruments" tag="NSE/BSE — F&O, Equity, Indices" description="You may trade equity stocks, index and stock options (buying and writing), futures, and indices including NIFTY, BANKNIFTY, and FINNIFTY on NSE/BSE. There are no lot size restrictions. All trades must fall within the 3 open position and 80% capital limits at all times." />
                                <DetailedRule title="Firm Decisions" tag="Final & binding" description="All decisions made by FundedStock regarding rule violations, payout rejections, account suspensions, and compliance reviews are final. No appeals process is available for accounts terminated due to rule breaches. By activating an instant funded account, you agree to this policy in full." tagVariant="secondary" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><IndianRupee className="text-primary"/> Payout Rules</CardTitle>
                                <CardDescription>Live Capital</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DetailedRule title="Profit Split" tag="80% Trader / 20% Firm" description="You retain 80% of all profits generated on your instant funded account. FundedStock receives 20%. There is no cap on total earnings — consistent, compliant trading is rewarded in full." />
                                <DetailedRule title="First Payout Eligibility" tag="4 profitable trading days" description="Before your first payout can be requested, you must have completed a minimum of 4 profitable trading days. A profitable day is defined as a day where your net closed P&L is positive after all charges. Breakeven or loss days do not count toward this requirement." tagVariant="secondary" />
                                <DetailedRule title="Payout Cycle" tag="Every 14 days" description="After the first payout, subsequent payouts are available every 14 days. Each payout request is subject to a performance review to confirm full compliance with all trading rules during that period. Processing takes 3–5 business days from approval. Minimum payout amount is ₹2,000." />
                                <DetailedRule title="Payout Rejection & Suspension" tag="On rule non-compliance" description="Any payout request may be rejected if a compliance review identifies rule violations during the payout period — including breaches of drawdown limits, position rules, or trading restrictions. Repeated violations may result in full account suspension. Suspended accounts are not eligible for payout or reinstatement." tagVariant="destructive" />
                                <DetailedRule title="Evaluation Fee Refund" tag="Not applicable" description="The Instant Funding plan does not include an evaluation fee refund since there is no evaluation phase. The one-time fee paid at account activation is a platform access and risk allocation fee and is non-refundable under all circumstances." tagVariant="secondary" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><FileText className="text-primary"/> Terms & Conditions — Section 9.1 (Important Clauses)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Trailing Drawdown Floor Mechanics:</strong> The trailing drawdown floor moves up with every new profit peak but never moves down. Once your peak balance is locked in, losses reduce your equity toward the floor — not toward the original starting balance. This means a trader who grows the account significantly faces a tighter absolute loss tolerance than one who stays flat.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Performance Review Discretion:</strong> FundedStock reserves the right to conduct a full trade-by-trade review before processing any payout. If trading patterns are deemed inconsistent, exploitative, or in violation of the spirit of the rules — even if individual rule thresholds were not technically breached — the payout may be withheld pending investigation.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Inactive Account Policy:</strong> Instant funded accounts showing zero trading activity for 30 consecutive calendar days will be placed under dormancy review. Accounts inactive for 60 days may be suspended without payout of any accumulated profit. Reactivation requires written confirmation and is subject to firm approval.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Minimum Payout Threshold:</strong> Payout requests below ₹2,000 in net profit will be automatically rejected. The 14-day cycle resets only after a successful payout is processed. Rejected payout requests do not restart the cycle.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Instant Funding vs Evaluation Plans:</strong> Instant Funding gives you live capital immediately — no challenge, no waiting. However, the trailing drawdown model is significantly more punishing than the fixed drawdown in the 1-Step and 2-Step plans. As your profits grow, your drawdown floor rises with them, leaving less room for losing streaks. It is best suited for traders with a tested, low-drawdown strategy who can generate consistent profits without large swings.</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><HelpCircle className="text-primary"/> Frequently Asked Questions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    <FaqItem
                                        question="How is the trailing drawdown different from a fixed drawdown?"
                                        answer="A fixed drawdown is calculated from a single starting point and never moves. A trailing drawdown follows your highest balance upward. For example, if you start at ₹5 Lakh and grow to ₹6 Lakh, your new drawdown floor is ₹5,40,000 (10% below ₹6 Lakh). You can never go back to the original ₹4,50,000 floor — the floor locks in as you profit, and your loss buffer stays fixed at 10% of your peak, not your starting balance."
                                    />
                                    <FaqItem
                                        question="Can I start trading immediately after paying the fee?"
                                        answer="Yes. Once your payment is confirmed and your account is activated — typically within 15 minutes — you can begin trading. There is no evaluation phase, no challenge to pass, and no waiting period. Your funded account is live from the moment of activation."
                                    />
                                    <FaqItem
                                        question="What counts as a 'profitable trading day' for the first payout?"
                                        answer="A profitable trading day is any day on which your net closed P&L — after brokerage, taxes, and all charges — is positive. Days where you break even or end in a loss do not count. Open positions do not count toward this requirement; only fully closed trades are considered. You need 4 such days before your first payout request can be submitted."
                                    />
                                    <FaqItem
                                        question="Why is the one-time fee non-refundable?"
                                        answer="The fee on the Instant Funding plan covers the cost of immediate capital allocation, platform access, and real-time risk monitoring — all of which are active from day one. Unlike the evaluation plans where the fee is refundable on the 3rd payout, the Instant plan provides live capital upfront without any performance gate, making the fee a platform access cost rather than an evaluation deposit."
                                    />
                                    <FaqItem
                                        question="What happens if my payout request is rejected after a compliance review?"
                                        answer="If a payout is rejected due to a compliance issue, you will receive a notification specifying the nature of the violation. Minor violations may result in a hold — the account remains active but the payout is deferred until the issue is resolved. Serious or repeated violations may result in full account suspension, in which case no payout will be processed and the account cannot be reinstated."
                                    />
                                    <FaqItem
                                        question="Can I hold positions overnight on an instant funded account?"
                                        answer="Yes, overnight holding is permitted on the Instant Funding plan. However, any gap loss incurred when the market reopens will count toward that day's 5% daily drawdown limit. If an overnight gap causes the daily loss to exceed 5% or the overall trailing drawdown to breach 10%, the account will be immediately suspended. Risk every overnight position accordingly."
                                    />
                                    <FaqItem
                                        question="I am already trading a 1-Step or 2-Step account. Can I also open an Instant Funded account?"
                                        answer="Yes. Evaluation accounts and Instant Funded accounts are independent of each other. You may hold both simultaneously. However, each account is governed by its own rules — the trading restrictions and drawdown limits are applied per account and are not combined or averaged across accounts."
                                    />
                                    <FaqItem
                                        question="Is there a scaling plan — can my account size increase over time?"
                                        answer="The Instant Funding plan does not include an automatic scaling plan. Your account size remains fixed at the plan you purchased. If you wish to trade a larger account, you may purchase a new Instant Funding account at a higher size. Future scaling options may be introduced — check the FundedStock website for the latest updates."
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
