
'use client';

import { useState } from 'react';
import {
  ArrowLeftRight,
  Bell,
  Bitcoin,
  Calendar,
  ChevronDown,
  DollarSign,
  Eye,
  EyeOff,
  LayoutGrid,
  LineChart,
  Menu,
  Search,
  Sprout,
  Trophy,
  Users,
  Wallet,
  Settings,
  CandlestickChart,
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
      'bg-slate-800/20 backdrop-blur-lg border border-slate-700/50 rounded-2xl shadow-lg',
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
      <div className="bg-primary/80 h-10 w-10 flex items-center justify-center rounded-full text-2xl font-bold">
        N
      </div>
      <nav className="hidden md:flex items-center gap-1 bg-slate-800/20 border border-slate-700/50 p-1 rounded-full">
        <a
          href="#"
          className="px-4 py-1.5 text-sm font-medium bg-slate-700/50 rounded-full"
        >
          Account Overview
        </a>
        <a href="#" className="px-4 py-1.5 text-sm text-gray-400">
          Trading Overview
        </a>
        <a href="#" className="px-4 py-1.5 text-sm text-gray-400">
          Transactions
        </a>
        <a href="#" className="px-4 py-1.5 text-sm text-gray-400">
          Competition
        </a>
      </nav>
    </div>
    <div className="flex items-center gap-2">
      <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-700/50">
        <Search className="h-5 w-5" />
      </button>
      <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-700/50">
        <Settings className="h-5 w-5" />
      </button>
      <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-700/50">
        <Bell className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2 bg-slate-800/20 border border-slate-700/50 p-1 rounded-full">
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://avatar.vercel.sh/naimur.png" />
          <AvatarFallback>N</AvatarFallback>
        </Avatar>
        <div className="pr-2 hidden sm:block">
          <p className="text-sm font-semibold">Naimur Rahman</p>
          <p className="text-xs text-gray-400">naimurrahman@gmail.com</p>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
      </div>
      <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-700/50 md:hidden">
        <Menu className="h-5 w-5" />
      </button>
    </div>
  </header>
);

// --- User Info & Cycle Details ---
const UserDetails = () => (
  <GlassCard className="p-6 col-span-1 md:col-span-2">
    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src="https://avatar.vercel.sh/naimur.png" />
          <AvatarFallback>N</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">Naimur Rahman</h2>
          <p className="text-sm text-gray-400">
            Currently, you have an evaluation account
          </p>
        </div>
      </div>
      <div className="shrink-0 border border-slate-700/50 bg-slate-800/20 rounded-full px-4 py-1.5 text-sm font-mono">
        78748803
      </div>
    </div>

    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
      <div className="bg-slate-900/30 p-3 rounded-lg">
        <p className="text-xs text-gray-400">Initial Balance</p>
        <p className="font-semibold">$6,000</p>
      </div>
      <div className="bg-slate-900/30 p-3 rounded-lg">
        <p className="text-xs text-gray-400">Plan Type</p>
        <p className="font-semibold">6k</p>
      </div>
      <div className="bg-slate-900/30 p-3 rounded-lg col-span-2 md:col-span-1">
        <p className="text-xs text-gray-400">Account Type</p>
        <p className="font-semibold">Swap</p>
      </div>
    </div>

    <div className="mt-8">
      <h3 className="font-semibold flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        Trading Cycle Details
      </h3>
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-slate-900/30 p-3 rounded-lg">
          <p className="text-xs text-gray-400">Start Date</p>
          <p className="font-semibold">Apr 15, 2025</p>
        </div>
        <div className="bg-slate-900/30 p-3 rounded-lg opacity-50">
          <p className="text-xs text-gray-400">End Date</p>
          <p className="font-semibold">Not Applicable</p>
        </div>
      </div>
    </div>
  </GlassCard>
);

// --- Account Details Card ---
const AccountDetails = () => {
  const [isPassVisible, setIsPassVisible] = useState(false);
  return (
    <GlassCard className="p-6 col-span-1 md:col-span-2">
      <h3 className="font-semibold mb-4">Account Details</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900/30 p-3 rounded-lg">
          <p className="text-xs text-gray-400">Log in</p>
          <p className="font-semibold font-mono">78748803</p>
        </div>
        <div className="bg-slate-900/30 p-3 rounded-lg">
          <p className="text-xs text-gray-400">MT5 Server</p>
          <p className="font-semibold">FundedNext-Server4</p>
        </div>
        <div className="bg-slate-900/30 p-3 rounded-lg">
          <p className="text-xs text-gray-400">Investor Pass</p>
          <button className="text-sm font-semibold text-primary hover:underline">
            Set Password
          </button>
        </div>
        <div className="bg-slate-900/30 p-3 rounded-lg">
          <p className="text-xs text-gray-400">Trading Password</p>
          <div className="flex items-center justify-between">
            <p className="font-semibold font-mono">
              {isPassVisible ? 'YourPassword123' : '••••••••••••'}
            </p>
            <button onClick={() => setIsPassVisible(!isPassVisible)}>
              {isPassVisible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
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
  color,
  children,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  details: string;
  progress: number;
  color: string;
  children?: React.ReactNode;
}) => (
  <GlassCard className={cn('p-4 flex flex-col', color)}>
    <div className="flex items-center justify-between text-gray-400">
      <p className="text-sm">{title}</p>
      {icon}
    </div>
    <div className="mt-2">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-gray-400">{details}</p>
    </div>
    <div className="mt-auto pt-4">
      {children}
      <div className="flex items-center gap-2 mt-2">
        <Progress value={progress} className="h-1.5" />
        <span className="text-xs font-semibold">{progress}%</span>
      </div>
    </div>
  </GlassCard>
);

// --- Right Sidebar Component ---
const RightSidebar = () => (
  <div className="col-span-1 md:col-span-4 lg:col-span-1 space-y-6">
    <GlassCard className="p-6 text-center">
      <h3 className="font-semibold">FundedStock Email Support</h3>
      <div className="my-6 flex justify-center">
        <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
          <Users className="h-12 w-12 text-primary" />
        </div>
      </div>
      <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
        Contact
      </button>
      <p className="mt-4 text-sm text-gray-400">support@fundedstock.com</p>
    </GlassCard>
    <GlassCard className="p-6 text-center">
      <p className="text-sm text-gray-400">Today's permitted loss will reset in</p>
      <p className="text-4xl font-mono font-bold my-4">07:14:45</p>
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
        <div className="absolute top-0 left-0 h-96 w-full bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div
          className="absolute inset-0 bg-repeat"
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
              progress={60}
              icon={<DollarSign className="w-5 h-5" />}
              color="border-sky-500/50"
            >
              <Bitcoin className="w-16 h-16 text-yellow-500/20 absolute bottom-4 right-4" />
            </StatCard>
            <StatCard
              title="Profit"
              value="$2034"
              details="Profit/Loss"
              progress={20.34}
              icon={<Wallet className="w-5 h-5" />}
              color="border-green-500/50"
            >
              <Sprout className="w-16 h-16 text-green-500/20 absolute bottom-4 right-4" />
            </StatCard>
            <StatCard
              title="Loss"
              value="$1326"
              details="Floating Loss"
              progress={13.26}
              icon={<LineChart className="w-5 h-5" />}
              color="border-red-500/50"
            >
              <LineChart className="w-16 h-16 text-red-500/20 absolute bottom-4 right-4" />
            </StatCard>
            <StatCard
              title="Trade"
              value="$2760"
              details="Trading Days"
              progress={27.6}
              icon={<CandlestickChart className="w-5 h-5" />}
              color="border-primary/50"
            >
              <CandlestickChart className="w-16 h-16 text-primary/20 absolute bottom-4 right-4" />
            </StatCard>
          </div>

          <RightSidebar />
        </div>
      </main>
    </div>
  );
}
