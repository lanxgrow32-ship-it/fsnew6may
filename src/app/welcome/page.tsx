
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import { Home, FileCheck, Landmark, User, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

async function KycPrompt() {
  return (
    <Card className="w-full max-w-lg mx-auto mt-8">
      <CardHeader>
        <CardTitle>Verification Required</CardTitle>
        <CardDescription>To proceed, you need to complete your KYC verification. This is a one-time process.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/kyc">Start KYC Verification</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function KycUnderReview() {
  return (
    <Card className="w-full max-w-lg mx-auto mt-8">
      <CardHeader>
        <CardTitle>KYC Submitted</CardTitle>
        <CardDescription>Your documents have been submitted and are currently under review. We'll notify you once the process is complete. This usually takes 1-2 business days.</CardDescription>
      </CardHeader>
      <CardContent>
         <div className="rounded-lg border border-yellow-400/50 bg-yellow-900/20 p-4 text-center">
            <p className="font-semibold text-yellow-300">Your trading credentials are pending KYC approval.</p>
            <p className="text-sm text-yellow-400/80">You will be able to access them here once your KYC is verified.</p>
          </div>
      </CardContent>
    </Card>
  )
}

function CredentialsView({ profile }: { profile: any }) {
   return (
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Your Trading Account</CardTitle>
              <CardDescription>Here are your trading account details.</CardDescription>
            </div>
             <Badge variant="default" className="bg-green-600">KYC Verified</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-muted-foreground">Plan Purchased</p>
            <p className="text-lg font-semibold">{profile.plan_purchased || 'Not specified'}</p>
          </div>
          {profile.credentials_provided ? (
            <>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground">Trading Username</p>
                <p className="text-lg font-semibold">{profile.trading_username}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground">Trading Password</p>
                <p className="text-lg font-semibold">{profile.trading_password}</p>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-yellow-400/50 bg-yellow-900/20 p-4 text-center">
              <p className="font-semibold text-yellow-300">Your trading credentials are being set up.</p>
              <p className="text-sm text-yellow-400/80">Your admin will provide them to you shortly.</p>
            </div>
          )}
        </CardContent>
      </Card>
  );
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
    return <div className="p-4">Could not load your profile. Please contact support.</div>;
  }
  
  if (!profile.is_approved) {
    return (
        <main className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Account Pending Approval</CardTitle>
                    <CardDescription>Your account registration has been received. You will be able to log in once an administrator has verified your payment and approved your account.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-center text-muted-foreground">Please check back later.</p>
                 </CardContent>
            </Card>
        </main>
    )
  }
  
  const renderContent = () => {
    // If KYC is verified, show credentials if they exist.
    if (profile.kyc_status === 'verified') {
      return <CredentialsView profile={profile} />
    }
    // If KYC is submitted but not yet verified
    if (profile.kyc_status === 'submitted') {
      return <KycUnderReview />
    }
    // If KYC is rejected or pending, show the prompt to start/retry KYC
     if (profile.kyc_status === 'rejected' || profile.kyc_status === 'pending') {
      return <KycPrompt />
    }
    // Default fallback
    return <p>Loading...</p>
  }


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
           <h2 className="text-xl font-bold">PropStar</h2>
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
              <SidebarMenuButton href="/pricing">
                <DollarSign />
                Purchase Account
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/welcome">
                <User />
                My Accounts
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
        <SidebarFooter>
            {/* Maybe a logout button here later */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
           <div>
            <h1 className="text-2xl font-bold">Welcome, {profile.full_name || 'User'}!</h1>
            <p className="text-muted-foreground">Here's an overview of your account.</p>
          </div>
          <SidebarTrigger className="md:hidden" />
        </header>
        <main className="p-4 md:p-6">
          {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
