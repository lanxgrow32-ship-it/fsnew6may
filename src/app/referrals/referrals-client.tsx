'use client';

import { useState, useEffect, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Home, 
    FileCheck, 
    DollarSign, 
    LogOut, 
    Gift, 
    Loader2, 
    Copy, 
    Check, 
    Users, 
    Banknote, 
    History, 
    Wallet, 
    MessageSquare, 
    Percent, 
    Link as LinkIcon, 
    Share2, 
    Menu, 
    User,
    UserPlus,
    Calendar,
    LayoutDashboard,
    ShoppingCart,
    Trophy
} from 'lucide-react';
import { signOut } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { updatePayoutDetails, requestPayout } from './actions';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

const Logo = () => (
    <div className="flex items-center gap-2">
        <div className="bg-primary h-7 w-7 flex items-center justify-center rounded-lg shadow-lg shadow-primary/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
        <span className="font-poppins font-bold text-base tracking-tight text-white hidden lg:block">FundedStock</span>
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
    { id: 'hub', href: "/welcome", label: "Portfolio", icon: LayoutDashboard },
    { id: 'marketplace', href: "/welcome?tab=marketplace", label: "Get Funded", icon: ShoppingCart },
    { id: 'competition', href: "/welcome?tab=competition", label: "Competition", icon: Trophy },
    { id: 'wallet', href: "/welcome?tab=wallet", label: "Wallet", icon: Wallet },
    { id: 'referrals', href: "/referrals", label: "Referrals", icon: Users, active: true },
    { id: 'transactions', href: "/welcome?tab=transactions", label: "History", icon: History },
    { id: 'support', href: "/live-chat", label: "Live Chat", icon: MessageSquare },
];

const DashboardHeader = ({profile, activePage}: {profile:any, activePage: string}) => (
  <header className="flex items-center justify-between mb-8 z-20 relative border-b border-white/5 pb-6">
    <div className="flex items-center gap-6">
        <Logo />
        <nav className="hidden lg:flex items-center gap-0.5 bg-black/40 backdrop-blur-md border border-white/10 p-1 rounded-full shadow-2xl h-[40px]">
            {navItems.map((item) => (
                <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                        "px-4 py-1.5 text-[11px] font-bold transition-all rounded-full h-[32px] whitespace-nowrap shrink-0 flex items-center gap-2",
                        activePage === item.label
                        ? "bg-white/10 text-white border border-white/10 shadow-sm"
                        : "text-gray-400 hover:text-white"
                    )}
                >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                </Link>
            ))}
      </nav>
    </div>
    <div className="flex items-center gap-2">
      <UserNav profile={profile} />
    </div>
  </header>
);

export function ReferralsClient({ 
    initialProfile, 
    initialReferrals, 
    initialPayoutRequests, 
    initialNetwork,
    commissionPercentage 
}: { 
    initialProfile: any, 
    initialReferrals: any[], 
    initialPayoutRequests: any[], 
    initialNetwork: any[],
    commissionPercentage: number 
}) {
    const { toast } = useToast();
    const [profile] = useState(initialProfile);
    const [referrals] = useState(initialReferrals);
    const [network] = useState(initialNetwork);
    const [payoutRequests] = useState(initialPayoutRequests);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    
    const referralLink = typeof window !== 'undefined' 
        ? `${window.location.origin}/signup?ref=${profile?.referral_code}`
        : '';

    const copyCode = () => {
        if (profile?.referral_code) {
            navigator.clipboard.writeText(profile.referral_code);
            setCopiedCode(true);
            toast({ title: 'Code copied!' });
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    const copyLink = () => {
        if (referralLink) {
            navigator.clipboard.writeText(referralLink);
            setCopiedLink(true);
            toast({ title: 'Invite link copied!' });
            setTimeout(() => setCopiedLink(false), 2000);
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
    
    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-25%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full filter blur-3xl opacity-20 " />
                <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-purple-600 rounded-full filter blur-3xl opacity-10" />
            </div>
          
            <main className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                 <DashboardHeader profile={profile} activePage="Referrals"/>
                <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <GlassCard className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2"><Share2 className="h-5 w-5 text-primary"/> Share & Earn</CardTitle>
                                <CardDescription className="text-gray-400">Traders who join via your link are instantly locked to your account.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Professional Invite Link</Label>
                                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-1.5">
                                        <p className="flex-1 text-xs font-medium text-gray-400 truncate px-3">{referralLink}</p>
                                        <Button size="sm" onClick={copyLink} className="h-9 px-4 bg-primary text-white rounded-lg">
                                            {copiedLink ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Referral Code</p>
                                        <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2 border border-white/5">
                                            <span className="font-mono font-bold text-white tracking-widest">{profile?.referral_code}</span>
                                            <button onClick={copyCode} className="text-gray-500 hover:text-white transition-colors">{copiedCode ? <Check className="h-4 w-4 text-green-400"/> : <Copy className="h-4 w-4"/>}</button>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Commission Tier</p>
                                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-4 py-2 border border-white/5">
                                            <Percent className="h-4 w-4 text-primary" />
                                            <span className="font-bold text-white">{commissionPercentage}% Commission</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </GlassCard>

                         <GlassCard className="flex flex-col justify-between">
                            <CardHeader>
                                <CardTitle className="text-white">Earnings</CardTitle>
                                <CardDescription className="text-gray-400">Available to withdraw.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-black text-white">₹{profile?.referral_balance.toFixed(2) ?? '0.00'}</p>
                            </CardContent>
                            <CardFooter>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button disabled={!profile || profile.referral_balance <= 0 || isRequesting} className="w-full bg-purple-600 text-white hover:bg-purple-700 shadow-xl shadow-purple-900/20 rounded-xl h-11">
                                            {isRequesting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Banknote className="mr-2 h-4 w-4"/>}
                                            Request Payout
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Withdraw Commission?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-gray-400">
                                                Your full balance of <span className="font-bold text-white">₹{profile?.referral_balance.toFixed(2)}</span> will be submitted for verification. Payouts are usually processed to your linked UPI ID within 24 hours.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="bg-white/5 border-white/10 text-white">Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handlePayoutRequest} className="bg-primary text-white">Confirm Withdrawal</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </GlassCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <GlassCard>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-white flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> My Network</CardTitle>
                                    <CardDescription className="text-gray-400">Traders who used your code to join.</CardDescription>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Signups</p>
                                    <p className="text-2xl font-black text-white">{network.length}</p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[300px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-white/5">
                                                <TableHead className="text-gray-500 font-bold uppercase text-[10px]">Trader Name</TableHead>
                                                <TableHead className="text-right text-gray-500 font-bold uppercase text-[10px]">Joined On</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {network.length > 0 ? network.map((user, i) => (
                                                <TableRow key={i} className="border-white/5 hover:bg-white/[0.02]">
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{user.full_name?.[0]}</div>
                                                            <p className="font-bold text-white text-sm">{user.full_name || 'Anonymous Trader'}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-[10px] text-gray-500 font-medium">
                                                        {format(new Date(user.created_at), 'dd MMM yyyy')}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="h-32 text-center text-gray-600 italic">No network members yet. Start sharing!</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </CardContent>
                        </GlassCard>

                        <GlassCard>
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2"><History className="h-5 w-5 text-primary"/> Success History</CardTitle>
                                <CardDescription className="text-gray-400">Rewards from your network's first purchases.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[300px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-white/5">
                                                <TableHead className="text-gray-500 font-bold uppercase text-[10px]">Trader</TableHead>
                                                <TableHead className="text-right text-gray-500 font-bold uppercase text-[10px]">Reward</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {referrals.length > 0 ? referrals.map((ref, i) => (
                                                <TableRow key={i} className="border-white/5 hover:bg-white/[0.02]">
                                                    <TableCell>
                                                        <p className="font-bold text-white text-sm">{ref.profiles.full_name}</p>
                                                        <p className="text-[10px] text-gray-500">{format(new Date(ref.created_at), 'MMM dd, yyyy')}</p>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-green-400">+ ₹{ref.commission_amount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="h-32 text-center text-gray-600 italic">No referral rewards earned yet.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </CardContent>
                        </GlassCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 flex flex-col items-center text-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Gift className="h-6 w-6" /></div>
                            <div>
                                <h4 className="text-lg font-bold text-white">How it works?</h4>
                                <p className="text-sm text-gray-400 mt-1">Earn rewards for the first real plan purchase your referrals make. Commission is added instantly upon payment verification.</p>
                            </div>
                        </div>
                        <PayoutDetailsForm profile={profile} />
                    </div>

                    <GlassCard>
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2"><Banknote className="h-5 w-5 text-primary"/> Withdrawal Audit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/5">
                                        <TableHead className="text-gray-500 font-bold uppercase text-[10px]">Requested On</TableHead>
                                        <TableHead className="text-gray-500 font-bold uppercase text-[10px]">Amount</TableHead>
                                        <TableHead className="text-right text-gray-500 font-bold uppercase text-[10px]">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payoutRequests.length > 0 ? payoutRequests.map((req, i) => (
                                        <TableRow key={i} className="border-white/5">
                                            <TableCell className="text-gray-400 text-sm">{format(new Date(req.created_at), 'dd MMM yyyy')}</TableCell>
                                            <TableCell className="text-white font-bold">₹{req.amount.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className={cn(
                                                    "capitalize text-[9px] font-black border-none",
                                                    req.status === 'completed' ? "bg-green-500/10 text-green-400" :
                                                    req.status === 'pending' ? "bg-amber-400/10 text-amber-400" :
                                                    "bg-red-500/10 text-red-400"
                                                )}>{req.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-32 text-center text-gray-600 italic">No payout history.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </GlassCard>
                </div>
            </main>
        </div>
    );
}

function PayoutDetailsForm({ profile }: { profile: any }) {
    const ref = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [state, formAction] = useActionState(updatePayoutDetails, { error: null, success: null });
    const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.payout_qr_code_url || null);

    useEffect(() => {
        if (state.error) toast({ title: 'Error', description: state.error, variant: 'destructive' });
        if (state.success) toast({ title: 'Success', description: state.success });
    }, [state, toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPreviewUrl(URL.createObjectURL(file));
    }

    return (
        <GlassCard>
            <form action={formAction} ref={ref}>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-white"><Wallet className="w-4 h-4 text-primary"/> Linked Payout Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="payout_upi_id" className="text-xs font-bold text-gray-500 uppercase">UPI Destination</Label>
                        <Input id="payout_upi_id" name="payout_upi_id" defaultValue={profile?.payout_upi_id || ''} required className="bg-black/20 border-white/10 text-white h-11" placeholder="name@bank" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="payout_qr_code" className="text-xs font-bold text-gray-500 uppercase">QR Receipt (Optional)</Label>
                        <Input id="payout_qr_code" name="payout_qr_code" type="file" accept="image/*" onChange={handleFileChange} className="bg-black/20 border-white/10 text-white h-11" />
                    </div>
                    {previewUrl && (
                        <div className="flex justify-center p-4 bg-white rounded-2xl w-fit mx-auto shadow-2xl">
                            <Image src={previewUrl} alt="QR" width={120} height={120} />
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 h-11 font-bold rounded-xl text-xs uppercase tracking-widest">Save Payout Details</Button>
                </CardFooter>
            </form>
        </GlassCard>
    );
}
