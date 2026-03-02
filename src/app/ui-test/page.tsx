
'use client';

import { useState } from 'react';
import {
  Bell,
  Calendar,
  ChevronDown,
  DollarSign,
  Eye,
  EyeOff,
  LineChart,
  Menu,
  Search,
  Settings,
  Users,
  Grid3x3,
  Briefcase,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';

const UserAvatar = ({ className }: { className?: string }) => (
  <div className={cn('relative rounded-full', className)}>
    <svg className="w-12 h-12" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="url(#avatar-gradient)" />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center">
        <svg className="w-14 h-14" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M38.3333 40.5V38C38.3333 34.7865 35.5468 32.1667 32.1667 32.1667H21.8333C18.4532 32.1667 15.6667 34.7865 15.6667 38V40.5" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M27 27.5C30.4518 27.5 33.25 24.8512 33.25 21.5C33.25 18.1488 30.4518 15.5 27 15.5C23.5482 15.5 20.75 18.1488 20.75 21.5C20.75 24.8512 23.5482 27.5 27 27.5Z" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.75 21.5C20.75 19.429 20.75 17.3579 21.8333 15.5H32.1667C33.25 17.3579 33.25 19.429 33.25 21.5" fill="#111827"/>
        </svg>
    </div>
    <svg className="absolute -top-1 -left-1 w-[58px] h-[58px]" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="avatar-gradient" x1="40" y1="0" x2="40" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A78BFA" />
            <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);


const GlassCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'bg-black/20 backdrop-blur-lg border border-white/5 rounded-2xl shadow-2xl shadow-black/30 relative overflow-hidden',
      'before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.02)_0%,transparent_50%)]',
      className
    )}
  >
    {children}
  </div>
);

const Logo = () => (
    <div className="bg-slate-900/70 h-10 w-10 flex items-center justify-center rounded-lg text-2xl font-bold border border-white/10 shadow-inner shadow-black/50">
        N
    </div>
);


const DashboardHeader = () => (
  <header className="flex items-center justify-between mb-8 z-20 relative">
    <div className="flex items-center gap-8">
        <Logo />
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/50 border border-white/10 p-1 rounded-full shadow-lg">
            <a href="#" className="px-4 py-1.5 text-sm font-medium bg-slate-700/80 rounded-full text-white shadow-md">
            Account Overview
            </a>
            <a href="#" className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            Trading Overview
            </a>
            <a href="#" className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            Transactions
            </a>
            <a href="#" className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            Competition
            </a>
      </nav>
    </div>
    <div className="flex items-center gap-2">
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-800/60 transition-colors">
        <Search className="h-5 w-5 text-gray-300" />
      </button>
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-800/60 transition-colors">
        <Settings className="h-5 w-5 text-gray-300" />
      </button>
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-800/60 transition-colors">
        <Bell className="h-5 w-5 text-gray-300" />
      </button>
      <div className="flex items-center gap-2 bg-slate-900/50 border border-white/10 p-1 rounded-full shadow-lg">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-indigo-600 text-white">N</AvatarFallback>
        </Avatar>
        <div className="pr-2 hidden sm:block">
          <p className="text-sm font-semibold tracking-wide">Naimur Rahman</p>
          <p className="text-xs text-gray-400">naimurrahman@gmail.com</p>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block mr-1" />
      </div>
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-800/60 md:hidden transition-colors">
        <Menu className="h-5 w-5 text-gray-300" />
      </button>
    </div>
  </header>
);

const UserDetails = () => (
  <GlassCard className="p-6 md:p-8 col-span-1 md:col-span-2 relative">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.15),transparent_60%)]"></div>
    <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-4">
                <UserAvatar />
                <div>
                <h2 className="text-xl font-bold tracking-wide text-white">Naimur Rahman</h2>
                <p className="text-sm text-gray-400">
                    Currently, you have an evaluation account
                </p>
                </div>
            </div>
            <div className="shrink-0 border border-white/10 bg-slate-900/50 rounded-full px-4 py-1.5 text-sm font-mono text-gray-300 flex items-center gap-2">
                <Grid3x3 className="w-4 h-4 text-gray-500" />
                78748803
            </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-gray-400 tracking-wider flex items-center justify-center gap-1.5"><DollarSign className="w-3 h-3" /> Initial Balance</p>
                <p className="font-semibold text-white mt-1">$6,000</p>
            </div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-gray-400 tracking-wider flex items-center justify-center gap-1.5"><Briefcase className="w-3 h-3" /> Plan Type</p>
                <p className="font-semibold text-white mt-1">6k</p>
            </div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-gray-400 tracking-wider flex items-center justify-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.2c0-5.5-4-10-9-10-5 0-9 4.5-9 10 0 5.5 4 10 9 10 3 0 5.5-1.5 7-4"/><path d="M18 10h5V5m0 5-6-6"/></svg>
                    Account Type
                </p>
                <p className="font-semibold text-white mt-1">Swap</p>
            </div>
        </div>

        <div className="mt-8">
            <h3 className="font-semibold flex items-center gap-2 mb-3 text-white tracking-wide">
                <Calendar className="w-5 h-5 text-purple-400" />
                Trading Cycle Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-gray-400 tracking-wider">Start Date</p>
                <p className="font-semibold text-white">Apr 15, 2025</p>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-gray-400 tracking-wider">End Date</p>
                <p className="font-semibold text-white">Apr 28, 2025</p>
                </div>
            </div>
        </div>
    </div>
  </GlassCard>
);

const AccountDetails = () => {
  const [isPassVisible, setIsPassVisible] = useState(false);
  return (
    <GlassCard className="p-6 md:p-8 col-span-1 md:col-span-2 relative">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.1),transparent_60%)]"></div>
        <div className="relative z-10">
            <h3 className="font-semibold mb-4 text-white tracking-wide">Account details</h3>
            <div className="space-y-3">
                <div className="bg-black/20 p-3 rounded-lg flex justify-between items-center border border-white/5">
                    <div>
                        <p className="text-xs text-gray-400 tracking-wider">Log in</p>
                        <p className="font-semibold font-mono text-white">78748803</p>
                    </div>
                     <Copy className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-gray-400 tracking-wider">MT5 Server</p>
                    <p className="font-semibold text-white">FundedNext-Server4</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-xs text-gray-400 tracking-wider">Investor Pass</p>
                        <button className="text-sm font-semibold text-purple-400 hover:underline">
                            Set Password
                        </button>
                    </div>
                     <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-xs text-gray-400 tracking-wider">Master Pass</p>
                        <div className="flex items-center justify-between">
                            <p className="font-semibold font-mono text-white text-sm">
                            {isPassVisible ? 'YourPass123' : '••••••••••'}
                            </p>
                            <button onClick={() => setIsPassVisible(!isPassVisible)}>
                            {isPassVisible ? (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                            ) : (
                                <Eye className="w-4 h-4 text-gray-400" />
                            )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </GlassCard>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  details,
  progress,
  progressColor,
  decorativeImage,
  isPrimary = false
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  details: string;
  progress: number;
  progressColor: string;
  decorativeImage: string;
  isPrimary?: boolean;
}) => (
  <GlassCard className={cn("p-5 flex flex-col relative", isPrimary && "bg-purple-600/10 border-purple-500/20")}>
    <div className="absolute inset-0 bg-cover bg-center opacity-[0.02]" style={{backgroundImage: "url(/grid.svg)"}}></div>
    <div className="absolute bottom-0 right-0 w-20 h-20">
        <Image src={decorativeImage} alt="" width={80} height={80} className="opacity-20" />
    </div>
    <div className="relative">
      <div className="flex items-center gap-2">
         {icon}
        <p className="text-sm text-gray-300 font-medium">{title}</p>
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold text-white">{value}</p>
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

const RightSidebar = () => (
  <div className="col-span-1 md:col-span-4 lg:col-span-1 space-y-6">
    <GlassCard className="p-6 text-center">
      <h3 className="font-semibold text-white tracking-wide">Xpertfunding Email Support</h3>
      <div className="my-6 flex justify-center">
        <div className="h-24 w-24 rounded-full bg-purple-500/10 flex items-center justify-center border-2 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
          <Users className="h-10 w-10 text-purple-300" />
        </div>
      </div>
      <button className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400/50">
        Contact
      </button>
      <p className="mt-4 text-sm text-gray-400 hover:text-white cursor-pointer">support@xpertfunding.com</p>
    </GlassCard>
    <GlassCard className="p-6 text-center">
      <p className="text-sm text-gray-400">Today's permitted loss will reset in</p>
      <p className="text-4xl font-mono font-bold my-4 text-white">07:14:45</p>
      <p className="text-xs text-gray-500">Countdown Timezone: GMT+3</p>
    </GlassCard>
  </div>
);

export default function UITestPage() {
  return (
    <div className="dark min-h-screen bg-[#06060A] text-gray-200 font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_40%_50%_at_50%_0%,rgba(168,85,247,0.3),transparent)]"></div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      <main className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <DashboardHeader />

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-4 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <UserDetails />
            <AccountDetails />

            <StatCard
              title="Balance"
              value="$6,000"
              details="Balance"
              progress={60.0}
              icon={<DollarSign className="w-4 h-4 text-gray-400" />}
              progressColor="bg-purple-500/20 text-purple-300"
              decorativeImage="https://i.imgur.com/2h31aQv.png"
              isPrimary={true}
            />
             <StatCard
              title="Profit"
              value="$2034"
              details="Profit/Loss"
              progress={20.3}
              icon={<LineChart className="w-4 h-4 text-gray-400" />}
              progressColor="bg-purple-500/20 text-purple-300"
              decorativeImage="https://i.imgur.com/IChPzJ4.png"
            />
            <StatCard
              title="Loss"
              value="$1326"
              details="Floating Loss"
              progress={13.2}
              icon={<LineChart className="w-4 h-4 text-gray-400 -scale-y-100" />}
              progressColor="bg-red-500/20 text-red-300"
              decorativeImage="https://i.imgur.com/m1mgZiw.png"
            />
            <StatCard
              title="Trade"
              value="$2760"
              details="Trading Days"
              progress={27.6}
              icon={<Image src="https://i.imgur.com/GKSBvL1.png" alt="" width={16} height={16} className="opacity-70"/>}
              progressColor="bg-purple-500/20 text-purple-300"
              decorativeImage="https://i.imgur.com/j4WmrLw.png"
            />
          </div>
          <RightSidebar />
        </div>
      </main>
    </div>
  );
}
