import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut } from '@/app/actions';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Bell, Copy, DollarSign, ExternalLink, FileCheck, LogOut, Menu, Search, Settings, ShieldAlert, User, MessageSquare, LineChart, Briefcase, Grid3x3, Calendar, EyeOff, Eye, CheckCircle } from 'lucide-react';
import { ReceiptButton } from '../../receipt-button';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg', className)}>
        {children}
    </div>
);

const UserAvatar = () => (
  <div className="relative h-16 w-16">
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

const navItems = [
    { href: "/welcome", label: "Account Hub" },
    { href: "/guide", label: "Trading Guide" },
    { href: "/referrals", label: "Referrals" },
    { href: "/tickets", label: "Support" },
    { href: "/mentor", label: "AI Mentor" },
];

const DashboardHeader = ({profile, activePage}: {profile:any, activePage: string}) => (
  <header className="flex items-center justify-between mb-8 z-20 relative">
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
                 <form action={signOut}>
                    <DropdownMenuItem asChild><button type="submit" className="w-full"><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></button></DropdownMenuItem>
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  </header>
);

const StatCard = ({ title, value, icon, details, progress, progressColor, decorativeImage, isPrimary = false, isLoss = false }: { title: string; value: string; icon: React.ReactNode; details: string; progress: number; progressColor: string; decorativeImage: string; isPrimary?: boolean; isLoss?: boolean }) => (
  <GlassCard className={cn("p-5 flex flex-col relative overflow-hidden", isPrimary && "bg-purple-600/10 border-purple-500/20")}>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-20"><Image src={decorativeImage} alt="" width={80} height={80} /></div>
    <div className="relative">
      <div className="flex items-center gap-2">{icon}<p className="text-sm text-gray-300 font-medium">{title}</p></div>
      <div className="mt-2"><p className={cn("text-3xl font-bold text-white", isLoss && "text-red-400")}>{value}</p><p className="text-xs text-gray-400">{details}</p></div>
      <div className="mt-4"><div className={cn("text-xs font-semibold px-2 py-0.5 rounded-full inline-block", progressColor)}>{progress.toFixed(1)}%</div></div>
    </div>
  </GlassCard>
);

function getBalanceFromPlanName(planName: string): number {
    if (!planName) return 0;
    const name = planName.toLowerCase();
    const match = name.match(/([\d,.]+)\s*(k|l|lakh|cr|crore)/);
    if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2];
        if (unit === 'k') amount *= 1000;
        else if (unit === 'l' || unit === 'lakh') amount *= 100000;
        else if (unit === 'cr' || unit === 'crore') amount *= 10000000;
        return amount;
    }
    const plainNumberMatch = name.match(/^[\d,.]+/);
    if (plainNumberMatch) return parseFloat(plainNumberMatch[0].replace(/,/g, ''));
    return 0;
}

export default async function AccountDashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) redirect('/login');

    const { data: account } = await supabase.from('user_accounts').select('*, profiles(*)').eq('id', id).eq('user_id', session.user.id).single();
    if (!account) notFound();

    const profile = account.profiles;
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;
    let stats = { balance: 0, totalPnl: 0, winRate: 0, activeTradingDays: 0 };

    if (stockmintApiKey && account.trading_username) {
        try {
            const res = await fetch(`https://stockmint.io/api/users/stats?email=${account.trading_username}`, {
                headers: { 'x-api-key': stockmintApiKey },
                cache: 'no-store',
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) stats = data.data;
            }
        } catch (e) { console.error(e); }
    }

    const initialBalance = getBalanceFromPlanName(account.plan_name);
    const pnlProgress = initialBalance > 0 ? (stats.totalPnl / initialBalance) * 100 : 0;

    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden pb-20">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-25%] left-[10%] w-[50vw] h-[50vw] bg-purple-600 rounded-full filter blur-3xl opacity-20 " />
                <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-pink-600 rounded-full filter blur-3xl opacity-10" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <DashboardHeader profile={profile} activePage="Account Hub" />

                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" asChild className="bg-black/20 border-white/10 hover:bg-white/20"><Link href="/welcome"><Grid3x3 className="w-4 h-4"/></Link></Button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{account.plan_name} Dashboard</h1>
                        <p className="text-gray-400 text-sm">Trading Stats & Credentials</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <GlassCard className="lg:col-span-2 p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-6">
                            <UserAvatar />
                            <div>
                                <h2 className="text-2xl font-bold text-white">{profile.full_name}</h2>
                                <p className="text-gray-400">Account ID: {account.id.substring(0, 12)}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Initial</p>
                                <p className="text-xl font-bold text-white mt-1">₹{initialBalance.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Model</p>
                                <p className="text-xl font-bold text-white mt-1 capitalize">{account.account_model === 'passthrupay' ? 'PassThenPay' : 'Standard'}</p>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Type</p>
                                <p className="text-xl font-bold text-white mt-1 capitalize">{account.account_classification}</p>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Status</p>
                                <p className={cn("text-xl font-bold mt-1 capitalize", account.status === 'active' ? "text-green-400" : "text-red-400")}>{account.status}</p>
                            </div>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-8 text-center flex flex-col items-center justify-center gap-4">
                        <div className="bg-purple-600/20 p-4 rounded-full"><MessageSquare className="w-8 h-8 text-purple-400"/></div>
                        <h3 className="text-lg font-bold text-white">Need Help?</h3>
                        <p className="text-sm text-gray-400">Contact our 24/7 support team for assistance with this account.</p>
                        <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 border border-purple-400/50 shadow-lg shadow-purple-500/20"><Link href="/tickets">Create Support Ticket</Link></Button>
                    </GlassCard>
                </div>

                <AccountDetails account={account}/>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <StatCard title="Balance" value={`₹${stats.balance.toLocaleString('en-IN')}`} details="Current Balance" progress={initialBalance > 0 ? (stats.balance / initialBalance) * 100 : 100} icon={<DollarSign className="w-4 h-4 text-gray-400" />} progressColor="bg-purple-500/20 text-purple-300" decorativeImage="/a.png" isPrimary={true} />
                     <StatCard title="Profit / Loss" value={stats.totalPnl >= 0 ? `+₹${stats.totalPnl.toLocaleString('en-IN')}` : `-₹${Math.abs(stats.totalPnl).toLocaleString('en-IN')}`} details="Total P/L" progress={Math.abs(pnlProgress)} icon={<LineChart className="w-4 h-4 text-gray-400"/>} progressColor={stats.totalPnl >= 0 ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"} decorativeImage="/b.png" isLoss={stats.totalPnl < 0} />
                    <StatCard title="Win Rate" value={`${stats.winRate}%`} details="Of all trades" progress={stats.winRate} icon={<Briefcase className="w-4 h-4 text-gray-400"/>} progressColor="bg-sky-500/20 text-sky-300" decorativeImage="/c.png" />
                    <StatCard title="Trading Days" value={`${stats.activeTradingDays}`} details="Active Days" progress={(stats.activeTradingDays / 30) * 100} icon={<Calendar className="w-4 h-4 text-gray-400"/>} progressColor="bg-amber-500/20 text-amber-300" decorativeImage="/d.png" />
                </div>
            </main>
        </div>
    );
}

const AccountDetails = ({ account }: { account: any }) => (
    <GlassCard className="p-6 md:p-8 col-span-full relative">
        <div className="relative z-10">
            <h3 className="font-semibold mb-4 text-white tracking-wide">Account credentials</h3>
            <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-black/20 p-3 rounded-lg flex justify-between items-center border border-white/5">
                        <div><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Trading ID</p><p className="font-semibold font-mono text-white mt-0.5">{account.trading_username || 'Awaiting Setup'}</p></div>
                        <Copy className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
                    </div>
                     <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Password</p>
                        <p className="font-semibold font-mono text-white text-sm mt-0.5">{account.trading_password || '••••••••'}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Terminal</p>
                         <a href="https://stockmint.io" target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:underline flex items-center gap-1 mt-0.5">Stockmint.io <ExternalLink className="w-3 h-3" /></a>
                    </div>
                </div>
            </div>
        </div>
    </GlassCard>
);
