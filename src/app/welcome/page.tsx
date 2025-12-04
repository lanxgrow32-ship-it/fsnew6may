
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import { Home, FileCheck, User, DollarSign, LogOut, Bell, Loader2, XCircle, CheckCircle, ExternalLink, Server as ServerIcon, Check, BookUser, Gift, MessageSquare, ShieldAlert, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CredentialsView } from './credentials-view';
import Image from 'next/image';
import { ReceiptButton } from './receipt-button';


function OnboardingGuide({ profile }: { profile: any }) {
  const getStepStatus = (step: number) => {
    // Step 1: Payment is always approved to see this page
    if (step === 1) return 'completed';
    
    // Step 2: KYC
    if (step === 2) {
        if (profile.kyc_status === 'pending' || profile.kyc_status === 'rejected') return 'active';
        if (profile.kyc_status === 'submitted' || profile.kyc_status === 'verified') return 'completed';
    }

    // Step 3: Credentials
    if (step === 3) {
        if (profile.kyc_status !== 'verified') return 'pending';
        if (profile.kyc_status === 'verified' && !profile.credentials_provided) return 'active';
        if (profile.credentials_provided) return 'completed';
    }

    return 'pending';
  }

  const steps = [
    { name: 'Payment Approved', status: getStepStatus(1) },
    { name: 'Complete KYC', status: getStepStatus(2) },
    { name: 'Receive Credentials', status: getStepStatus(3) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Onboarding Steps</CardTitle>
        <CardDescription>Follow these steps to get your trading account up and running.</CardDescription>
      </CardHeader>
      <CardContent>
          <ol className="relative space-y-4">
            {steps.map((step, index) => (
              <li key={step.name} className={`pl-8 relative ${index !== steps.length - 1 ? 'pb-4' : ''}`}>
                 {index !== steps.length - 1 && (
                     <div className={`absolute left-[11px] top-5 h-full w-0.5 ${step.status === 'completed' ? 'bg-primary' : 'bg-border'}`}></div>
                 )}
                <div className={`absolute left-0 flex h-6 w-6 items-center justify-center rounded-full ${step.status === 'completed' ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                  {step.status === 'completed' ? <Check className="h-4 w-4" /> : <span className="text-sm font-bold">{index + 1}</span>}
                </div>
                <h4 className={`font-medium ${step.status === 'active' ? 'text-primary' : ''}`}>{step.name}</h4>
                <p className="text-sm text-muted-foreground">
                    {step.status === 'completed' && 'Completed'}
                    {step.status === 'active' && 'Current Step'}
                    {step.status === 'pending' && 'Pending'}
                </p>
              </li>
            ))}
          </ol>
      </CardContent>
    </Card>
  );
}


function KycPrompt() {
  return (
      <Alert className="bg-blue-50 border-blue-200 text-blue-800">
        <FileCheck className="h-5 w-5 !text-blue-600" />
        <AlertTitle className="font-semibold">Complete Your Verification</AlertTitle>
        <AlertDescription className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          To start trading, you need to complete your KYC verification. This is the next step.
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            <Link href="/kyc-status">Start KYC Verification</Link>
          </Button>
        </AlertDescription>
      </Alert>
  )
}

function KycUnderReview() {
  return (
    <Alert className="border-yellow-300 bg-yellow-50 text-yellow-800">
      <Loader2 className="mx-auto h-5 w-5 text-yellow-500 animate-spin" />
      <AlertTitle>KYC Submitted & Under Review</AlertTitle>
      <AlertDescription>Your documents have been submitted and are currently being reviewed by our team. We'll notify you once the process is complete. This usually takes 1-2 business days.</AlertDescription>
    </Alert>
  )
}

function KycRejected() {
  return (
     <Alert variant="destructive">
        <XCircle className="h-5 w-5" />
        <AlertTitle className="font-semibold">KYC Verification Rejected</AlertTitle>
        <AlertDescription className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          Unfortunately, your KYC verification was not successful. Please check your status and resubmit.
          <Button asChild size="sm" variant="destructive" className="shrink-0">
            <Link href="/kyc-status">Check KYC Status</Link>
          </Button>
        </AlertDescription>
      </Alert>
  )
}

function AccountStatusBanner({ profile }: { profile: any }) {
    if (profile.credentials_provided) {
        return (
          <div className="p-6 rounded-lg bg-primary text-primary-foreground mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full">
                        <CheckCircle className="h-8 w-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Welcome back, {profile.full_name || 'User'}!</h2>
                        <p className="opacity-90">Your account is fully active. Here are your trading credentials.</p>
                    </div>
                </div>
                <ReceiptButton profile={profile} />
            </div>
          </div>
        );
    }
   
    return (
        <div className="p-6 rounded-lg bg-card border mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Welcome, {profile.full_name || 'User'}!</h2>
                    <p className="text-muted-foreground">Your account has been approved. Please complete the final steps to start trading.</p>
                </div>
                <ReceiptButton profile={profile} />
            </div>
        </div>
    );
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
                    <DropdownMenuItem asChild>
                         <Link href="/profile">
                            <User className="mr-2 h-4 w-4" />
                            <span>My Profile</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/guide">
                            <BookUser className="mr-2 h-4 w-4" />
                            <span>Trading Guide</span>
                        </Link>
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
                 <CardFooter className="flex justify-center">
                    <form action={signOut}>
                        <Button variant="outline">Log Out</Button>
                    </form>
                 </CardFooter>
            </Card>
        </main>
    )
  }

  if (profile.is_breached) {
    return (
        <main className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
            <Card className="w-full max-w-lg text-center border-destructive">
                <CardHeader>
                    <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit">
                        <ShieldAlert className="h-10 w-10 text-destructive" />
                    </div>
                    <CardTitle className="text-destructive">Account Breached</CardTitle>
                    <CardDescription>
                        Your account has been flagged for a breach of our trading rules. Access to your dashboard and trading credentials has been suspended.
                    </CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4">
                    {profile.breach_image_url && (
                         <div className="mt-2 flex flex-col items-center">
                            <p className="text-sm font-semibold text-destructive mb-2">Breach Evidence:</p>
                            <Image src={profile.breach_image_url} alt="Proof of account breach" width={400} height={300} className="rounded-md border" />
                        </div>
                    )}
                    {profile.breach_reason && (
                      <Alert variant="destructive" className="text-left">
                        <AlertTitle className="font-semibold">Reason:</AlertTitle>
                        <AlertDescription>{profile.breach_reason}</AlertDescription>
                      </Alert>
                    )}
                    <p className="text-muted-foreground pt-4">To continue trading, you may purchase a new account or contact support for assistance.</p>
                    <div className="flex flex-col items-center gap-4 pt-4">
                        <Button asChild className="w-full max-w-xs">
                            <Link href="/pricing">Purchase New Account</Link>
                        </Button>
                        <Button asChild variant="secondary" className="w-full max-w-xs">
                            <Link href="/tickets">Contact Support</Link>
                        </Button>
                         <form action={signOut} className="w-full max-w-xs">
                            <Button variant="outline" className="w-full">Log Out</Button>
                        </form>
                    </div>
                 </CardContent>
            </Card>
        </main>
    )
  }
  
  const renderContent = () => {
    switch (profile.kyc_status) {
      case 'verified':
        return <CredentialsView profile={profile} />;
      case 'submitted':
        return <KycUnderReview />;
      case 'rejected':
        return <KycRejected />;
      case 'pending':
      default:
        return <KycPrompt />;
    }
  }


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
              <SidebarMenuButton href="/welcome" isActive tooltip="Dashboard">
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
        <main className="p-4 md:p-6 bg-muted/40 min-h-[calc(100vh-57px)]">
          <div className="max-w-6xl mx-auto space-y-8">
            <AccountStatusBanner profile={profile} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {renderContent()}
                </div>
                <div className="lg:col-span-1">
                    <OnboardingGuide profile={profile} />
                </div>
            </div>
          </div>
        </main>      
      </SidebarInset>
    </SidebarProvider>
  );
}
