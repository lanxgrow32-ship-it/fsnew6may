'use client';

import { useState, useActionState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Wallet, 
    Trophy, 
    FileCheck, 
    LogOut, 
    Menu,
    History,
    MessageSquare,
    User,
    Users,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { changePassword } from './actions';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg', className)}>
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
    { id: 'referrals', href: "/referrals", label: "Referrals", icon: Users },
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

function ResetPasswordForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [state, formAction] = useActionState(changePassword, { error: null, success: null });

    function SubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" disabled={pending} className="bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400/50">
                {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 'Update Password'}
            </Button>
        );
    }

    return (
        <GlassCard>
            <form action={formAction} ref={formRef}>
                <CardHeader>
                    <CardTitle className="text-white">Reset Password</CardTitle>
                    <CardDescription className="text-gray-400">Enter a new password for your account below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input id="password" name="password" type="password" required className="bg-black/20 border-white/10 text-white" />
                        <p className="text-xs text-gray-400">Must be at least 6 characters long.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirm New Password</Label>
                        <Input id="confirm_password" name="confirm_password" type="password" required className="bg-black/20 border-white/10 text-white" />
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </form>
        </GlassCard>
    );
}

export function ProfileClient({ initialProfile }: { initialProfile: any }) {
    const [profile] = useState(initialProfile);

    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-25%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600 rounded-full filter blur-3xl opacity-20 " />
                <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-pink-600 rounded-full filter blur-3xl opacity-10" />
            </div>
          
            <main className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <DashboardHeader profile={profile} activePage="My Profile" />
                <div className="max-w-2xl mx-auto space-y-6">
                    <GlassCard>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-white">Profile Information</CardTitle>
                            <CardDescription className="text-gray-400">This is your account information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-20 w-20 border-2 border-white/10">
                                    <AvatarImage src={`https://avatar.vercel.sh/${profile.email}.png`} alt={profile.full_name || ''} />
                                    <AvatarFallback className="bg-slate-800">{profile.full_name?.[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold text-white">{profile.full_name}</h2>
                                    <p className="text-gray-400">{profile.email}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" value={profile.full_name || ''} readOnly className="bg-black/20 border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" type="email" value={profile.email || ''} readOnly className="bg-black/20 border-white/10 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </GlassCard>
                    <ResetPasswordForm />
               </div>
            </main>
        </div>
    )
}
