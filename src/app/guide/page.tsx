
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import { Home, FileCheck, User, DollarSign, LogOut, ExternalLink, BookUser, Gift, MessageSquare, BrainCircuit, Percent, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const RuleCard = ({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) => (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
        <div className="text-primary">{icon}</div>
        <div>
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    </div>
);


export default async function GuidePage() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('trading_username, trading_password')
        .eq('id', session.user.id)
        .single();

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="border-b p-4 h-[57px] flex items-center">
                    <Link href="/welcome" className="flex items-center gap-2 font-bold text-lg">
                        <FundedStockLogo className="w-8 h-8 text-primary" />
                        <span className="text-foreground group-[[data-state=collapsed]]:hidden">FundedStock 2.0</span>
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/welcome" tooltip="Dashboard">
                                <Home />
                                Dashboard
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/pricing" tooltip="Purchase New Account">
                                <DollarSign />
                                Purchase New Account
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/kyc" tooltip="KYC">
                                <FileCheck />
                                KYC
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton href="/referrals" tooltip="Referrals">
                                <Gift />
                                Referrals
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton href="/tickets" tooltip="Support">
                                <MessageSquare />
                                Support
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/mentor" tooltip="AI Mentor">
                                <BrainCircuit />
                                AI Mentor
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/guide" isActive tooltip="Trading Guide">
                                <BookUser />
                                Trading Guide
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <form action={signOut} className="w-full">
                                <SidebarMenuButton tooltip="Logout" asChild>
                                    <button type="submit" className="w-full">
                                        <LogOut />
                                        Logout
                                    </button>
                                </SidebarMenuButton>
                            </form>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-xl font-semibold">Trading Guide</h1>
                    </div>
                </header>
                <main className="p-4 md:p-6 bg-muted/40 min-h-[calc(100vh-57px)]">
                   <div className="max-w-4xl mx-auto space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl">How to Start Trading on StockMint</CardTitle>
                                <CardDescription>Your step-by-step guide to logging in and using the trading platform.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-base">
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Step 1: Launch the Trading Platform</h3>
                                    <p className="text-muted-foreground">Click the button below to launch the StockMint platform in a new tab. Log in using your provided credentials.</p>
                                    <Button asChild>
                                        <Link href="https://stockmint.io/" target="_blank">
                                            Launch StockMint.io
                                            <ExternalLink className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Step 2: Enter Your Credentials</h3>
                                    <p className="text-muted-foreground">Use the unique credentials provided to you on the main dashboard to log in. Please store them securely.</p>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="rounded-lg border bg-background p-4">
                                            <p className="text-sm font-medium text-muted-foreground">Your Username</p>
                                            <p className="text-lg font-mono">{profile?.trading_username || 'Not Provided'}</p>
                                        </div>
                                        <div className="rounded-lg border bg-background p-4">
                                            <p className="text-sm font-medium text-muted-foreground">Your Password</p>
                                            <p className="text-lg font-mono">{profile?.trading_password || 'Not Provided'}</p>
                                        </div>
                                    </div>
                                </div>
                                 <div className="space-y-2 pt-4">
                                    <h3 className="font-semibold text-lg">Step 3: Monitor Your Performance</h3>
                                    <p className="text-muted-foreground">Once logged in, you can view your trading performance, available cash, opening balance, and drawdown limits directly in your profile section on the StockMint platform.</p>
                                 </div>
                            </CardContent>
                        </Card>

                        <Card>
                             <CardHeader>
                                <CardTitle className="text-2xl">Understanding Your Drawdown Rules</CardTitle>
                                <CardDescription>These rules are critical to managing your funded account. Violation of these limits will result in a breach of your account.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <RuleCard 
                                    icon={<TrendingDown className="h-8 w-8" />}
                                    title="10% Overall Trailing Drawdown"
                                    description="This is your total loss limit, calculated from the highest balance your account has ever reached (high-water mark). For example, if you start with ₹1,00,000 and your balance grows to ₹1,50,000, your new overall drawdown limit is 10% of that peak, which is ₹15,000. Your account will be breached if your equity drops to ₹1,35,000."
                                />
                                <RuleCard 
                                    icon={<TrendingDown className="h-8 w-8" />}
                                    title="5% Daily Loss Limit"
                                    description="You cannot lose more than 5% of your account's opening balance for the day. For a ₹1,00,000 account, this means your daily loss cannot exceed ₹5,000. This limit is calculated based on the balance at the start of each trading day."
                                />
                                <RuleCard 
                                    icon={<TrendingDown className="h-8 w-8" />}
                                    title="2% Per-Trade Loss Limit"
                                    description="The maximum you can lose on a single trade is 2% of your opening balance. On a ₹1,00,000 account, no single trade should result in a loss greater than ₹2,000."
                                />
                            </CardContent>
                        </Card>

                        <Card>
                             <CardHeader>
                                <CardTitle className="text-2xl">Platform Features</CardTitle>
                                <CardDescription>Key features of the StockMint platform.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Leverage</h3>
                                    <p className="text-muted-foreground">Leverage is provided as per Indian market norms. The specific leverage available may vary depending on the instrument being traded.</p>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Limit Orders</h3>
                                    <p className="text-muted-foreground">To account for price fluctuations and ensure execution, limit orders may be filled within a 1% range of your specified price. For example, a limit order placed at ₹100 may be executed anywhere between ₹99 and ₹101.</p>
                                </div>
                                 <Separator />
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Adding Funds</h3>
                                    <p className="text-muted-foreground">You can manage your account and add funds directly through the StockMint platform's interface.</p>
                                </div>
                            </CardContent>
                        </Card>
                   </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
