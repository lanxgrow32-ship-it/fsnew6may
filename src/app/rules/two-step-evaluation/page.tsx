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
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Two-Step Evaluation Model (Summary)</CardTitle>
                                <CardDescription>Prove your consistency & discipline across two phases to get funded.</CardDescription>
                            </CardHeader>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Step 1 Rules</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <RuleItem title="Profit Target" value="8%" />
                                    <RuleItem title="Daily Trailing Drawdown" value="5%" />
                                    <RuleItem title="Overall Trailing Drawdown" value="10%" />
                                    <RuleItem title="Max Loss per Trade" value="2%" />
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
                                    <RuleItem title="Daily Trailing Drawdown" value="5%" />
                                    <RuleItem title="Overall Trailing Drawdown" value="10%" />
                                    <RuleItem title="Max Loss per Trade" value="2%" />
                                    <RuleItem title="Minimum Trading Days" value="8" />
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
                                <CardTitle className="text-xl flex items-center gap-2"><Shield className="text-primary"/> Phase 1 — Challenge (Step 1 of 2)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DetailedRule title="Profit Target" tag="8% of account" description="You must grow your account by 8% within the 30-day allotted time. For example, a ₹5 Lakh account requires ₹40,000 in net profit. This target must be reached without breaching any other rule." />
                                <DetailedRule title="Maximum Daily Loss" tag="5% of account" description="Losses in a single trading day cannot exceed 5% of your starting account balance. Daily loss is calculated from the balance at the start of that day. Breaching this on any day results in failure." tagVariant="destructive" />
                                <DetailedRule title="Maximum Overall Drawdown" tag="10% of account" description="Your account equity must never fall more than 10% below the initial starting balance at any point. This is tracked in real-time across all open and closed positions." tagVariant="destructive" />
                                <DetailedRule title="Maximum Loss Per Trade" tag="2% of capital" description="No single trade may result in a loss exceeding 2% of your total account capital. This ensures disciplined risk-taking throughout your evaluation." tagVariant="destructive" />
                                <DetailedRule title="Minimum Trading Days" tag="5 trading days" description="You must place at least one trade on a minimum of 5 separate trading days. This ensures your success reflects consistent skill, not a single lucky event." tagVariant="secondary" />
                                <DetailedRule title="Time Limit" tag="30 calendar days" description="The Phase 1 window is 30 calendar days from the date of activation. No extensions will be granted." tagVariant="secondary" />
                                <DetailedRule title="Leverage" tag="Exchange limit only" description="Leverage is strictly capped at the maximum permitted by NSE/BSE under SEBI regulations. Standard margin rules as defined by the exchange apply." tagVariant="destructive" />
                                <DetailedRule title="Maximum Capital Per Trade" tag="80% of account" description="No single open position may utilize more than 80% of your total account capital. Deploying 100% in one trade is an immediate violation." tagVariant="destructive" />
                                <DetailedRule title="Minimum Holding Time" tag="45 seconds per trade" description="Each trade must be held for a minimum of 45 seconds from entry to exit. High-frequency scalping strategies that open and close positions in seconds are a violation." tagVariant="destructive" />
                                <DetailedRule title="Overnight & Weekend Holding" tag="Not Allowed" description="All positions must be squared off before market close (3:30 PM IST) each day. Positions left open will be auto-closed and flagged as a violation." tagVariant="destructive" />
                                <DetailedRule title="News Trading Restriction" tag="±5 min window banned" description="Trading is prohibited 5 minutes before and 5 minutes after major scheduled events. You will receive an SMS/email alert 30 minutes before." tagVariant="destructive" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><Check className="text-green-500"/> Phase 2 — Verification (Step 2 of 2)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DetailedRule title="Profit Target" tag="5% of account" description="Phase 2 requires a 5% net profit. The lower target reflects that this phase is about verifying consistency. All risk rules from Phase 1 remain active." />
                                <DetailedRule title="Maximum Daily Loss" tag="5% of account" description="The 5% daily loss rule remains unchanged in Phase 2. Protecting capital is mandatory for progression." tagVariant="destructive" />
                                <DetailedRule title="Maximum Overall Drawdown" tag="10% of account" description="The overall drawdown limit remains 10% from the initial balance. Your cumulative losses must never exceed this threshold." tagVariant="destructive" />
                                <DetailedRule title="Minimum Trading Days" tag="8 trading days" description="You must trade on at least 8 separate days during Phase 2 to demonstrate consistent discipline." tagVariant="secondary" />
                                <DetailedRule title="Time Limit" tag="60 calendar days" description="You have 60 calendar days to complete Phase 2. This extended window accommodates the higher minimum trading day requirement." tagVariant="secondary" />
                                <DetailedRule title="Minimum Holding Time" tag="45 seconds per trade" description="Each trade must be held for a minimum of 45 seconds. Trades closed before this mark will result in account failure." tagVariant="destructive" />
                            </CardContent>
                             <CardFooter><p className="text-sm font-semibold text-center w-full">Phase 2 Passed — Funded Account Activated</p></CardFooter>
                        </Card>
                        
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><IndianRupee className="text-primary"/> Funded Account — Live Trading Rules</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DetailedRule title="Profit Split" tag="80% Trader / 20% Firm" description="You keep 80% of all profits generated. There are no caps on total earnings." />
                                <DetailedRule title="Payout Cycle" tag="Every 14 days" description="Payouts are available every 14 days, provided you have traded on a minimum of 5 days within that cycle. Minimum payout is ₹2,000." />
                                <DetailedRule title="Evaluation Fee Refund" tag="100% on 3rd Payout" description="Your full evaluation fee is refunded automatically upon your 3rd successful payout of ₹2,000+." />
                                <DetailedRule title="Stop Loss — Mandatory" tag="Required on every trade" description="Every position on the live account must have a stop loss set at entry. This is strictly enforced once you go live." tagVariant="destructive" />
                                <DetailedRule title="Max Daily Loss (Funded)" tag="5% of account" description="The 5% daily loss limit carries into your funded account. Breaching this triggers automatic suspension." tagVariant="destructive" />
                                <DetailedRule title="Max Overall Drawdown (Funded)" tag="10% of account" description="The overall drawdown limit is 10% from the starting balance. Breaching this results in immediate termination." tagVariant="destructive" />
                                <DetailedRule title="Minimum Holding Time" tag="45 seconds per trade" description="The 45-second minimum holding time rule carries over to the live funded account." tagVariant="destructive" />
                            </CardContent>
                        </Card>
                        
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><FileText className="text-primary"/> Important Terms</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Copy Trading:</strong> Use of trade copiers or third-party algorithmic execution tools is strictly prohibited and results in immediate termination.</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Dormancy:</strong> The evaluation timer runs continuously from activation. Periods of inactivity do not pause or extend the window.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><HelpCircle className="text-primary"/> Frequently Asked Questions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    <FaqItem
                                        question="How is the daily loss limit calculated?"
                                        answer="Daily loss is calculated from your account balance at the start of that trading day. If your account opens at ₹5,00,000, you cannot lose more than ₹25,000 (5%) that day."
                                    />
                                    <FaqItem
                                        question="What is the news trading restriction?"
                                        answer="Trading is prohibited ±5 minutes around major scheduled events. You will receive an automated alert 30 minutes before each window via SMS and email."
                                    />
                                    <FaqItem
                                        question="When do I get my fee back?"
                                        answer="Your full evaluation fee is refunded alongside your 3rd successful payout of at least ₹2,000."
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
