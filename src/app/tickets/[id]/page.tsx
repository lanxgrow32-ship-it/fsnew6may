
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Send, Paperclip, Search, Settings, Bell, User, FileCheck, MessageSquare, LogOut, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addReply } from '../actions';
import { signOut } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


type Reply = {
    author: string;
    author_role: 'admin' | 'user';
    message: string;
    created_at: string;
    image_url?: string;
};

type Ticket = {
  id: number;
  subject: string;
  description: string;
  image_url?: string;
  status: 'Open' | 'Closed';
  created_at: string;
  replies: Reply[];
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

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { id } = use(params);

  useEffect(() => {
    if (!id) return;
    
    const fetchTicket = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          router.push('/login');
          return;
      }
      
      const { data: profileData } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
      if (profileData) setProfile(profileData);

      const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', id)
          .single();
      
      if (error) {
          setError('Failed to fetch ticket. You may not have permission to view it.');
          console.error(error);
      } else {
          setTicket(data as Ticket);
      }
      setIsFetching(false);
    }

    fetchTicket();

    const channel = supabase.channel(`ticket_${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${id}` }, 
        (payload) => { setTicket(payload.new as Ticket) }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel) };

  }, [id, supabase, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAttachment(file);
    if (file) {
        setPreview(URL.createObjectURL(file));
    } else {
        setPreview(null);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reply.trim() && !attachment) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('reply', reply);
    if (attachment) {
        formData.append('image', attachment);
    }

    const result = await addReply(ticket!.id, formData);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      setReply('');
      setAttachment(null);
      setPreview(null);
      (e.target as HTMLFormElement).reset(); // Reset file input
      toast({ title: 'Reply sent' });
    }
    setIsLoading(false);
  };
  
  const MessageImage = ({ src, alt }: { src: string, alt: string }) => (
    <div className="mt-2">
        <a href={src} target="_blank" rel="noopener noreferrer">
            <Image src={src} alt={alt} width={200} height={200} className="rounded-md object-cover"/>
        </a>
    </div>
  );

  const ReplyCard = ({ reply }: { reply: Reply }) => (
    <div className={`flex items-start gap-4 ${reply.author_role === 'user' ? 'justify-end' : ''}`}>
        {reply.author_role === 'admin' && (
            <Avatar className="h-8 w-8 border">
                <AvatarFallback>A</AvatarFallback>
            </Avatar>
        )}
        <div className={`max-w-xl rounded-lg p-3 ${reply.author_role === 'user' ? 'bg-purple-600' : 'bg-slate-800'}`}>
            <p className="text-sm whitespace-pre-wrap text-white">{reply.message}</p>
            {reply.image_url && <MessageImage src={reply.image_url} alt="Reply attachment" />}
            <p className={`text-xs mt-2 ${reply.author_role === 'user' ? 'text-purple-200' : 'text-gray-400'}`}>
                {reply.author} • {format(new Date(reply.created_at), 'MMM d, h:mm a')}
            </p>
        </div>
         {reply.author_role === 'user' && (
            <Avatar className="h-8 w-8 border">
                <AvatarFallback>{reply.author?.[0]}</AvatarFallback>
            </Avatar>
        )}
    </div>
  )

  if (isFetching) {
    return <div className="dark min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (error || !ticket) {
     return <div className="dark min-h-screen bg-slate-950 flex items-center justify-center p-4"><Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error || 'Ticket not found.'}</AlertDescription></Alert></div>
  }

  return (
    <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute inset-0 z-0">
            <div className="absolute top-[-25%] left-[10%] w-[50vw] h-[50vw] bg-purple-600 rounded-full filter blur-3xl opacity-20 " />
            <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-pink-600 rounded-full filter blur-3xl opacity-10" />
        </div>
        <main className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <DashboardHeader profile={profile} activePage="Support" />
            <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild className="bg-black/20 border-white/10 text-white hover:bg-white/20">
                        <Link href="/tickets">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-semibold text-white">{ticket.subject}</h1>
                </div>
                <Badge variant={ticket.status === 'Open' ? 'destructive' : 'secondary'} className={ticket.status === 'Open' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-green-500/20 text-green-300 border-green-500/30'}>{ticket.status}</Badge>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-6">
                 <GlassCard>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-start gap-4 justify-end">
                            <div className="w-full rounded-lg p-3 bg-purple-600 text-white">
                                <p className="text-sm font-semibold">{ticket.subject}</p>
                                <p className="text-sm whitespace-pre-wrap mt-2">{ticket.description}</p>
                                {ticket.image_url && <MessageImage src={ticket.image_url} alt="Ticket attachment" />}
                                <p className="text-xs text-purple-200 mt-2">
                                    You • {format(new Date(ticket.created_at), 'MMM d, h:mm a')}
                                </p>
                            </div>
                            <Avatar className="h-8 w-8 border">
                                <AvatarFallback>Y</AvatarFallback>
                            </Avatar>
                        </div>

                       {ticket.replies.map((reply, index) => (
                           <ReplyCard key={index} reply={reply} />
                       ))}
                    </CardContent>
                </GlassCard>
                
                {ticket.status === 'Open' && (
                    <GlassCard>
                        <CardContent className="p-6">
                             <form onSubmit={handleReplySubmit} className="space-y-4">
                                <Textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder="Type your response here..."
                                    rows={5}
                                    className="bg-black/20 border-white/10 text-white"
                                />
                                <div className="space-y-2">
                                    <Label htmlFor="image-upload" className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                                        <Paperclip className="w-4 h-4"/>
                                        Attach an image (optional)
                                    </Label>
                                    <Input id="image-upload" name="image" type="file" accept="image/*" onChange={handleFileChange} className="sr-only"/>
                                    {preview && (
                                        <div className="relative w-24 h-24">
                                            <Image src={preview} alt="Preview" layout="fill" className="object-cover rounded-md"/>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isLoading || (!reply.trim() && !attachment)} className="bg-purple-600 text-white hover:bg-purple-700">
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Reply
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </GlassCard>
                )}
            </div>
        </main>
    </div>
  );
}
