
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import { Home, FileCheck, User, DollarSign, LogOut, ExternalLink, BookUser, Gift, MessageSquare, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { Button } from '@/components/ui/button';

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
                            <SidebarMenuButton href="/kyc-status" tooltip="KYC Verification">
                                <FileCheck />
                                KYC Verification
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
                   <div className="max-w-3xl mx-auto space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl">How to Start Trading</CardTitle>
                                <CardDescription>Your step-by-step guide to logging in and using the trading software.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-base">
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Step 1: Launch the Trading Software</h3>
                                    <p className="text-muted-foreground">The first step is to open the trading platform. Click the button below to launch the software in a new tab.</p>
                                    <Button asChild>
                                        <Link href="https://nextrade.club/" target="_blank">
                                            Launch Falcon Trader
                                            <ExternalLink className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Step 2: Enter Your Credentials</h3>
                                    <p className="text-muted-foreground">Use the unique credentials provided to you on the dashboard to log in. Please store them securely.</p>
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
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Step 3: Select the Server</h3>
                                    <p className="text-muted-foreground">When prompted by the software, you must select the correct server to connect to your account. Your designated server is:</p>
                                    <div className="rounded-lg border bg-background p-4">
                                        <p className="text-sm font-medium text-muted-foreground">Server Name</p>
                                        <p className="text-xl font-bold">Falcon Trader</p>
                                    </div>
                                </div>
                                 <div className="space-y-2 pt-4">
                                    <h3 className="font-semibold text-lg">You're All Set!</h3>
                                    <p className="text-muted-foreground">Once you've completed these steps, you will be logged into your funded account and ready to trade. Happy trading!</p>
                                </div>
                            </CardContent>
                        </Card>
                   </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
