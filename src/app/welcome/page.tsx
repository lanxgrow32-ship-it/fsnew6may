import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut } from '@/app/actions';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Bell, FileCheck, LogOut, Menu, Search, Settings, User, MessageSquare, Briefcase, Grid3x3, CheckCircle, ExternalLink, PlusCircle, ArrowRight, ShieldAlert, Clock, IndianRupee } from 'lucide-react';
import { CompetitionView } from './competition-view';
import { PurchaseSection } from './purchase-section';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
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
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={`https://avatar.vercel.sh/${profile.email}.png`} alt={profile.full_name || 'User'} />
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
                    <DropdownMenuItem asChild><Link href="/profile"><User className="mr-2 h-4 w-4" /><span>My Profile</span></Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/kyc"><FileCheck className="mr-2 h-4 w-4" /><span>KYC</span></Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/tickets"><MessageSquare className="mr-2 h-4 w-4" /><span>Support</span></Link></DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                 <form action={signOut}>
                    <DropdownMenuItem asChild><button type="submit" className="w-full"><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></button></DropdownMenuItem>
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

const navItems = [
    { href: "/welcome", label: "Account Hub" },
    { href: "/guide", label: "Trading Guide" },
    { href: "/referrals", label: "Referrals" },
    { href: "/tickets", label: "Support" },
    { href: "/mentor", label: "AI Mentor" },
];

const DashboardHeader = ({profile, activePage}: {profile:any, activePage: string}) => (
  <header className="flex items-center justify-between mb-12 z-20 relative">
    <div className="flex items-center gap-8">
        <Logo />
        <nav className="hidden md:flex items-center gap-1 bg-black/20 backdrop-blur-sm border border-white/10 p-1 rounded-full shadow-lg">
            {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={cn("px-4 py-1.5 text-sm transition-colors", activePage === item.label ? "font-medium bg-white/10 rounded-full text-white shadow-md" : "text-gray-400 hover:text-white")}>
                    {item.label}
                </Link>
            ))}
      </nav>
    </div>
    <div className="flex items-center gap-2">
      <UserNav profile={profile} />
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 md:hidden transition-colors"><Menu className="h-5 w-5 text-gray-300" /></button>
    </div>
  </header>
);

const AccountCard = ({ account }: { account: any }) => {
    const isPending = account.status === 'pending' || !account.is_approved;
    const isBreached = account.status === 'breached';

    return (
        <GlassCard className={cn("group transition-all duration-300 hover:scale-[1.02] border-white/10", isBreached && "border-destructive/30", isPending && "border-amber-400/30")}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl text-white font-bold">{account.plan_name}</CardTitle>
                        <CardDescription className="text-gray-400 flex items-center gap-2 mt-1">
                            <Grid3x3 className="w-3 h-3"/> {account.id.substring(0, 8)}
                        </CardDescription>
                    </div>
                    {isBreached ? (
                        <div className="bg-destructive/10 text-destructive p-2 rounded-full"><ShieldAlert className="w-5 h-5"/></div>
                    ) : isPending ? (
                        <div className="bg-amber-400/10 text-amber-400 p-2 rounded-full animate-pulse"><Clock className="w-5 h-5"/></div>
                    ) : (
                        <div className="bg-green-500/10 text-green-400 p-2 rounded-full"><CheckCircle className="w-5 h-5"/></div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Status</p>
                        <p className={cn("text-sm font-semibold capitalize mt-0.5", isBreached ? "text-red-400" : isPending ? "text-amber-400" : "text-green-400")}>
                            {isBreached ? "Account Breached" : isPending ? "Awaiting Approval" : "Live & Active"}
                        </p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Created On</p>
                        <p className="text-sm font-semibold text-white mt-0.5">{new Date(account.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-0">
                {isPending ? (
                    <Button disabled className="w-full bg-slate-800 text-gray-500 border border-white/5">Verification in Progress</Button>
                ) : (
                    <Button asChild className={cn("w-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20", isBreached && "bg-slate-800 hover:bg-slate-700")}>
                        <Link href={`/welcome/dashboard/${account.id}`}>
                            {isBreached ? "View History" : "Go to Trading Dashboard"} <ArrowRight className="ml-2 w-4 h-4"/>
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </GlassCard>
    );
};

export default async function WelcomePage() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (!profile) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">Profile error.</div>;

    if (profile.account_type === 'competition') {
        const { data: initialEntries } = await supabase.from('competition_entries').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        const { data: paymentSession } = await supabase.from('payment_sessions').select('status').eq('email', session.user.email).order('created_at', { ascending: false }).limit(1).single();
        return (
            <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
                <main className="relative z-10 p-4 sm:p-6 lg:p-8"><DashboardHeader profile={profile} activePage="Account Hub" /><div className="max-w-4xl mx-auto"><CompetitionView initialEntries={initialEntries || []} paymentSession={paymentSession} /></div></main>
            </div>
        );
    }

    // Fetch all accounts from the new table
    const { data: accounts } = await supabase.from('user_accounts').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });

    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden pb-20">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-25%] left-[10%] w-[50vw] h-[50vw] bg-purple-600 rounded-full filter blur-3xl opacity-20 " />
                <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-pink-600 rounded-full filter blur-3xl opacity-10" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <DashboardHeader profile={profile} activePage="Account Hub" />

                <section className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold text-white tracking-tight">Your Trading Accounts</h2>
                            <p className="text-gray-400 mt-1 text-lg">Manage multiple accounts and track your performance.</p>
                        </div>
                         {profile.kyc_status !== 'verified' && (
                            <Link href="/kyc" className="flex items-center gap-2 bg-amber-400/10 text-amber-400 px-4 py-2 rounded-full border border-amber-400/20 text-sm font-semibold hover:bg-amber-400/20 transition-all">
                                <ShieldAlert className="w-4 h-4"/> Complete KYC to Activate Accounts
                            </Link>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                        {accounts && accounts.length > 0 ? (
                            accounts.map((acc: any) => <AccountCard key={acc.id} account={acc} />)
                        ) : (
                            <GlassCard className="col-span-full p-12 text-center border-dashed">
                                <PlusCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white">No accounts found</h3>
                                <p className="text-gray-400 max-w-sm mx-auto mt-2">Get started by choosing your first funding plan below.</p>
                            </GlassCard>
                        )}
                    </div>
                </section>

                <section className="mt-24 space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-extrabold text-white tracking-tight">Get a New Account</h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">Scale your capital or restart after a breach. Your KYC is preserved, meaning your next account activates even faster.</p>
                    </div>
                    
                    <PurchaseSection profile={profile} />
                </section>
            </main>
        </div>
    );
}
