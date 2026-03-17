
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { ArrowRight, Check, Target, Wallet, BarChart, Trophy, Ban, X, ShieldQuestion, BadgePercent, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const Feature = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="text-center">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 mb-4 text-primary">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);

const HowItWorksStep = ({ step, icon, title, description, subtext }: { step: string, icon: React.ReactNode, title: string, description: string, subtext: string }) => (
    <Card className="bg-card/50">
        <CardHeader>
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-primary">{step}</p>
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
            </div>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">{description}</p>
            <p className="text-xs font-semibold text-primary mt-2">{subtext}</p>
        </CardContent>
    </Card>
);

const PlanCard = ({ size, fee, activationFee, isPopular }: { size: string, fee: string, activationFee: string, isPopular?: boolean }) => (
    <Card className={cn("flex flex-col text-center border-2", isPopular ? "border-primary shadow-2xl shadow-primary/20" : "border-border")}>
        {isPopular && <div className="text-xs font-bold bg-primary text-primary-foreground py-1 rounded-t-lg -mt-px">🔥 Most Popular</div>}
        <CardHeader>
            <CardTitle className="text-4xl font-bold">₹{size}</CardTitle>
            <CardDescription>PassThenPay</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow space-y-6">
            <div className="space-y-4">
                <div className="border-t border-b border-border/50 py-3">
                    <p className="text-muted-foreground">Pay Now to Start</p>
                    <p className="text-3xl font-bold text-primary">₹{fee}</p>
                    <p className="text-xs text-muted-foreground">All you risk if you fail</p>
                </div>
                <div className="text-center">
                    <p className="text-muted-foreground">Pay After You Pass</p>
                    <p className="text-xl font-bold">₹{activationFee}</p>
                    <p className="text-xs text-green-500">✓ Charged only on passing</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-left">Profit target: <span className="font-bold">6%</span></p>
                <p className="text-left">Daily loss limit: <span className="font-bold">4%</span></p>
                <p className="text-left">Overall drawdown: <span className="font-bold">8%</span></p>
                <p className="text-left">Min. days: <span className="font-bold">5</span></p>
                <p className="text-left col-span-2">Reward share: <span className="font-bold">80%</span></p>
            </div>
            <Button asChild className="w-full mt-auto" size="lg">
                <Link href={`/signup?plan=${size} PassThenPay&price=${fee}`}>Start for ₹{fee} →</Link>
            </Button>
        </CardContent>
    </Card>
);

const FaqItem = ({ question, answer }: { question: string, answer: string }) => (
    <AccordionItem value={question} className="border-border/50">
        <AccordionTrigger className="text-left hover:no-underline">{question}</AccordionTrigger>
        <AccordionContent className="text-muted-foreground">{answer}</AccordionContent>
    </AccordionItem>
);

export default function PassThenPayPage() {
    const comparisonData = [
      {
        feature: 'What you pay to start',
        old: '₹5,999 – ₹49,999 upfront',
        new: 'Just ₹199 – ₹499',
      },
      {
        feature: 'If you fail on Day 1',
        old: 'Full fee gone. No refund.',
        new: 'Only ₹199–₹499 lost',
      },
      {
        feature: 'Number of evaluation phases',
        old: '2 phases — Phase 1 + Phase 2',
        new: 'Just 1 phase. Done.',
      },
      {
        feature: 'Profit target',
        old: '8%–10% across 2 phases',
        new: 'Only 6%. Just once.',
      },
      {
        feature: 'Time limit',
        old: '30–90 days deadline',
        new: 'No time limit',
      },
      {
        feature: 'When you pay full fee',
        old: 'Before you trade anything',
        new: 'Only after you pass',
      },
      {
        feature: 'Retry cost if you fail',
        old: 'Pay full fee again',
        new: 'Just ₹199 to try again',
      },
      {
        feature: 'Reward share',
        old: '70%–80%',
        new: '80% always',
      },
    ];

    return (
        <div className="dark">
            <main className="bg-background text-foreground min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 h-full w-full bg-transparent bg-[linear-gradient(to_right,hsl(var(--border)_/_0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)_/_0.1)_1px,transparent_1px)] bg-auto" style={{ backgroundSize: '32px 32px' }}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_0px,hsl(var(--primary)/0.15),transparent)]"></div>

                <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
                    <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
                        <Link href="/" className="flex items-center gap-2">
                            <FundedStockLogo className="h-8 w-auto text-primary" />
                            <span className="font-bold text-lg">FundedStock</span>
                        </Link>
                        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
                            <a href="#plans" className="hover:text-foreground">Plans</a>
                            <a href="#faq" className="hover:text-foreground">FAQ</a>
                        </nav>
                        <Button asChild>
                            <a href="#plans">Start Now <ArrowRight className="ml-2"/></a>
                        </Button>
                    </div>
                </header>

                <div className="relative isolate px-6 pt-14 lg:px-8">
                    <section className="container mx-auto max-w-4xl py-24 sm:py-32 text-center">
                        <Badge variant="outline" className="mb-4 border-primary/50 text-primary">🎯 India's simplest trading evaluation is here</Badge>
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl !leading-[1.15]">1 test. 6% target. <br /> Pay only after you pass.</h1>
                        <p className="mt-6 text-lg leading-8 text-muted-foreground">No more paying thousands before you even trade. Start for just ₹199. Complete 1 simple evaluation. Pay the full fee only after you pass.</p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button asChild size="lg"><a href="#plans">Start PassThenPay — From ₹199 <ArrowRight className="ml-2"/></a></Button>
                            <Button asChild variant="link"><a href="#how-it-works">See how it works ↓</a></Button>
                        </div>
                        <p className="mt-4 text-xs text-muted-foreground">No hidden charges. Full activation fee only charged after you pass. 100% simulated trading.</p>
                    </section>

                    <section id="how-it-works" className="py-24 sm:py-32">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">3 simple steps. That's it.</h2>
                            <p className="mt-4 text-lg text-muted-foreground">We made it as simple as possible. No confusing phases, no complicated rules.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <HowItWorksStep step="Step 01 of 03" icon={<Wallet />} title="Pay ₹199. Start Today." description="Pick your account size — ₹5L, ₹10L, ₹25L, or ₹50L. Pay just ₹199–₹499 as registration. Your evaluation account is activated instantly. No KYC needed to start trading." subtext="This is ALL you pay upfront" />
                            <HowItWorksStep step="Step 02 of 03" icon={<BarChart />} title="Trade. Hit 6%. Pass." description="Trade NSE & BSE stocks, options, and futures in our simulated environment. Reach just 6% profit while staying within the risk rules. No time limit — take as long as you need. Just 1 test. That's it." subtext="No time pressure. No second phase." />
                            <HowItWorksStep step="Step 03 of 03" icon={<Trophy />} title="Pass → Pay → Get Funded." description="You passed? Congratulations. Now pay the activation fee. Your funded account goes live. Start earning 80% Performance Rewards — paid every 14 days directly to your UPI or bank." subtext="Pay full fee ONLY after passing" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-8 mt-8">
                            <Card className="bg-destructive/10 border-destructive/20 text-center p-6">
                                <h3 className="font-bold text-destructive text-lg">If you FAIL</h3>
                                <p className="text-2xl font-bold text-foreground">You lose ₹199–₹499</p>
                                <p className="text-muted-foreground">That's it. Nothing more. Re-register anytime and try again.</p>
                            </Card>
                            <Card className="bg-green-500/10 border-green-500/20 text-center p-6">
                                <h3 className="font-bold text-green-400 text-lg">If you PASS</h3>
                                <p className="text-2xl font-bold text-foreground">Pay activation fee → Earn 80%</p>
                                <p className="text-muted-foreground">Pay the activation fee. Get funded. Keep 80% of all Performance Rewards.</p>
                            </Card>
                        </div>
                    </section>

                     <section className="py-24 sm:py-32">
                        <div className="text-center mb-16 max-w-3xl mx-auto">
                            <Badge variant="outline" className="mb-4 border-primary/50 text-primary">WHY PASSTHENPAY</Badge>
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Old way vs PassThenPay</h2>
                            <p className="mt-4 text-lg text-muted-foreground">See exactly what changes — and why it matters for you.</p>
                        </div>
                        <Card className="max-w-4xl mx-auto bg-card/50 overflow-hidden">
                            <div className="hidden md:grid grid-cols-[1.5fr,1fr,1fr] items-center gap-4 p-4 bg-muted/30">
                                <div></div>
                                <div className="font-bold text-destructive flex items-center gap-2">
                                    <X className="w-5 h-5" /> OLD MODEL
                                </div>
                                <div className="font-bold text-green-400 flex items-center gap-2">
                                    <Check className="w-5 h-5" /> PASSTHENPAY
                                </div>
                            </div>
                            <div className="divide-y divide-border/50">
                                {comparisonData.map((item, index) => (
                                     <div key={index} className="p-4">
                                        <p className="font-medium text-foreground mb-3 md:hidden">{item.feature}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-[1.5fr,1fr,1fr] md:items-center gap-4">
                                            <p className="font-medium text-foreground hidden md:block">{item.feature}</p>
                                            <div>
                                                <p className="md:hidden font-bold text-destructive flex items-center gap-2 text-sm mb-1"><X className="w-4 h-4"/> OLD MODEL</p>
                                                <div className="flex items-center gap-2 text-destructive">
                                                    <X className="w-4 h-4 shrink-0 hidden md:block" />
                                                    <span>{item.old}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="md:hidden font-bold text-green-400 flex items-center gap-2 text-sm mb-1"><Check className="w-4 h-4"/> PASSTHENPAY</p>
                                                <div className="flex items-center gap-2 font-semibold text-green-400">
                                                    <Check className="w-4 h-4 shrink-0 hidden md:block" />
                                                    <span>{item.new}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </section>

                    <section id="plans" className="py-24 sm:py-32">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Choose your account size</h2>
                            <p className="mt-4 text-lg text-muted-foreground">Same 1-phase evaluation. Same 6% target. Same rules. Just pick your size.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <PlanCard size="5 Lakh" fee="199" activationFee="7,999" />
                            <PlanCard size="10 Lakh" fee="299" activationFee="12,999" isPopular />
                            <PlanCard size="25 Lakh" fee="399" activationFee="24,999" />
                            <PlanCard size="50 Lakh" fee="499" activationFee="44,999" />
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-8">*Registration fee is non-refundable. Activation fee charged only after successful evaluation. All trading is 100% simulated. Performance Rewards are professional fees, not investment returns.</p>
                    </section>
                    
                     <section id="rules" className="py-24 sm:py-32 max-w-3xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Evaluation Rules</h2>
                            <p className="mt-4 text-lg text-muted-foreground">Simple rules. No confusion. Everything you need to know before you start.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card className="bg-card/50">
                                <CardHeader><CardTitle className="text-green-400">📈 What you need to achieve</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between"><span>Profit target</span><span className="font-bold">6% only</span></div>
                                    <div className="flex justify-between"><span>Min. trading days</span><span className="font-bold">5 days</span></div>
                                    <div className="flex justify-between"><span>Time limit</span><span className="font-bold">None</span></div>
                                    <div className="flex justify-between"><span>Number of phases</span><span className="font-bold">Just 1</span></div>
                                    <div className="flex justify-between"><span>Reward share</span><span className="font-bold">80% yours</span></div>
                                    <div className="flex justify-between"><span>Reward cycle</span><span className="font-bold">Every 14 days</span></div>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/50">
                                <CardHeader><CardTitle className="text-destructive">⚠️ Risk limits to stay within</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between"><span>Max daily loss</span><span className="font-bold">4% per day</span></div>
                                    <div className="flex justify-between"><span>Max overall drawdown</span><span className="font-bold">8% from start</span></div>
                                    <div className="flex justify-between"><span>Capital per trade</span><span className="font-bold">Max 80%</span></div>
                                    <div className="flex justify-between"><span>Overnight positions</span><span className="font-bold text-destructive">Not allowed</span></div>
                                    <div className="flex justify-between"><span>News trading ±5 min</span><span className="font-bold text-destructive">Banned</span></div>
                                    <div className="flex justify-between"><span>Copy / algo trading</span><span className="font-bold text-destructive">Strictly banned</span></div>
                                </CardContent>
                            </Card>
                        </div>
                         <p className="text-xs text-muted-foreground mt-4">📢 News Alert System: You will receive an SMS + email notification 30 minutes before every major market event. Trades placed ±5 minutes around these events will be automatically voided.</p>
                    </section>

                    <section id="faq" className="py-24 sm:py-32 max-w-3xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Still have questions?</h2>
                            <p className="mt-4 text-lg text-muted-foreground">Quick answers. No jargon.</p>
                        </div>
                        <Accordion type="single" collapsible className="w-full">
                            <FaqItem question="Agar main fail ho gaya toh kitna paisa jaayega?" answer="Sirf ₹199–₹499 — jo registration fee thi woh. Activation fee (₹7,999–₹44,999) sirf tab charge hoti hai jab tum pass karo. Fail hone pe koi badi loss nahi. Dobara try karna chahte ho? Phir se ₹199 do aur shuru karo."/>
                            <FaqItem question="Kitne dino mein 6% target hit karna hai?" answer="Koi time limit nahi hai. 2 hafte mein karo ya 3 mahine mein — aapki marzi. Bas ek cheez dhyan rakhna — 30 consecutive days tak koi trade nahi kiya toh account dormant ho jaata hai. Isliye regular trading karte raho."/>
                            <FaqItem question="Pass hone ke baad activation fee kab deni hai?" answer="Jab tum pass ho jaate ho — profit target 6%, minimum 5 trading days, aur sabhi rules follow kiye — system automatically notification bhejta hai. Tumhare paas 72 ghante hain activation fee pay karne ke liye. Payment ke baad funded account turant activate ho jaata hai."/>
                            <FaqItem question="Performance Rewards kaise aur kab milenge?" answer="Har 14 din mein payout request kar sakte ho — condition yeh hai ki us cycle mein minimum 5 din trade kiya ho aur minimum ₹2,000 ka reward accumulated ho. Payment directly UPI ya bank account mein 3–5 business days mein aa jaata hai. 3rd successful payout pe registration fee wapas mil jaati hai."/>
                            <FaqItem question="PassThenPay aur 2-Step evaluation mein kya fark hai?" answer="PassThenPay mein sirf 1 phase hai — 6% target, khatam. 2-Step mein 2 phases hain — Phase 1 mein 8% phir Phase 2 mein 5%. PassThenPay zyada simple aur beginner-friendly hai."/>
                            <FaqItem question="Kya yeh real market mein trading hai?" answer="Nahi. FundedStock par sari trading 100% simulated environment mein hoti hai. FundedStock SEBI-registered broker ya investment adviser nahi hai. Performance Rewards are professional fees hain — investment returns ya guaranteed income nahi. Aapka personal paisa kabhi market mein nahi jaata."/>
                        </Accordion>
                    </section>
                    
                    <section className="text-center py-24 sm:py-32">
                         <h2 className="text-3xl font-bold tracking-tight">1 test. 6% target. Pay after you pass.</h2>
                        <p className="mt-4 text-lg text-muted-foreground">India's simplest evaluation. Start for ₹199. Nothing to lose.</p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button asChild size="lg"><a href="#plans">Start PassThenPay — From ₹199 <ArrowRight className="ml-2"/></a></Button>
                            <Button asChild variant="link"><a href="#plans">See all plans ↗</a></Button>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
