
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut } from '@/app/actions';
import { Bell, Copy, DollarSign, ExternalLink, FileCheck, LogOut, Menu, Search, Settings, ShieldAlert, User, Users, KeyRound, MessageSquare, LineChart, Briefcase, Grid3x3, Calendar, EyeOff, Eye, BookUser, Gift, BrainCircuit, TrendingDown, Percent } from 'lucide-react';

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
    { href: "/live-chat", label: "Live Chat" },
    { href: "/mentor", label: "AI Mentor" },
    { href: "/welcome?tab=marketplace", label: "Get Funded" },
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
      <UserNav profile={profile} />
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 md:hidden transition-colors">
        <Menu className="h-5 w-5 text-gray-300" />
      </button>
    </div>
  </header>
);

const RuleCard = ({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) => (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-black/20 border border-white/10">
        <div className="text-purple-400">{icon}</div>
        <div>
            <h4 className="font-semibold text-white">{title}</h4>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
    </div>
);


export default async function GuidePage() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('trading_username, trading_password, full_name, email')
        .eq('id', session.user.id)
        .single();
    
    if (!profile) {
        redirect('/login');
    }

    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-25%] left-[10%] w-[50vw] h-[50vw] bg-purple-600 rounded-full filter blur-3xl opacity-20 " />
                <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-pink-600 rounded-full filter blur-3xl opacity-10" />
            </div>
          
            <main className="relative z-10 p-4 sm:p-6 lg:p-8">
                <DashboardHeader profile={profile} activePage="Trading Guide" />
                <div className="max-w-4xl mx-auto space-y-6">
                    <GlassCard>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white">How to Start Trading on StockMint</CardTitle>
                            <CardDescription className="text-gray-400">Your step-by-step guide to logging in and using the trading platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 text-base">
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg text-white">Step 1: Launch the Trading Platform</h3>
                                <p className="text-gray-400">Click the button below to launch the StockMint platform in a new tab. Log in using your provided credentials.</p>
                                <Button asChild className="bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400/50">
                                    <Link href="https://stockmint.io/" target="_blank">
                                        Launch StockMint.io
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg text-white">Step 2: Enter Your Credentials</h3>
                                <p className="text-gray-400">Use the unique credentials provided to you on the main dashboard to log in. Please store them securely.</p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                                        <p className="text-sm font-medium text-gray-400">Your Username</p>
                                        <p className="text-lg font-mono text-white">{profile?.trading_username || 'Not Provided'}</p>
                                    </div>
                                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                                        <p className="text-sm font-medium text-gray-400">Your Password</p>
                                        <p className="text-lg font-mono text-white">{profile?.trading_password || 'Not Provided'}</p>
                                    </div>
                                </div>
                            </div>
                             <div className="space-y-3 pt-4">
                                <h3 className="font-semibold text-lg text-white">Step 3: Monitor Your Performance</h3>
                                <p className="text-gray-400">Once logged in, you can view your trading performance, available cash, opening balance, and drawdown limits directly in your profile section on the StockMint platform.</p>
                             </div>
                        </CardContent>
                    </GlassCard>

                    <GlassCard>
                         <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white">Understanding Your Drawdown Rules</CardTitle>
                            <CardDescription className="text-gray-400">These rules are critical to managing your funded account. Violation of these limits will result in a breach of your account.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <RuleCard 
                                icon={<TrendingDown className="h-8 w-8" />}
                                title="10% Overall Trailing Drawdown"
                                description="This is your total loss limit, calculated from the highest balance your account has ever reached (high-water mark). For example, if you start with ₹1,00,000 and your balance grows to ₹1,50,000, your new overall drawdown limit is 10% of that peak, which is ₹15,000. Your account will be breached if your equity drops to ₹1,35,000."
                            />
                            <RuleCard 
                                icon={<TrendingDown className="h-8 w-8" />}
                                title="5% Daily Loss Limit"
                                description="You cannot lose more than 5% of your account's opening balance for the day. For a ₹1,00,000 account, this means your daily loss cannot exceed ₹5,000. This limit is calculated based on the balance at the start of each trading day."
                            />
                            <RuleCard 
                                icon={<Percent className="h-8 w-8" />}
                                title="2% Per-Trade Loss Limit"
                                description="The maximum you can lose on a single trade is 2% of your opening balance. On a ₹1,00,000 account, no single trade should result in a loss greater than ₹2,000."
                            />
                        </CardContent>
                    </GlassCard>

                    <GlassCard>
                         <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white">Platform Features</CardTitle>
                            <CardDescription className="text-gray-400">Key features of the StockMint platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg text-white">Leverage</h3>
                                <p className="text-gray-400">Leverage is provided as per Indian market norms. The specific leverage available may vary depending on the instrument being traded.</p>
                            </div>
                            <Separator className="bg-white/10" />
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg text-white">Limit Orders</h3>
                                <p className="text-gray-400">To account for price fluctuations and ensure execution, limit orders may be filled within a 1% range of your specified price. For example, a limit order placed at ₹100 may be executed anywhere between ₹99 and ₹101.</p>
                            </div>
                             <Separator className="bg-white/10" />
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg text-white">Adding Funds</h3>
                                <p className="text-gray-400">You can manage your account and add funds directly through the StockMint platform's interface.</p>
                            </div>
                        </CardContent>
                    </GlassCard>
               </div>
            </main>
        </div>
    )
}
