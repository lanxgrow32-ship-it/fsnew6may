
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut } from '@/app/actions';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Bell, Copy, DollarSign, ExternalLink, FileCheck, LogOut, Menu, Search, Settings, ShieldAlert, User, Users, KeyRound, MessageSquare, LineChart, Briefcase, Grid3x3, Calendar, EyeOff, Eye, Loader2, BookUser, Gift, BrainCircuit, TrendingDown, Percent, CheckCircle } from 'lucide-react';
import { ReceiptButton } from './receipt-button';

// Helper Components for the new UI

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg', className)}>
        {children}
    </div>
);

const UserAvatar = ({ className }: { className?: string }) => (
  <div className={cn('relative h-16 w-16', className)}>
    <div className="absolute -inset-1 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full blur-md opacity-75"></div>
    <div className="relative h-16 w-16 flex items-center justify-center bg-slate-900 rounded-full border-2 border-white/10 overflow-hidden">
      <Image src="/bitmoji.png" alt="User Avatar" width={64} height={64} className="object-cover" />
    </div>
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
                    <DropdownMenuItem asChild>
                         <Link href="/profile">
                            <User className="mr-2 h-4 w-4" />
                            <span>My Profile</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/kyc">
                            <FileCheck className="mr-2 h-4 w-4" />
                            <span>KYC</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/tickets">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>Support</span>
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

const navItems = [
    { href: "/welcome", label: "Account Overview" },
    { href: "/guide", label: "Trading Guide" },
    { href: "/referrals", label: "Referrals" },
    { href: "/tickets", label: "Support" },
    { href: "/mentor", label: "AI Mentor" },
    { href: "/pricing", label: "Purchase New Plan" },
];

const NotificationItem = ({ children, isDone }: { children: React.ReactNode, isDone: boolean }) => (
    <DropdownMenuItem className={cn("gap-2", !isDone && "text-muted-foreground")}>
        {isDone ? <CheckCircle className="text-green-500" /> : <div className="w-4 h-4" />}
        <span>{children}</span>
    </DropdownMenuItem>
);

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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                <Bell className="h-5 w-5 text-gray-300" />
                {!profile.is_approved || profile.kyc_status !== 'verified' ? <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-purple-500"></span> : null}
              </button>
            </DropdownMenuTrigger>
             <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel>Account Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <NotificationItem isDone={profile.is_approved}>Payment Approved</NotificationItem>
                <NotificationItem isDone={profile.kyc_status === 'verified'}>KYC Verified</NotificationItem>
                <NotificationItem isDone={profile.credentials_provided}>Credentials Issued</NotificationItem>
                 {profile.is_breached && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <ShieldAlert />
                            <span>Account Breached</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
      <UserNav profile={profile} />
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 md:hidden transition-colors">
        <Menu className="h-5 w-5 text-gray-300" />
      </button>
    </div>
  </header>
);

function formatBalance(planName: string): string {
    if (!planName) return '₹0';
    const name = planName.toLowerCase();
    const match = name.match(/([\d,.]+)\s*(k|l|lakh|cr|crore)/);
    if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2];
        if (unit === 'k') return `₹${amount}K`;
        if (unit === 'l' || unit === 'lakh') return `₹${amount}L`;
        if (unit === 'cr' || unit === 'crore') return `₹${amount}Cr`;
    }
    const plainNumberMatch = name.match(/^[\d,.]+/);
    if (plainNumberMatch) {
        const num = parseFloat(plainNumberMatch[0].replace(/,/g, ''));
        if (num >= 10000000) return `₹${num/10000000}Cr`;
        if (num >= 100000) return `₹${num/100000}L`;
        if (num >= 1000) return `₹${num/1000}K`;
        return `₹${num}`;
    }
    return '₹0';
}

function getAccountType(planName: string): string {
    if (!planName) return 'N/A';
    const lowerPlanName = planName.toLowerCase();
    if (lowerPlanName.includes('instant')) return 'Instant';
    if (lowerPlanName.includes('1-step')) return '1-Step';
    if (lowerPlanName.includes('2-step')) return '2-Step';
    return 'Standard';
}

const UserDetails = ({ profile }: { profile: any }) => {
    const initialBalance = formatBalance(profile.plan_purchased);
    const accountType = getAccountType(profile.plan_purchased);
    
    return (
        <GlassCard className="p-6 md:p-8 relative h-full flex flex-col">
            <div className="relative z-10 flex-grow">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <UserAvatar />
                        <div>
                            <h2 className="text-xl font-bold tracking-wide text-white">{profile.full_name}</h2>
                            <p className="text-sm text-gray-400">
                                Currently, you have an <span className="font-semibold text-white">{accountType}</span> account
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0 border border-white/10 bg-black/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-mono text-gray-300 flex items-center gap-2">
                        <Grid3x3 className="w-4 h-4 text-gray-500" />
                        {profile.id.substring(0, 8)}
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-xs text-gray-400 tracking-wider">Initial Balance</p>
                        <p className="font-semibold text-white mt-1">{initialBalance}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-xs text-gray-400 tracking-wider">Plan Type</p>
                        <p className="font-semibold text-white mt-1 truncate">{profile.plan_purchased}</p>
                    </div>
                     <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-xs text-gray-400 tracking-wider">Account Type</p>
                        <p className="font-semibold text-white mt-1">{accountType}</p>
                    </div>
                </div>

                 <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-xs text-gray-400 tracking-wider">Start Date</p>
                        <p className="font-semibold text-white">{new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-xs text-gray-400 tracking-wider">Account Status</p>
                        <p className="font-semibold text-green-400 mt-1">Active</p>
                    </div>
                </div>
            </div>
            <div className="relative z-10 mt-6">
                <ReceiptButton profile={profile} asStrip={true} />
            </div>
        </GlassCard>
    );
};

const SupportCard = () => (
    <GlassCard className="p-6 text-center h-full flex flex-col justify-between">
        <div className="relative z-10">
            <h3 className="font-semibold text-white tracking-wide text-lg">Funded Stock support</h3>
            <div className="my-6 flex justify-center">
                <div className="h-24 w-24 rounded-full bg-purple-500/10 flex items-center justify-center border-2 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                    <Users className="h-10 w-10 text-purple-300" />
                </div>
            </div>
             <div className="bg-black/20 p-3 rounded-lg flex justify-between items-center border border-white/5 mb-4">
                <div>
                    <p className="text-xs text-gray-400 tracking-wider">Support Phone</p>
                    <p className="font-semibold font-mono text-white">+91 12345 67890</p>
                </div>
                <Copy className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
            </div>
        </div>
        <div className="mt-6 relative z-10">
            <a href="mailto:support@fundedstock.live" className="w-full block">
              <button className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400/50">
                  Contact
              </button>
            </a>
            <p className="mt-4 text-sm text-gray-400">support@fundedstock.live</p>
        </div>
    </GlassCard>
);

const AccountDetails = ({ profile }: { profile: any }) => (
    <GlassCard className="p-6 md:p-8 col-span-full relative">
        <div className="relative z-10">
            <h3 className="font-semibold mb-4 text-white tracking-wide">Account details</h3>
            <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-black/20 p-3 rounded-lg flex justify-between items-center border border-white/5">
                        <div>
                            <p className="text-xs text-gray-400 tracking-wider">Trading ID</p>
                            <p className="font-semibold font-mono text-white">{profile.trading_username}</p>
                        </div>
                        <Copy className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
                    </div>
                     <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-xs text-gray-400 tracking-wider">Trading Password</p>
                        <p className="font-semibold font-mono text-white text-sm">{profile.trading_password}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-xs text-gray-400 tracking-wider">Platform</p>
                         <a href="https://stockmint.io" target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:underline flex items-center gap-1">
                            Stockmint.io <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </GlassCard>
);

const StatCard = ({ title, value, icon, details, progress, progressColor, decorativeImage, isPrimary = false, isLoss = false }: { title: string; value: string; icon: React.ReactNode; details: string; progress: number; progressColor: string; decorativeImage: string; isPrimary?: boolean; isLoss?: boolean }) => (
  <GlassCard className={cn("p-5 flex flex-col relative overflow-hidden", isPrimary && "bg-purple-600/10 border-purple-500/20")}>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-20">
        <Image src={decorativeImage} alt="" width={80} height={80} className="opacity-100" />
    </div>
    <div className="relative">
      <div className="flex items-center gap-2">
         {icon}
        <p className="text-sm text-gray-300 font-medium">{title}</p>
      </div>
      <div className="mt-2">
        <p className={cn("text-3xl font-bold text-white", isLoss && "text-red-400")}>{value}</p>
        <p className="text-xs text-gray-400">{details}</p>
      </div>
      <div className="mt-4">
        <div className={cn("text-xs font-semibold px-2 py-0.5 rounded-full inline-block", progressColor)}>
          {progress.toFixed(1)}%
        </div>
      </div>
    </div>
  </GlassCard>
);

const KycPrompt = () => (
    <GlassCard className="mt-6 p-6 md:p-8 col-span-full text-center">
      <FileCheck className="h-12 w-12 text-purple-400 mx-auto mb-4" />
      <h3 className="text-2xl font-bold text-white mb-2">Your Account is Almost Ready</h3>
      <p className="text-gray-400 max-w-md mx-auto mb-6">Please complete your KYC (Know Your Customer) verification to unlock your trading credentials and get started.</p>
      <Button asChild className="bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400/50">
        <Link href="/kyc">Start KYC Verification</Link>
      </Button>
    </GlassCard>
)

const AccountBreached = () => (
    <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
        <main className="flex min-h-screen items-center justify-center p-4">
            <GlassCard className="w-full max-w-lg text-center p-8 border-destructive/50">
                <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit mb-4">
                    <ShieldAlert className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-destructive">Account Breached</h2>
                <p className="text-gray-400 mt-2 mb-6">
                    Your account has been flagged for a breach of our trading rules. Access has been suspended.
                </p>
                <div className="flex flex-col items-center gap-4 pt-4">
                    <Button asChild className="w-full max-w-xs">
                        <Link href="/pricing">Purchase New Account</Link>
                    </Button>
                </div>
            </GlassCard>
        </main>
    </div>
);

const PaymentPending = () => (
    <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
        <main className="flex min-h-screen items-center justify-center p-4">
            <GlassCard className="w-full max-w-lg text-center p-8 border-amber-500/50">
                <div className="mx-auto bg-amber-500/10 rounded-full p-3 w-fit mb-4">
                    <Loader2 className="h-10 w-10 text-amber-400 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-amber-400">Payment Verification Pending</h2>
                <p className="text-gray-400 mt-2 mb-6">
                    Your payment is being verified by our team. This page will update automatically once your account is approved. This usually takes a few minutes.
                </p>
                <div className="flex flex-col items-center gap-4 pt-4">
                     <form action={signOut}>
                        <Button variant="outline" className="bg-black/20 border-white/10 text-white hover:bg-white/20">
                            Logout
                        </Button>
                    </form>
                </div>
            </GlassCard>
        </main>
    </div>
);

export default async function WelcomePage() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/login');
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

    if (!profile) {
        return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">Could not load your profile. Please contact support.</div>;
    }
    
    if (!profile.is_approved) {
        return <PaymentPending />;
    }
    
    if (profile.is_breached) {
        return <AccountBreached />;
    }

    // This is the new, unified layout for the welcome page.
    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
          <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-25%] left-[10%] w-[50vw] h-[50vw] bg-purple-600 rounded-full filter blur-3xl opacity-20 " />
                <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-pink-600 rounded-full filter blur-3xl opacity-10" />
            </div>
          
          <main className="relative z-10 max-w-full mx-auto p-4 sm:p-6 lg:p-8">
            <DashboardHeader profile={profile} activePage="Account Overview" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UserDetails profile={profile} />
                <SupportCard />
            </div>

            {profile.kyc_status !== 'verified' ? <KycPrompt/> : (
              <>
                <div className="mt-6">
                    <AccountDetails profile={profile}/>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <StatCard
                        title="Balance"
                        value="₹1,00,000"
                        details="Current Balance"
                        progress={100.0}
                        icon={<DollarSign className="w-4 h-4 text-gray-400" />}
                        progressColor="bg-purple-500/20 text-purple-300"
                        decorativeImage="/a.png"
                        isPrimary={true}
                    />
                     <StatCard
                        title="Profit / Loss"
                        value="+₹2,034"
                        details="Total P/L"
                        progress={2.03}
                        icon={<LineChart className="w-4 h-4 text-gray-400"/>}
                        progressColor="bg-green-500/20 text-green-300"
                        decorativeImage="/b.png"
                    />
                    <StatCard
                        title="Win Rate"
                        value="72%"
                        details="Of all trades"
                        progress={72.0}
                        icon={<Briefcase className="w-4 h-4 text-gray-400"/>}
                        progressColor="bg-sky-500/20 text-sky-300"
                        decorativeImage="/c.png"
                    />
                    <StatCard
                        title="Trading Days"
                        value="18"
                        details="Active Days"
                        progress={60.0}
                        icon={<Calendar className="w-4 h-4 text-gray-400"/>}
                        progressColor="bg-amber-500/20 text-amber-300"
                        decorativeImage="/d.png"
                    />
                </div>
              </>
            )}

          </main>
        </div>
    );
}

    