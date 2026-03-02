
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
  CandlestickChart,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// --- Reusable Glass Card Component ---
const GlassCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'bg-slate-900/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl shadow-lg',
      className
    )}
  >
    {children}
  </div>
);

// --- Header Component ---
const DashboardHeader = () => (
  <header className="flex items-center justify-between mb-8">
    <div className="flex items-center gap-8">
      <div className="bg-slate-800 h-10 w-10 flex items-center justify-center rounded-lg text-2xl font-bold border border-slate-700/50">
        N
      </div>
      <nav className="hidden md:flex items-center gap-1 bg-slate-900/50 border border-slate-700/50 p-1 rounded-full">
        <a
          href="#"
          className="px-4 py-1.5 text-sm font-medium bg-slate-700/80 rounded-full"
        >
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
      <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-700/50 transition-colors">
        <Search className="h-5 w-5" />
      </button>
      <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-700/50 transition-colors">
        <Settings className="h-5 w-5" />
      </button>
      <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-700/50 transition-colors">
        <Bell className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700/50 p-1 rounded-full">
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://avatar.vercel.sh/naimur.png" />
          <AvatarFallback>N</AvatarFallback>
        </Avatar>
        <div className="pr-2 hidden sm:block">
          <p className="text-sm font-semibold">Naimur Rahman</p>
          <p className="text-xs text-gray-400">naimurrahman@gmail.com</p>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block mr-1" />
      </div>
      <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-700/50 md:hidden transition-colors">
        <Menu className="h-5 w-5" />
      </button>
    </div>
  </header>
);

// --- User Info & Cycle Details ---
const UserDetails = () => (
  <GlassCard className="p-6 col-span-1 md:col-span-2 relative overflow-hidden">
     <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.15),transparent_50%)]"></div>
    <div className="relative">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-slate-700">
                <AvatarImage src="https://avatar.vercel.sh/naimur.png" />
                <AvatarFallback>N</AvatarFallback>
                </Avatar>
                <div>
                <h2 className="text-xl font-bold text-white">Naimur Rahman</h2>
                <p className="text-sm text-gray-400">
                    Currently, you have an evaluation account
                </p>
                </div>
            </div>
            <div className="shrink-0 border border-slate-700/50 bg-slate-900/50 rounded-full px-4 py-1.5 text-sm font-mono">
                78748803
            </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div>
                    <p className="text-xs text-gray-400">Initial Balance</p>
                    <p className="font-semibold text-white">$6,000</p>
                </div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 13.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/><path d="M12 5.25v1.5m0 10.5v1.5m-6.75-5.25h1.5m10.5 0h1.5"/></svg>
                <div>
                    <p className="text-xs text-gray-400">Plan Type</p>
                    <p className="font-semibold text-white">6k</p>
                </div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M21 12.2c0-5.5-4-10-9-10-5 0-9 4.5-9 10 0 5.5 4 10 9 10 3 0 5.5-1.5 7-4"/><path d="M18 10h5V5m0 5-6-6"/></svg>
                <div>
                    <p className="text-xs text-gray-400">Account Type</p>
                    <p className="font-semibold text-white">Swap</p>
                </div>
            </div>
        </div>

        <div className="mt-8">
        <h3 className="font-semibold flex items-center gap-2 mb-3 text-white">
            <Calendar className="w-5 h-5 text-purple-400" />
            Trading Cycle Details
        </h3>
        <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-slate-900/50 p-3 rounded-lg">
            <p className="text-xs text-gray-400">Start Date</p>
            <p className="font-semibold text-white">Apr 15, 2025</p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg">
            <p className="text-xs text-gray-400">End Date</p>
            <p className="font-semibold text-white">Apr 28, 2025</p>
            </div>
        </div>
        </div>
    </div>
  </GlassCard>
);

// --- Account Details Card ---
const AccountDetails = () => {
  const [isPassVisible, setIsPassVisible] = useState(false);
  return (
    <GlassCard className="p-6 col-span-1 md:col-span-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.15),transparent_50%)]"></div>
        <div className="relative">
            <h3 className="font-semibold mb-3 text-white">Account details</h3>
            <div className="space-y-3">
                <div className="bg-slate-900/50 p-3 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-400">Log in</p>
                        <p className="font-semibold font-mono text-white">78748803</p>
                    </div>
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M15 4h5v5"/><path d="M10 14 20 4"/></svg>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-400">MT5 Server</p>
                    <p className="font-semibold text-white">FundedNext-Server4</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-xs text-gray-400">Investor Pass</p>
                        <button className="text-sm font-semibold text-purple-400 hover:underline">
                            Set Password
                        </button>
                    </div>
                     <div className="bg-slate-900/50 p-3 rounded-lg">
                        <p className="text-xs text-gray-400">Master Pass</p>
                        <div className="flex items-center justify-between">
                            <p className="font-semibold font-mono text-white">
                            {isPassVisible ? 'YourPassword123' : '••••••••'}
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

// --- Stat Card Component ---
const StatCard = ({
  title,
  value,
  icon,
  details,
  progress,
  progressColor,
  decorativeIcon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  details: string;
  progress: number;
  progressColor: string;
  decorativeIcon: React.ReactNode;
}) => (
  <GlassCard className={cn('p-4 flex flex-col relative overflow-hidden')}>
    <div className="absolute bottom-0 right-0 text-white/5 opacity-50 -mr-4 -mb-4">
        {decorativeIcon}
    </div>
    <div className="flex items-start justify-between text-gray-400">
      <div className="flex items-center gap-2">
         {icon}
        <p className="text-sm text-white">{title}</p>
      </div>
    </div>
    <div className="mt-2">
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400">{details}</p>
    </div>
    <div className="mt-auto pt-4">
      <div className="flex items-center gap-2">
        <div className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", progressColor)}>
          {progress.toFixed(1)}%
        </div>
      </div>
    </div>
  </GlassCard>
);

// --- Right Sidebar Component ---
const RightSidebar = () => (
  <div className="col-span-1 md:col-span-4 lg:col-span-1 space-y-6">
    <GlassCard className="p-6 text-center">
      <h3 className="font-semibold text-white">Xpertfunding Email Support</h3>
      <div className="my-6 flex justify-center">
        <div className="h-24 w-24 rounded-full bg-purple-500/10 flex items-center justify-center border-2 border-purple-500/50">
          <Users className="h-12 w-12 text-purple-400" />
        </div>
      </div>
      <button className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-[0_0_20px_rgba(168,85,247,0.5)]">
        Contact
      </button>
      <p className="mt-4 text-sm text-gray-400">support@xpertfunding.com</p>
    </GlassCard>
    <GlassCard className="p-6 text-center">
      <p className="text-sm text-gray-400">Today's permitted loss will reset in</p>
      <p className="text-4xl font-mono font-bold my-4 text-white">07:14:45</p>
      <p className="text-xs text-gray-500">Countdown Timezone: GMT+3</p>
    </GlassCard>
  </div>
);

// --- Main Page Component ---
export default function UITestPage() {
  return (
    <div className="dark min-h-screen bg-[#0D0E12] text-gray-200 font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(168,85,247,0.2),transparent)]"></div>
        <div
          className="absolute inset-0 bg-repeat opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(to right, #1a1b2d 1px, transparent 1px), linear-gradient(to bottom, #1a1b2d 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        ></div>
      </div>

      <main className="relative z-10 p-4 sm:p-6 lg:p-8">
        <DashboardHeader />

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-3 gap-6">
          {/* Main content grid */}
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
              decorativeIcon={<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8z"/><path d="M12 10.5A1.5 1.5 0 0 0 10.5 12H10a2 2 0 0 0 4 0h-1.5a.5.5 0 0 1-1-1V9a.5.5 0 0 1 1-1h1a2 2 0 0 0-4 0v1.5a1.5 1.5 0 0 0 1.5 1.5H14a2 2 0 0 0-4 0V15a.5.5 0 0 1-1 1H8a2 2 0 0 0 4 0v-1.5A1.5 1.5 0 0 0 10.5 12H8a2 2 0 0 0 4 0z"/></svg>}
            />
             <StatCard
              title="Profit"
              value="$2034"
              details="Profit/Loss"
              progress={20.3}
              icon={<LineChart className="w-4 h-4 text-gray-400" />}
              progressColor="bg-purple-500/20 text-purple-300"
              decorativeIcon={<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4 11h-3v3a1 1 0 0 1-2 0v-3H8a1 1 0 0 1 0-2h3V8a1 1 0 0 1 2 0v3h3a1 1 0 0 1 0 2z"/></svg>}
            />
            <StatCard
              title="Loss"
              value="$1326"
              details="Floating Loss"
              progress={13.2}
              icon={<LineChart className="w-4 h-4 text-gray-400 -scale-y-100" />}
              progressColor="bg-red-500/20 text-red-300"
              decorativeIcon={<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17h18v2H3zm3-7h12v2H6zm3-7h6v2H9z"/></svg>}
            />
            <StatCard
              title="Trade"
              value="$2760"
              details="Trading Days"
              progress={27.6}
              icon={<CandlestickChart className="w-4 h-4 text-gray-400" />}
              progressColor="bg-purple-500/20 text-purple-300"
              decorativeIcon={<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="currentColor"><path d="M4 11h3v10H4zm5 0h3v10H9zm5 0h3v10h-3zm5-7h3v17h-3z"/></svg>}
            />
          </div>

          <RightSidebar />
        </div>
      </main>
    </div>
  );
}


    