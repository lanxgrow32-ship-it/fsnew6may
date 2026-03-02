
'use client';

import { useState, useEffect, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { updatePayoutDetails, requestPayout } from './actions';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Home, FileCheck, DollarSign, LogOut, BookUser, Gift, Loader2, Copy, Check, Users, Banknote, History, Wallet, MessageSquare, Percent, BrainCircuit, Search, Settings, Bell, Menu, User } from 'lucide-react';
import { signOut } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


type Profile = {
    referral_code: string;
    referral_balance: number;
    payout_upi_id: string | null;
    payout_qr_code_url: string | null;
    full_name: string;
    email: string;
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

// Copied from welcome page
const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg', className)}>
        {children}
    </div>
);

const Logo = () => (
    <div className="bg-slate-900 h-10 w-10 flex items-center justify-center rounded-lg text-2xl font-bold border border-white/10 shadow-inner shadow-black/50">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 7L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 7L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    </div>
);

function UserNav({ profile }: { profile: any}) {
    const router = useRouter();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={`https://avatar.vercel.sh/${profile?.email}.png`} alt={profile?.full_name || 'User'} />
                        <AvatarFallback>{profile?.full_name?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/kyc')}>
                        <FileCheck className="mr-2 h-4 w-4" />
                        <span>KYC</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/tickets')}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>Support</span>
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

const navItems = [
    { href: "/welcome", label: "Account Overview" },
    { href: "/guide", label: "Trading Guide" },
    { href: "/referrals", label: "Referrals" },
    { href: "/tickets", label: "Support" },
    { href: "/mentor", label: "AI Mentor" },
    { href: "/pricing", label: "Purchase New Plan" },
];

const DashboardHeader = ({profile, activePage}: {profile:any, activePage: string}) => (
  <header className="flex items-center justify-between mb-8 z-20 relative">
    <div className="flex items-center gap-8">
        <Logo />
        <nav className="hidden md:flex items-center gap-1 bg-black/20 backdrop-blur-sm border border-white/10 p-1 rounded-full shadow-lg">
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "px-4 py-1.5 text-sm transition-colors",
                        activePage === item.label
                        ? "font-medium bg-white/10 rounded-full text-white shadow-md"
                        : "text-gray-400 hover:text-white"
                    )}
                >
                    {item.label}
                </Link>
            ))}
      </nav>
    </div>
    <div className="flex items-center gap-2">
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
        <Search className="h-5 w-5 text-gray-300" />
      </button>
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
        <Settings className="h-5 w-5 text-gray-300" />
      </button>
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
        <Bell className="h-5 w-5 text-gray-300" />
      </button>
      <UserNav profile={profile} />
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 md:hidden transition-colors">
        <Menu className="h-5 w-5 text-gray-300" />
      </button>
    </div>
  </header>
);


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
            <Button type="submit" disabled={pending} className="bg-purple-600 text-white hover:bg-purple-700">
                {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Payout Details'}
            </Button>
        );
    }

    return (
        <GlassCard>
            <form action={formAction}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white"><Wallet className="w-5 h-5"/> Payout Settings</CardTitle>
                    <CardDescription className="text-gray-400">Enter your UPI details to receive referral commissions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="payout_upi_id" className="text-gray-300">Your UPI ID</Label>
                        <Input id="payout_upi_id" name="payout_upi_id" defaultValue={profile?.payout_upi_id || ''} required className="bg-black/20 border-white/10 text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="payout_qr_code" className="text-gray-300">Upload UPI QR Code (Optional)</Label>
                        <Input id="payout_qr_code" name="payout_qr_code" type="file" accept="image/*" onChange={handleFileChange} className="bg-black/20 border-white/10 text-white" />
                    </div>
                    {previewUrl && (
                        <div>
                            <Label className="text-gray-300">QR Code Preview</Label>
                            <div className="mt-2 rounded-md border border-white/10 p-2 bg-white w-fit">
                                <Image src={previewUrl} alt="QR Code Preview" width={100} height={100} />
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </form>
        </GlassCard>
    );
}

function ReferralDashboard({ profile, referrals, payoutRequests, commissionPercentage }: { profile: Profile | null, referrals: any[], payoutRequests: PayoutRequest[], commissionPercentage: number | null }) {
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
                <Button disabled={!profile || profile.referral_balance <= 0 || isRequesting} className="bg-purple-600 text-white hover:bg-purple-700 shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400/50">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <GlassCard className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white">Your Referral Code</CardTitle>
                        <CardDescription className="text-gray-400">Share this code with others. When they sign up, you earn!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-4">
                            <p className="text-2xl font-bold font-mono tracking-widest text-white">{profile?.referral_code || '...'}</p>
                            <Button size="icon" variant="ghost" onClick={copyToClipboard} className="text-gray-300 hover:text-white">
                                {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                            </Button>
                        </div>
                    </CardContent>
                </GlassCard>
                 <GlassCard>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white"><Percent className="w-5 h-5"/> Commission</CardTitle>
                        <CardDescription className="text-gray-400">Your earning rate.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-white">{commissionPercentage ?? '...'}<span className="text-2xl text-gray-400">%</span></p>
                    </CardContent>
                </GlassCard>
            </div>
             <GlassCard>
                <CardHeader>
                    <CardTitle className="text-white">Your Earnings</CardTitle>
                    <CardDescription className="text-gray-400">Your total available referral commission balance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-5xl font-bold text-white">₹{profile?.referral_balance.toFixed(2) ?? '0.00'}</p>
                    <PayoutAlert />
                </CardContent>
            </GlassCard>
            
            <PayoutDetailsForm profile={profile} />

            <GlassCard>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white"><Users className="w-5 h-5" /> Your Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10">
                                <TableHead className="text-gray-300">Date</TableHead>
                                <TableHead className="text-gray-300">New User</TableHead>
                                <TableHead className="text-right text-gray-300">Commission</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referrals.length > 0 ? referrals.map((ref, i) => (
                                <TableRow key={i} className="border-white/10">
                                    <TableCell className="text-gray-400">{new Date(ref.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-white">{ref.profiles.full_name}</TableCell>
                                    <TableCell className="text-right font-medium text-green-400">+ ₹{ref.commission_amount.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-gray-400">You have no referrals yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </GlassCard>

            <GlassCard>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white"><History className="w-5 h-5"/> Payout History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10">
                                <TableHead className="text-gray-300">Date</TableHead>
                                <TableHead className="text-gray-300">Amount</TableHead>
                                <TableHead className="text-right text-gray-300">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payoutRequests.length > 0 ? payoutRequests.map((req, i) => (
                                <TableRow key={i} className="border-white/10">
                                    <TableCell className="text-gray-400">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-white">₹{req.amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={req.status === 'completed' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}
                                           className={req.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-500/30' : req.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}
                                        >{req.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-gray-400">No payout requests found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </GlassCard>

        </div>
    );
}


export default function ReferralsPage() {
    const supabase = createClient();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
    const [commissionPercentage, setCommissionPercentage] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const [profileRes, referralsRes, payoutsRes, paymentDetailsRes] = await Promise.all([
                    supabase.from('profiles').select('referral_code, referral_balance, payout_upi_id, payout_qr_code_url, full_name, email').eq('id', user.id).single(),
                    supabase.from('referrals').select('*, profiles!referrals_referred_id_fkey(full_name)').eq('referrer_id', user.id).order('created_at', { ascending: false }),
                    supabase.from('payout_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
                    supabase.from('payment_details').select('referral_commission_percentage').eq('id', 1).single()
                ]);
                
                if (profileRes.data) setProfile(profileRes.data);
                if (referralsRes.data) setReferrals(referralsRes.data);
                if (payoutsRes.data) setPayoutRequests(payoutsRes.data);
                if (paymentDetailsRes.data) setCommissionPercentage(paymentDetailsRes.data.referral_commission_percentage);
            } else {
                router.push('/login');
            }
            setIsLoading(false);
        };

        fetchData();
    }, [supabase, router]);

    const PageSkeleton = () => (
         <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GlassCard><CardHeader><Skeleton className="h-6 w-3/4 bg-white/10" /></CardHeader><CardContent><Skeleton className="h-16 w-full bg-white/10" /></CardContent></GlassCard>
                <GlassCard><CardHeader><Skeleton className="h-6 w-1/2 bg-white/10" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2 bg-white/10" /><Skeleton className="h-10 w-32 mt-4 bg-white/10" /></CardContent></GlassCard>
            </div>
             <GlassCard>
                <CardHeader><Skeleton className="h-7 w-48 bg-white/10" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full bg-white/10" />
                    <Skeleton className="h-10 w-full bg-white/10" />
                </CardContent>
                <CardFooter><Skeleton className="h-10 w-32 bg-white/10" /></CardFooter>
            </GlassCard>
        </div>
    )

    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-25%] left-[10%] w-[50vw] h-[50vw] bg-purple-600 rounded-full filter blur-3xl opacity-20 " />
                <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-pink-600 rounded-full filter blur-3xl opacity-10" />
            </div>
          
            <main className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                 <DashboardHeader profile={profile} activePage="Referrals"/>
                <div className="max-w-4xl mx-auto">
                    {isLoading ? <PageSkeleton /> : <ReferralDashboard profile={profile} referrals={referrals} payoutRequests={payoutRequests} commissionPercentage={commissionPercentage} />}
                </div>
            </main>
        </div>
    );
}
