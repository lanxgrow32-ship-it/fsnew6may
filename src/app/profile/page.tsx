
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import { Home, FileCheck, User, DollarSign, LogOut, BookUser, Gift } from 'lucide-react';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default async function ProfilePage() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', session.user.id)
        .single();

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="border-b p-4 h-[57px] flex items-center">
                    <Link href="/welcome" className="flex items-center gap-2 font-bold text-lg">
                        <FundedStockLogo className="w-8 h-8 text-primary" />
                        <span className="text-foreground group-[[data-state=collapsed]]:hidden">FundedStock</span>
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
                            <SidebarMenuButton href="/guide" tooltip="Trading Guide">
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
                        <h1 className="text-xl font-semibold">Your Profile</h1>
                    </div>
                </header>
                <main className="p-4 md:p-6 bg-muted/40 min-h-[calc(100vh-57px)]">
                   <div className="max-w-2xl mx-auto space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl">Profile Information</CardTitle>
                                <CardDescription>This is your account information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={`https://avatar.vercel.sh/${profile?.email}.png`} alt={profile?.full_name || ''} />
                                        <AvatarFallback>{profile?.full_name?.[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-bold">{profile?.full_name}</h2>
                                        <p className="text-muted-foreground">{profile?.email}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input id="fullName" value={profile?.full_name || ''} readOnly />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" type="email" value={profile?.email || ''} readOnly />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                   </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
