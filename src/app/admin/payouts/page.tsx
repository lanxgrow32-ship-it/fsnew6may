
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { updatePayoutStatus } from './actions';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FundedStockLogo } from '@/components/ui/logo';
import { Home, Ticket, Wallet, LogOut, Banknote, Loader2, Check, X, Copy } from 'lucide-react';
import { signOut } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type PayoutRequest = {
    id: number;
    created_at: string;
    amount: number;
    status: 'pending' | 'completed' | 'rejected';
    payout_details: { upi_id: string };
    processed_at: string | null;
    profiles: {
        full_name: string;
        email: string;
        payout_qr_code_url: string | null;
    }
};

function PayoutActions({ request, onStatusChange }: { request: PayoutRequest, onStatusChange: (id: number, status: 'completed' | 'rejected') => void }) {
    const [isPending, setIsPending] = useState(false);
    const { toast } = useToast();

    const handleAction = async (status: 'completed' | 'rejected') => {
        setIsPending(true);
        const result = await updatePayoutStatus(request.id, status);
        if (result.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: `Payout marked as ${status}` });
            onStatusChange(request.id, status);
        }
        setIsPending(false);
    }
    
    const handleRevert = async () => {
        setIsPending(true);
        const result = await updatePayoutStatus(request.id, 'pending');
         if (result.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: `Payout status reverted to pending` });
            onStatusChange(request.id, 'pending');
        }
        setIsPending(false);
    }

    if (request.status !== 'pending') {
        return (
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">Revert</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revert Payout Status?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will change the status of this payout request back to "pending". The user's balance will not be automatically refunded.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRevert}>Revert to Pending</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )
    }

    return (
        <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleAction('completed')} disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleAction('rejected')} disabled={isPending}>
                 {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            </Button>
        </div>
    )
}

function PayoutsTable({ requests, onStatusChange }: { requests: PayoutRequest[], onStatusChange: (id: number, status: 'completed' | 'rejected') => void }) {
    const { toast } = useToast();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'UPI ID copied to clipboard' });
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>UPI Details</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.length > 0 ? requests.map((req) => (
                    <TableRow key={req.id}>
                        <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                            <div className="font-medium">{req.profiles.full_name}</div>
                            <div className="text-muted-foreground text-sm">{req.profiles.email}</div>
                        </TableCell>
                        <TableCell className="font-bold">₹{req.amount.toFixed(2)}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <span>{req.payout_details?.upi_id}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(req.payout_details?.upi_id)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                        <TableCell>
                            {req.profiles.payout_qr_code_url ? (
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm">View QR</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="w-fit">
                                        <Image src={req.profiles.payout_qr_code_url} alt="Payout QR Code" width={300} height={300} />
                                    </AlertDialogContent>
                                </AlertDialog>
                            ) : (
                                <span className="text-muted-foreground">N/A</span>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                           <PayoutActions request={req} onStatusChange={onStatusChange} />
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">No requests found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

export default function PayoutsPage() {
    const supabase = createClient();
    const [requests, setRequests] = useState<PayoutRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('payout_requests')
            .select('*, profiles(full_name, email, payout_qr_code_url)')
            .order('created_at', { ascending: false });
        
        if (data) {
            setRequests(data as PayoutRequest[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRequests();

        const channel = supabase
            .channel('realtime payouts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payout_requests' }, 
                (payload) => { fetchRequests(); }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleStatusChange = (id: number, status: 'completed' | 'rejected' | 'pending') => {
        setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
        fetchRequests(); // Re-fetch to ensure data is sorted correctly by new status
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const completedRequests = requests.filter(r => r.status === 'completed');
    const rejectedRequests = requests.filter(r => r.status === 'rejected');
    
    const SkeletonTable = () => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-40" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                    <TableHead className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {[...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="border-b p-4 h-[57px] flex items-center">
                    <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg">
                        <FundedStockLogo className="w-8 h-8 text-primary" />
                        <span className="text-foreground group-[[data-state=collapsed]]:hidden">FundedStock</span>
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/dashboard" tooltip="Dashboard">
                                <Home />
                                Dashboard
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/coupons" tooltip="Coupons">
                                <Ticket />
                                Coupons
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/payouts" isActive tooltip="Payouts">
                                <Banknote />
                                Payouts
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/payment-settings" tooltip="Payment Settings">
                                <Wallet />
                                Payment Settings
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <form action={signOut} className="w-full">
                                <SidebarMenuButton tooltip="Logout" asChild>
                                    <button type="submit" className="w-full">
                                        <LogOut />
                                        Logout
                                    </button>
                                </SidebarMenuButton>
                            </form>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-xl font-semibold">Payout Requests</h1>
                    </div>
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
                    <Card>
                        <CardContent className="p-0">
                           <Tabs defaultValue="pending">
                                <TabsList className="p-2 h-auto rounded-none bg-muted w-full justify-start">
                                    <TabsTrigger value="pending">Pending <Badge className="ml-2">{pendingRequests.length}</Badge></TabsTrigger>
                                    <TabsTrigger value="completed">Completed <Badge variant="secondary" className="ml-2">{completedRequests.length}</Badge></TabsTrigger>
                                    <TabsTrigger value="rejected">Rejected <Badge variant="secondary" className="ml-2">{rejectedRequests.length}</Badge></TabsTrigger>
                                </TabsList>
                                <div className="p-4">
                                <TabsContent value="pending">
                                    {isLoading ? <SkeletonTable /> : <PayoutsTable requests={pendingRequests} onStatusChange={handleStatusChange} />}
                                </TabsContent>
                                <TabsContent value="completed">
                                    {isLoading ? <SkeletonTable /> : <PayoutsTable requests={completedRequests} onStatusChange={handleStatusChange} />}
                                </TabsContent>
                                <TabsContent value="rejected">
                                    {isLoading ? <SkeletonTable /> : <PayoutsTable requests={rejectedRequests} onStatusChange={handleStatusChange} />}
                                </TabsContent>
                                </div>
                           </Tabs>
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
