
'use client';

import { useState, useEffect, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { updatePayoutDetails, requestPayout } from './actions';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { FundedStockLogo } from '@/components/ui/logo';
import { Home, FileCheck, DollarSign, LogOut, BookUser, Gift, Loader2, Copy, Check, Users, Banknote, History, Wallet, MessageSquare } from 'lucide-react';
import { signOut } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type Profile = {
    referral_code: string;
    referral_balance: number;
    payout_upi_id: string | null;
    payout_qr_code_url: string | null;
};
type Referral = {
    created_at: string;
    commission_amount: number;
    referred_user_name: string; // We'll need to join to get this
};
type PayoutRequest = {
    created_at: string;
    amount: number;
    status: 'pending' | 'completed' | 'rejected';
};

function PayoutDetailsForm({ profile }: { profile: Profile | null }) {
    const ref = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [state, formAction] = useActionState(updatePayoutDetails, { error: null, success: null });
    const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.payout_qr_code_url || null);

    useEffect(() => {
        if (state.error) {
            toast({ title: 'Error', description: state.error, variant: 'destructive' });
        }
        if (state.success) {
            toast({ title: 'Success', description: state.success });
            ref.current?.reset();
        }
    }, [state, toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    }

    function SubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" disabled={pending}>
                {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Payout Details'}
            </Button>
        );
    }

    return (
        <Card>
            <form action={formAction}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5"/> Payout Settings</CardTitle>
                    <CardDescription>Enter your UPI details to receive referral commissions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="payout_upi_id">Your UPI ID</Label>
                        <Input id="payout_upi_id" name="payout_upi_id" defaultValue={profile?.payout_upi_id || ''} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="payout_qr_code">Upload UPI QR Code (Optional)</Label>
                        <Input id="payout_qr_code" name="payout_qr_code" type="file" accept="image/*" onChange={handleFileChange} />
                    </div>
                    {previewUrl && (
                        <div>
                            <Label>QR Code Preview</Label>
                            <div className="mt-2 rounded-md border p-2 bg-white w-fit">
                                <Image src={previewUrl} alt="QR Code Preview" width={100} height={100} />
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </form>
        </Card>
    );
}

function ReferralDashboard({ profile, referrals, payoutRequests }: { profile: Profile | null, referrals: any[], payoutRequests: PayoutRequest[] }) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    
    const copyToClipboard = () => {
        if (profile?.referral_code) {
            navigator.clipboard.writeText(profile.referral_code);
            setCopied(true);
            toast({ title: 'Copied to clipboard!' });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handlePayoutRequest = async () => {
        if (!profile || profile.referral_balance <= 0) return;
        
        setIsRequesting(true);
        const result = await requestPayout(profile.referral_balance);
        if (result.error) {
            toast({ title: 'Payout Request Failed', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Payout Request Submitted', description: 'Your request is now pending approval.' });
        }
        setIsRequesting(false);
    }
    
    const PayoutAlert = () => (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button disabled={!profile || profile.referral_balance <= 0 || isRequesting}>
                    {isRequesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote />}
                    Request Payout
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Payout Request</AlertDialogTitle>
                    <AlertDialogDescription>
                        You are about to request a payout for your entire available balance of <span className="font-bold">₹{profile?.referral_balance.toFixed(2)}</span>. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePayoutRequest}>Confirm Request</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Referral Code</CardTitle>
                        <CardDescription>Share this code with others. When they sign up, you earn!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between rounded-lg border bg-muted p-4">
                            <p className="text-2xl font-bold font-mono tracking-widest">{profile?.referral_code || '...'}</p>
                            <Button size="icon" variant="ghost" onClick={copyToClipboard}>
                                {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Your Earnings</CardTitle>
                        <CardDescription>Your total available referral commission balance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-4xl font-bold">₹{profile?.referral_balance.toFixed(2) ?? '0.00'}</p>
                        <PayoutAlert />
                    </CardContent>
                </Card>
            </div>
            
            <PayoutDetailsForm profile={profile} />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Your Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>New User</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referrals.length > 0 ? referrals.map((ref, i) => (
                                <TableRow key={i}>
                                    <TableCell>{new Date(ref.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>{ref.profiles.full_name}</TableCell>
                                    <TableCell className="text-right font-medium text-green-600">+ ₹{ref.commission_amount.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">You have no referrals yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="w-5 h-5"/> Payout History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payoutRequests.length > 0 ? payoutRequests.map((req, i) => (
                                <TableRow key={i}>
                                    <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>₹{req.amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={req.status === 'completed' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}
                                           className={req.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                                        >{req.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">No payout requests found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}


export default function ReferralsPage() {
    const supabase = createClient();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Fetch profile, referrals, and payouts in parallel
                const [profileRes, referralsRes, payoutsRes] = await Promise.all([
                    supabase.from('profiles').select('referral_code, referral_balance, payout_upi_id, payout_qr_code_url').eq('id', user.id).single(),
                    supabase.from('referrals').select('*, profiles!referrals_referred_id_fkey(full_name)').eq('referrer_id', user.id).order('created_at', { ascending: false }),
                    supabase.from('payout_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
                ]);
                
                if (profileRes.data) setProfile(profileRes.data);
                if (referralsRes.data) setReferrals(referralsRes.data);
                if (payoutsRes.data) setPayoutRequests(payoutsRes.data);
            }
            setIsLoading(false);
        };

        fetchData();
    }, []);

    const PageSkeleton = () => (
         <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2" /><Skeleton className="h-10 w-32 mt-4" /></CardContent></Card>
            </div>
             <Card>
                <CardHeader><Skeleton className="h-7 w-48" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
                <CardFooter><Skeleton className="h-10 w-32" /></CardFooter>
            </Card>
        </div>
    )

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
                            <SidebarMenuButton href="/referrals" isActive tooltip="Referrals">
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
                        <h1 className="text-xl font-semibold">Referral Dashboard</h1>
                    </div>
                </header>
                <main className="p-4 md:p-6 bg-muted/40 min-h-[calc(100vh-57px)]">
                    <div className="max-w-4xl mx-auto">
                        {isLoading ? <PageSkeleton /> : <ReferralDashboard profile={profile} referrals={referrals} payoutRequests={payoutRequests} />}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
