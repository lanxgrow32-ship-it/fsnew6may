
'use client';

import { useState, useEffect, useActionState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Home, FileCheck, DollarSign, LogOut, BookUser, Gift, MessageSquare, Loader2, PlusCircle, Paperclip, BrainCircuit, Search, Settings, Bell, Menu, User } from 'lucide-react';
import { signOut } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { createTicket } from './actions';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


type Ticket = {
    id: number;
    created_at: string;
    subject: string;
    status: 'Open' | 'Closed';
    updated_at: string;
};

type Profile = {
    full_name: string;
    email: string;
}

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
                    <DropdownMenuItem onClick={() => router.push('/tickets')}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>Support</span>
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
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
        <Bell className="h-5 w-5 text-gray-300" />
      </button>
      <UserNav profile={profile} />
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 md:hidden transition-colors">
        <Menu className="h-5 w-5 text-gray-300" />
      </button>
    </div>
  </header>
);

function CreateTicketForm() {
    const ref = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [state, formAction] = useActionState(createTicket, { error: null });
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (state?.error) {
            toast({
                title: "Error Creating Ticket",
                description: state.error,
                variant: "destructive",
            });
        }
    }, [state, toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
        } else {
            setPreview(null);
        }
    };

    function SubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" disabled={pending} className="bg-purple-600 text-white hover:bg-purple-700">
                {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Ticket'}
            </Button>
        );
    }
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="bg-purple-600 text-white hover:bg-purple-700 shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400/50">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Ticket
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[475px]">
                 <form ref={ref} action={formAction} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>Create Support Ticket</DialogTitle>
                        <DialogDescription>
                            Describe your issue below. Our support team will get back to you shortly.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input id="subject" name="subject" placeholder="e.g., Issue with my account" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" placeholder="Please describe your issue in detail..." required rows={6}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="image">Attach Image (optional)</Label>
                            <Input id="image" name="image" type="file" accept="image/*" onChange={handleFileChange} />
                            {preview && (
                                <div className="mt-2">
                                    <Image src={preview} alt="Attachment preview" width={100} height={100} className="rounded-md object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


function TicketsTable({ tickets }: { tickets: Ticket[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow className="border-white/10">
                    <TableHead className="text-gray-300">Subject</TableHead>
                    <TableHead className="text-gray-300">Last Updated</TableHead>
                    <TableHead className="text-right text-gray-300">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tickets.length > 0 ? tickets.map((ticket) => (
                     <TableRow key={ticket.id} className="cursor-pointer border-white/10">
                         <TableCell>
                            <Link href={`/tickets/${ticket.id}`} className="font-medium block w-full text-white">
                                {ticket.subject}
                            </Link>
                         </TableCell>
                         <TableCell>
                            <Link href={`/tickets/${ticket.id}`} className="block w-full text-gray-400">
                                {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                            </Link>
                         </TableCell>
                         <TableCell className="text-right">
                             <Link href={`/tickets/${ticket.id}`} className="block w-full">
                                <Badge variant={ticket.status === 'Open' ? 'destructive' : 'secondary'} className={ticket.status === 'Open' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-green-500/20 text-green-300 border-green-500/30'}>
                                    {ticket.status}
                                </Badge>
                             </Link>
                         </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-gray-400">You haven't created any tickets yet.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

export default function UserTicketsPage() {
    const supabase = createClient();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            const [ticketsRes, profileRes] = await Promise.all([
                supabase.from('tickets').select('*').order('updated_at', { ascending: false }),
                supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
            ]);
            
            if (ticketsRes.error) console.error(ticketsRes.error);
            else setTickets(ticketsRes.data as Ticket[]);
            
            if (profileRes.data) setProfile(profileRes.data);
            
            setIsLoading(false);
        };
        fetchData();

        const channel = supabase.channel('realtime user tickets')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, 
                () => { fetchData() }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel) };

    }, [supabase, router]);

    const SkeletonTable = () => (
         <div className="space-y-4">
            <Skeleton className="h-10 w-full bg-white/10" />
            <Skeleton className="h-10 w-full bg-white/10" />
            <Skeleton className="h-10 w-full bg-white/10" />
         </div>
    );

    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-25%] left-[10%] w-[50vw] h-[50vw] bg-purple-600 rounded-full filter blur-3xl opacity-20 " />
                <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-pink-600 rounded-full filter blur-3xl opacity-10" />
            </div>
          
            <main className="relative z-10 p-4 sm:p-6 lg:p-8">
                <DashboardHeader profile={profile} activePage="Support" />
                 <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
                    <CreateTicketForm />
                 </div>
                 <div className="max-w-4xl mx-auto">
                    <GlassCard>
                         <CardHeader>
                            <CardTitle className="text-white">My Tickets</CardTitle>
                            <CardDescription className="text-gray-400">A list of your support tickets.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {isLoading ? <SkeletonTable /> : <TicketsTable tickets={tickets} />}
                        </CardContent>
                    </GlassCard>
               </div>
            </main>
        </div>
    );
}
