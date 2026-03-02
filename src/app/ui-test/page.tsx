
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
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';

const UserAvatar = ({ className }: { className?: string }) => (
  <div className={cn('relative h-16 w-16', className)}>
    <div className="absolute -inset-1 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full blur-md opacity-75"></div>
    <div className="relative h-16 w-16 flex items-center justify-center bg-slate-900 rounded-full border-2 border-white/10 overflow-hidden">
      <Image src="/bitmoji.png" alt="User Avatar" width={64} height={64} className="object-cover" />
    </div>
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
      'bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg',
      className
    )}
  >
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


const DashboardHeader = () => (
  <header className="flex items-center justify-between mb-8 z-20 relative">
    <div className="flex items-center gap-8">
        <Logo />
        <nav className="hidden md:flex items-center gap-1 bg-black/20 backdrop-blur-sm border border-white/10 p-1 rounded-full shadow-lg">
            <a href="#" className="px-4 py-1.5 text-sm font-medium bg-white/10 rounded-full text-white shadow-md">
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
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
        <Search className="h-5 w-5 text-gray-300" />
      </button>
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
        <Settings className="h-5 w-5 text-gray-300" />
      </button>
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
        <Bell className="h-5 w-5 text-gray-300" />
      </button>
      <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm border border-white/10 p-1 rounded-full shadow-lg">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-indigo-600 text-white">N</AvatarFallback>
        </Avatar>
        <div className="pr-2 hidden sm:block">
          <p className="text-sm font-semibold tracking-wide">Naimur Rahman</p>
          <p className="text-xs text-gray-400">naimurrahman@gmail.com</p>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block mr-1" />
      </div>
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 md:hidden transition-colors">
        <Menu className="h-5 w-5 text-gray-300" />
      </button>
    </div>
  </header>
);

const UserDetails = () => (
  <GlassCard className="p-6 md:p-8 relative h-full flex flex-col">
    <div className="relative z-10 flex-grow">
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
            <div className="shrink-0 border border-white/10 bg-black/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-mono text-gray-300 flex items-center gap-2">
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
    <GlassCard className="p-6 md:p-8 col-span-full relative">
        <div className="relative z-10">
            <h3 className="font-semibold mb-4 text-white tracking-wide">Account details</h3>
            <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
  <GlassCard className={cn("p-5 flex flex-col relative overflow-hidden", isPrimary && "bg-purple-600/10 border-purple-500/20")}>
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

const SupportCard = () => (
    <GlassCard className="p-6 text-center h-full flex flex-col justify-between">
        <div>
            <h3 className="font-semibold text-white tracking-wide text-lg">Xpertfunding Email Support</h3>
            <div className="my-6 flex justify-center">
                <div className="h-24 w-24 rounded-full bg-purple-500/10 flex items-center justify-center border-2 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                <Users className="h-10 w-10 text-purple-300" />
                </div>
            </div>
        </div>
        <div className="mt-6">
            <button className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400/50">
                Contact
            </button>
            <p className="mt-4 text-sm text-gray-400 hover:text-white cursor-pointer">support@xpertfunding.com</p>
        </div>
    </GlassCard>
);


export default function UITestPage() {
  return (
    <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-25%] left-[-25%] w-[60vw] h-[60vw] bg-purple-600 rounded-full filter blur-3xl opacity-30" />
        <div className="absolute bottom-[-25%] right-[-25%] w-[60vw] h-[60vw] bg-pink-600 rounded-full filter blur-3xl opacity-20" />
      </div>
      
      <main className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <DashboardHeader />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserDetails />
            <SupportCard />
        </div>
        
        <div className="mt-6">
            <AccountDetails />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Balance"
              value="$6,000"
              details="Balance"
              progress={60.0}
              icon={<DollarSign className="w-4 h-4 text-gray-400" />}
              progressColor="bg-purple-500/20 text-purple-300"
              decorativeImage="/a.png"
              isPrimary={true}
            />
             <StatCard
              title="Profit"
              value="$2034"
              details="Profit/Loss"
              progress={20.3}
              icon={<LineChart className="w-4 h-4 text-gray-400" />}
              progressColor="bg-green-500/20 text-green-300"
              decorativeImage="/b.png"
            />
            <StatCard
              title="Loss"
              value="$1326"
              details="Floating Loss"
              progress={13.2}
              icon={<LineChart className="w-4 h-4 text-gray-400 -scale-y-100" />}
              progressColor="bg-red-500/20 text-red-300"
              decorativeImage="/c.png"
            />
            <StatCard
              title="Trade"
              value="$2760"
              details="Trading Days"
              progress={27.6}
              icon={<Image src="https://i.imgur.com/GKSBvL1.png" alt="" width={16} height={16} className="opacity-70"/>}
              progressColor="bg-blue-500/20 text-blue-300"
              decorativeImage="/d.png"
            />
        </div>
      </main>
    </div>
  );
}
