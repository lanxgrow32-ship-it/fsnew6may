
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import { Home, FileCheck, User, DollarSign, LogOut, CheckCircle, Loader2, XCircle, BookUser, Gift, MessageSquare, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function KycStatusCard({ title, status }: { title: string, status: 'pending' | 'submitted' | 'verified' | 'rejected' }) {
    const statusConfig = {
        pending: { text: 'Pending', icon: <Loader2 className="h-4 w-4 animate-spin text-gray-500" />, color: 'bg-gray-100 text-gray-800' },
        submitted: { text: 'Submitted for Review', icon: <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />, color: 'bg-yellow-100 text-yellow-800' },
        verified: { text: 'Verified', icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: 'bg-green-100 text-green-800' },
        rejected: { text: 'Rejected', icon: <XCircle className="h-4 w-4 text-red-500" />, color: 'bg-red-100 text-red-800' },
    };

    const currentStatus = statusConfig[status] || statusConfig.pending;

    return (
        <Card className="shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
                <p className="font-medium">{title}</p>
                <Badge className={`flex items-center gap-2 ${currentStatus.color}`}>
                    {currentStatus.icon}
                    <span>{currentStatus.text}</span>
                </Badge>
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
          To start trading, you need to complete your KYC verification. This is a one-time process.
          <Link href="/kyc" className="shrink-0">
             <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Start KYC</Badge>
          </Link>
        </AlertDescription>
      </Alert>
  )
}

function KycRejected() {
  return (
     <Alert variant="destructive">
        <XCircle className="h-5 w-5" />
        <AlertTitle className="font-semibold">KYC Verification Rejected</AlertTitle>
        <AlertDescription className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          Unfortunately, your KYC verification was not successful. Please resubmit your application with clear documents and correct information.
           <Link href="/kyc" className="shrink-0">
             <Badge variant="destructive">Resubmit KYC</Badge>
          </Link>
        </AlertDescription>
      </Alert>
  )
}

export default async function KycStatusPage() {
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
        return <div>Error loading profile.</div>;
    }

    const renderContent = () => {
        if (profile.kyc_status === 'pending') {
            return <KycPrompt />;
        }
        if (profile.kyc_status === 'rejected') {
            return <KycRejected />;
        }
        
        // For 'submitted' and 'verified'
        return (
             <div className="space-y-4">
                <KycStatusCard title="Aadhar Card Verification" status={profile.kyc_status} />
                <KycStatusCard title="PAN Card Verification" status={profile.kyc_status} />
                <KycStatusCard title="Selfie Verification" status={profile.kyc_status} />
            </div>
        )
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
                            <SidebarMenuButton href="/kyc-status" isActive tooltip="KYC Verification">
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
                        <h1 className="text-xl font-semibold">KYC Status</h1>
                    </div>
                </header>
                <main className="p-4 md:p-6 bg-muted/40 min-h-[calc(100vh-57px)]">
                   <div className="max-w-2xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Verification Status</CardTitle>
                                <CardDescription>Here is the current status of your submitted documents. Review usually takes 1-2 business days.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               {renderContent()}
                            </CardContent>
                        </Card>
                   </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
