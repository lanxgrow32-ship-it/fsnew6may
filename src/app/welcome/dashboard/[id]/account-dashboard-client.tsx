
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
    Bell, 
    Copy, 
    DollarSign, 
    ExternalLink, 
    FileCheck, 
    LogOut, 
    Menu, 
    Search, 
    Settings, 
    User, 
    MessageSquare, 
    LineChart, 
    Briefcase, 
    Grid3x3, 
    Calendar, 
    EyeOff, 
    Eye, 
    CheckCircle,
    Timer,
    Zap,
    FlaskConical,
    Trophy,
    Lock,
    ShieldAlert,
    ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut } from '@/app/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { differenceInSeconds } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg', className)}>
        {children}
    </div>
);

const UserAvatar = () => (
  <div className="relative h-16 w-16 shrink-0">
    <div className="absolute -inset-1 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full blur-md opacity-75"></div>
    <div className="relative h-16 w-16 flex items-center justify-center bg-slate-900 rounded-full border-2 border-white/10 overflow-hidden">
      <Image src="/bitmoji.png" alt="User Avatar" width={64} height={64} className="object-cover" />
    </div>
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

const navItems = [
    { href: "/welcome", label: "Portfolio" },
    { href: "/guide", label: "Guide" },
    { href: "/referrals", label: "Referrals" },
    { href: "/welcome?tab=support", label: "Live Chat" },
    { href: "/mentor", label: "AI Mentor" },
    { href: "/welcome?tab=marketplace", label: "Market" },
];

const StatCard = ({ title, value, icon, details, progress, progressColor, decorativeImage, isPrimary = false, isLoss = false }: { title: string; value: string; icon: React.ReactNode; details: string; progress: number; progressColor: string; decorativeImage: string; isPrimary?: boolean; isLoss?: boolean }) => (
  <GlassCard className={cn("p-5 flex flex-col relative overflow-hidden", isPrimary && "bg-purple-600/10 border-purple-500/20")}>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-20 opacity-20"><Image src={decorativeImage} alt="" width={80} height={80} /></div>
    <div className="relative">
      <div className="flex items-center gap-2">{icon}<p className="text-sm text-gray-300 font-medium">{title}</p></div>
      <div className="mt-2"><p className={cn("text-3xl font-bold text-white", isLoss && "text-red-400")}>{value}</p><p className="text-xs text-gray-400">{details}</p></div>
      <div className="mt-4"><div className={cn("text-xs font-semibold px-2 py-0.5 rounded-full inline-block", progressColor)}>{progress.toFixed(1)}%</div></div>
    </div>
  </GlassCard>
);

function CountdownTimer({ expiresAt, label = "Session Remaining" }: { expiresAt: string, label?: string }) {
    const [timeLeft, setTimeLeft] = useState<string>('--:--:--');

    useEffect(() => {
        const target = new Date(expiresAt);
        
        const update = () => {
            const now = new Date();
            const diff = differenceInSeconds(target, now);
            
            if (diff <= 0) {
                setTimeLeft('EXPIRED');
                window.location.reload();
                return;
            }

            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        const interval = setInterval(update, 1000);
        update();
        return () => clearInterval(interval);
    }, [expiresAt]);

    return (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-3 flex items-center justify-between gap-8 shadow-[0_0_30px_rgba(139,44,245,0.1)]">
            <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-primary animate-pulse" />
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{label}</p>
            </div>
            <p className="text-2xl font-black text-white font-mono tracking-tighter">{timeLeft}</p>
        </div>
    );
}

export function AccountDashboardClient({ account, profile, stats, initialBalance }: { account: any, profile: any, stats: any, initialBalance: number }) {
    const { toast } = useToast();
    const router = useRouter();
    const isBlocked = account.is_blocked;
    const pnlProgress = initialBalance > 0 ? (Math.abs(stats.totalPnl || 0) / initialBalance) * 100 : 0;
    const currentClassification = stats.accountClassification || account.account_classification || 'evaluation';
    const isTrial = account.is_trial;
    const isPro = account.account_classification === 'instant_pro';

    const copyText = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard" });
    }

    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden pb-20">
            {/* Hardened Block Overlay */}
            {isBlocked && (
                <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 text-center animate-in fade-in">
                    <Card className="w-full max-w-lg bg-slate-900 border-red-500/30 p-12 rounded-[40px] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Lock className="w-48 h-48 text-red-500"/></div>
                        <div className="mx-auto w-24 h-24 rounded-full bg-red-600/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_50px_rgba(220,38,38,0.2)] mb-8">
                            <ShieldAlert className="h-12 w-12 text-red-500 animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">Account Restricted</h2>
                        <p className="text-gray-400 text-lg font-medium leading-relaxed mb-10">
                            Your 48-hour KYC grace period has expired. Access to trading credentials and terminal stats is restricted until identity verification is complete.
                        </p>
                        <div className="flex flex-col gap-4">
                            <Button asChild size="lg" className="h-14 rounded-2xl bg-white text-black hover:bg-gray-200 font-black uppercase tracking-widest shadow-xl">
                                <Link href="/kyc">Complete KYC Now</Link>
                            </Button>
                            <Button asChild variant="ghost" className="text-gray-500 hover:text-white font-bold">
                                <Link href="/welcome" className="flex items-center gap-2"><ChevronLeft className="w-4 h-4"/> Back to Portfolio</Link>
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            
            <main className={cn("relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8", isBlocked && "blur-sm pointer-events-none")}>
                <header className="flex items-center justify-between mb-8 z-20 relative">
                    <div className="flex items-center gap-8">
                        <Logo />
                        <nav className="hidden md:flex items-center gap-1 bg-black/20 backdrop-blur-sm border border-white/10 p-1 rounded-full shadow-lg">
                            {navItems.map((item) => (
                                <Link key={item.href} href={item.href} className={cn("px-4 py-1.5 text-sm transition-colors", item.label === "Portfolio" ? "font-medium bg-white/10 rounded-full text-white shadow-md" : "text-gray-400 hover:text-white")}>
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <form action={signOut} className="hidden lg:block">
                            <Button variant="ghost" type="submit" size="sm" className="text-gray-500 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest gap-2 h-9">
                                <LogOut className="w-3.5 h-3.5" />
                                Logout
                            </Button>
                        </form>
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
                                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push('/kyc')}>
                                        <FileCheck className="mr-2 h-4 w-4" />
                                        <span>KYC</span>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <form action={signOut}>
                                    <DropdownMenuItem asChild><button type="submit" className="w-full"><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></button></DropdownMenuItem>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild className="bg-black/20 border-white/10 hover:bg-white/20"><Link href="/welcome"><Grid3x3 className="w-4 h-4"/></Link></Button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{account.plan_name}</h1>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Live Metrics & Hub Access</p>
                        </div>
                    </div>
                    {isTrial && <CountdownTimer expiresAt={account.expires_at} label="Trial Run Remaining" />}
                    {isPro && account.expires_at && <CountdownTimer expiresAt={account.expires_at} label="Pro Cycle Validity" />}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <GlassCard className="lg:col-span-2 p-6 md:p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-6">
                            <UserAvatar />
                            <div className="min-w-0">
                                <h2 className="text-xl md:text-2xl font-bold text-white truncate">{profile.full_name}</h2>
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Status: {account.status}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 min-w-0">
                                <p className="text-[9px] text-gray-500 uppercase font-black truncate">Initial Capital</p>
                                <p className="text-xs md:text-sm font-bold text-white mt-1 truncate">₹{initialBalance.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 min-w-0">
                                <p className="text-[9px] text-gray-500 uppercase font-black truncate">Engine Model</p>
                                <p className="text-xs md:text-sm font-bold text-white mt-1 truncate capitalize">{isTrial ? 'Trial Run' : isPro ? 'Instant Pro' : account.account_model === 'passthrupay' ? 'PTP' : 'Standard'}</p>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 min-w-0">
                                <p className="text-[9px] text-gray-500 uppercase font-black truncate">Live Status</p>
                                <p className="text-[11px] md:text-sm font-bold text-primary mt-1 truncate capitalize whitespace-nowrap overflow-hidden">
                                    {currentClassification === 'passthenpay' ? 'PassThenPay' : currentClassification.replace(/_/g, ' ')}
                                </p>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 min-w-0">
                                <p className="text-[9px] text-gray-500 uppercase font-black truncate">Account Hub</p>
                                <p className={cn("text-xs md:text-sm font-bold mt-1 truncate capitalize", account.status === 'active' ? "text-green-400" : "text-red-400")}>{account.status}</p>
                            </div>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-8 text-center flex flex-col items-center justify-center gap-4">
                        <div className="bg-purple-600/20 p-4 rounded-full"><MessageSquare className="w-8 h-8 text-purple-400"/></div>
                        <h3 className="text-lg font-bold text-white">Direct Support</h3>
                        <p className="text-sm text-gray-400">Contact our traders desk for account resets or technical help.</p>
                        <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 border border-purple-400/50 shadow-xl shadow-purple-900/20"><Link href="/welcome?tab=support">Start Session</Link></Button>
                    </GlassCard>
                </div>

                <GlassCard className="p-6 md:p-8 col-span-full relative">
                    <div className="relative z-10">
                        <h3 className="font-bold mb-4 text-white text-base tracking-wide uppercase">Terminal Credentials</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-black/20 p-4 rounded-xl flex justify-between items-center border border-white/5 overflow-hidden">
                                    <div className="min-w-0"><p className="text-[10px] text-gray-600 uppercase font-black">Login ID</p><p className="font-bold font-mono text-white mt-1 truncate text-sm">{account.trading_username || 'Verifying Hub...'}</p></div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white shrink-0 ml-2" onClick={() => copyText(account.trading_username)}><Copy className="w-4 h-4"/></Button>
                                </div>
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5 overflow-hidden">
                                    <p className="text-[10px] text-gray-600 uppercase font-black">Master Password</p>
                                    <p className="font-bold font-mono text-white text-sm mt-1 truncate">{account.trading_password || '••••••••'}</p>
                                </div>
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5 overflow-hidden">
                                    <p className="text-[10px] text-gray-600 uppercase font-black">Gateway</p>
                                    <a href="https://stockmint.io" target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-primary transition-colors flex items-center gap-2 mt-1 truncate text-sm">Stockmint.io <ExternalLink className="w-3.5 h-3.5" /></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <StatCard title="Balance" value={`₹${(stats.balance || 0).toLocaleString('en-IN')}`} details="Current Balance" progress={initialBalance > 0 ? ((stats.balance || 0) / initialBalance) * 100 : 100} icon={<DollarSign className="w-4 h-4 text-gray-400" />} progressColor="bg-purple-500/20 text-purple-300" decorativeImage="/a.png" isPrimary={true} />
                     <StatCard title="Profit / Loss" value={(stats.totalPnl || 0) >= 0 ? `+₹${(stats.totalPnl || 0).toLocaleString('en-IN')}` : `-₹${Math.abs(stats.totalPnl || 0).toLocaleString('en-IN')}`} details="Total Performance" progress={pnlProgress} icon={<LineChart className="w-4 h-4 text-gray-400"/>} progressColor={(stats.totalPnl || 0) >= 0 ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"} decorativeImage="/b.png" isLoss={(stats.totalPnl || 0) < 0} />
                    <StatCard title="Win Rate" value={`${stats.winRate || 0}%`} details="Statistical Accuracy" progress={stats.winRate || 0} icon={<Briefcase className="w-4 h-4 text-gray-400"/>} progressColor="bg-sky-500/20 text-sky-300" decorativeImage="/c.png" />
                    <StatCard title="Trading Days" value={`${stats.activeTradingDays || 0}`} details="Verified Sessions" progress={((stats.activeTradingDays || 0) / 30) * 100} icon={<Calendar className="w-4 h-4 text-gray-400"/>} progressColor="bg-amber-500/20 text-amber-300" decorativeImage="/d.png" />
                </div>
            </main>
        </div>
    );
}
