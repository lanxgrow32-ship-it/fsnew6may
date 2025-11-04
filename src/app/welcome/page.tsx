
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import { Home, FileCheck, User, DollarSign, LogOut, Bell, Loader2, XCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';

function KycPrompt() {
  return (
    <Card className="w-full max-w-lg mx-auto mt-8">
      <CardHeader className="text-center">
        <FileCheck className="mx-auto h-12 w-12 text-primary" />
        <CardTitle className="mt-4">Verification Required</CardTitle>
        <CardDescription>To proceed with your trading account, you need to complete your KYC verification. This is a one-time process.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full" size="lg">
          <Link href="/kyc">Start KYC Verification</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function KycUnderReview() {
  return (
    <Card className="w-full max-w-lg mx-auto mt-8">
      <CardHeader className="text-center">
        <Loader2 className="mx-auto h-12 w-12 text-yellow-500 animate-spin" />
        <CardTitle className="mt-4">KYC Submitted</CardTitle>
        <CardDescription>Your documents have been submitted and are currently under review. We'll notify you once the process is complete. This usually takes 1-2 business days.</CardDescription>
      </CardHeader>
      <CardContent>
         <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-center">
            <p className="font-semibold text-yellow-800">Your trading credentials are pending KYC approval.</p>
            <p className="text-sm text-yellow-600">You will be able to access them here once your KYC is verified.</p>
          </div>
      </CardContent>
    </Card>
  )
}

function CredentialsView({ profile }: { profile: any }) {
   return (
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-start">
            <div>
              <CardTitle>Your Trading Account</CardTitle>
              <CardDescription>Here are your trading account details.</CardDescription>
            </div>
             <Badge variant="default" className="mt-2 sm:mt-0 bg-green-100 text-green-800 border-green-300">KYC Verified</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium text-muted-foreground">Plan Purchased</p>
            <p className="text-lg font-semibold">{profile.plan_purchased || 'Not specified'}</p>
          </div>
          {profile.credentials_provided ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-sm font-medium text-muted-foreground">Trading Username</p>
                <p className="text-lg font-semibold">{profile.trading_username}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-sm font-medium text-muted-foreground">Trading Password</p>
                <p className="text-lg font-semibold">{profile.trading_password}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-center">
              <p className="font-semibold text-yellow-800">Your trading credentials are being set up.</p>
              <p className="text-sm text-yellow-600">An admin will provide them shortly.</p>
            </div>
          )}
        </CardContent>
      </Card>
  );
}

function KycRejected() {
  return (
    <Card className="w-full max-w-lg mx-auto mt-8">
      <CardHeader className="text-center">
        <XCircle className="mx-auto h-12 w-12 text-destructive" />
        <CardTitle className="mt-4 text-destructive">KYC Rejected</CardTitle>
        <CardDescription>
          Unfortunately, your KYC verification was not successful. This could be due to unclear documents or incorrect information. Please check for any comments from the admin and resubmit your application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full" size="lg">
          <Link href="/kyc">Resubmit KYC Application</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function AccountStatus({ profile }: { profile: any }) {
  if (profile.kyc_status === 'verified') {
    return (
      <div className="p-6 rounded-lg bg-primary text-primary-foreground">
        <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
                <CheckCircle className="h-8 w-8" />
            </div>
            <div>
                <h2 className="text-2xl font-bold">Welcome back, {profile.full_name || 'User'}!</h2>
                <p className="opacity-90">Here's your trading performance overview. Your account is fully active.</p>
            </div>
        </div>
      </div>
    );
  }
  return null;
}

function UserNav({ profile }: { profile: any}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://avatar.vercel.sh/${profile.email}.png`} alt={profile.full_name} />
                        <AvatarFallback>{profile.full_name?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                 <form action={signOut}>
                    <DropdownMenuItem asChild>
                         <button type="submit" className="w-full">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </button>
                    </DropdownMenuItem>
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default async function WelcomePage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    // This should not happen if the trigger is set up correctly
    return <div className="flex h-screen items-center justify-center">Could not load your profile. Please contact support.</div>;
  }
  
  if (!profile.is_approved) {
    return (
        <main className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <CardTitle>Account Pending Approval</CardTitle>
                    <CardDescription>Your account registration has been received. You will be able to log in once an administrator has verified your payment and approved your account.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-muted-foreground">Please check back later.</p>
                 </CardContent>
            </Card>
        </main>
    )
  }
  
  const renderContent = () => {
    if (profile.kyc_status === 'verified') {
      return <CredentialsView profile={profile} />
    }
    if (profile.kyc_status === 'submitted') {
      return <KycUnderReview />
    }
    if (profile.kyc_status === 'rejected') {
        return <KycRejected />
    }
    // Default to pending if not submitted or rejected.
    return <KycPrompt />
  }


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b p-2">
           <div className="h-12 flex items-center justify-center">
                <Link href="/welcome" className="flex items-center gap-2 font-bold text-lg">
                    <FundedStockLogo className="w-8 h-8 text-primary" />
                    <span className="text-foreground group-[[data-state=collapsed]]:hidden">FundedStock 2.0</span>
                </Link>
           </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="/welcome" isActive>
                <Home />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton href="/my-accounts">
                <User />
                My Accounts
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/pricing">
                <DollarSign />
                Purchase New Account
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton href="/kyc">
                <FileCheck />
                KYC Verification
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t p-2">
            <SidebarMenu>
                <SidebarMenuItem>
                    <form action={signOut} className="w-full">
                        <SidebarMenuButton asChild>
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
                <h1 className="text-xl font-semibold hidden md:block">Dashboard</h1>
           </div>
           <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>
                <UserNav profile={profile} />
           </div>
        </header>
        <main className="p-4 md:p-6 bg-muted/40 min-h-[calc(100vh-3.5rem)]">
          <AccountStatus profile={profile} />
          {renderContent()}
        </main>      
      </SidebarInset>
    </SidebarProvider>
  );
}
