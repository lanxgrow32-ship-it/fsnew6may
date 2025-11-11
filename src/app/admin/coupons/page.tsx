
'use client';

import { useState, useEffect, useRef, useActionState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { createCoupon, deleteCoupon } from './actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Home, Ticket, Wallet, LogOut, Banknote } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { ClientOnly } from '@/components/ui/client-only';
import { Skeleton } from '@/components/ui/skeleton';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';

type Coupon = {
  id: number;
  code: string;
  discount_value: number;
  created_at: string;
};

function CreateCouponForm() {
    const ref = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [state, formAction] = useActionState(createCoupon, { error: null, success: false });

    useEffect(() => {
        if (state.error) {
            toast({
                title: "Error Creating Coupon",
                description: state.error,
                variant: "destructive",
            });
        }
        if (state.success) {
            toast({
                title: "Success",
                description: "Coupon created successfully.",
            });
            ref.current?.reset();
        }
    }, [state, toast]);

    function SubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" disabled={pending} className="w-full">
                {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Coupon'}
            </Button>
        );
    }

    return (
        <form ref={ref} action={formAction}>
            <Card>
                <CardHeader>
                    <CardTitle>Create New Coupon</CardTitle>
                    <CardDescription>Add a new promotional code with a percentage discount.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Coupon Code</Label>
                        <Input id="code" name="code" placeholder="e.g. SAVE10" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="discount_value">Discount Percentage (%)</Label>
                        <Input id="discount_value" name="discount_value" type="number" step="1" min="1" max="100" placeholder="e.g. 10" required />
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </Card>
        </form>
    )
}

function ActiveCouponsList({ coupons, onCouponDelete }: { coupons: Coupon[], onCouponDelete: (id: number) => void }) {
    const [isPending, setIsPending] = useState(false);
    const { toast } = useToast();

    const handleDelete = async (couponId: number) => {
        setIsPending(true);
        try {
            await deleteCoupon(couponId);
            onCouponDelete(couponId);
            toast({ title: "Coupon deleted successfully" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsPending(false);
        }
    }
    
    function DeleteButton({ coupon, isPending }: { coupon: Coupon, isPending: boolean }) {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the coupon <span className="font-bold">{coupon.code}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                  <Button onClick={() => handleDelete(coupon.id)} className="bg-destructive hover:bg-destructive/90">
                      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete'}
                  </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    }

    // Mobile Card View
    const MobileCouponCard = ({ coupon }: { coupon: Coupon }) => (
        <Card className="mb-4">
            <CardContent className="p-4 flex justify-between items-center">
                <div className="space-y-1">
                    <p className="font-bold text-lg">{coupon.code}</p>
                    <p className="text-muted-foreground">{coupon.discount_value}% Discount</p>
                    <p className="text-xs text-muted-foreground">
                        Created: {new Date(coupon.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div>
                     <DeleteButton coupon={coupon} isPending={isPending} />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Coupons</CardTitle>
                <CardDescription>A list of all currently available coupons.</CardDescription>
            </CardHeader>
            <CardContent>
                {!coupons || coupons.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No active coupons found.</p>
                ) : (
                    <>
                        {/* Mobile View */}
                        <div className="md:hidden">
                            {coupons.map((coupon) => <MobileCouponCard key={coupon.id} coupon={coupon} />)}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Discount</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {coupons.map((coupon) => (
                                        <TableRow key={coupon.id}>
                                            <TableCell className="font-medium">{coupon.code}</TableCell>
                                            <TableCell>{coupon.discount_value}%</TableCell>
                                            <TableCell>{new Date(coupon.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                               <DeleteButton coupon={coupon} isPending={isPending} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

function ActiveCouponsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    )
}

export default function CouponsPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCoupons = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
        if (error) {
            toast({ title: "Error fetching coupons", description: error.message, variant: "destructive" });
        } else {
            setCoupons(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCoupons();

        const channel = supabase
            .channel('realtime coupons')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, (payload) => {
                fetchCoupons();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);
    
    const handleCouponDelete = (deletedCouponId: number) => {
        setCoupons(prev => prev.filter(c => c.id !== deletedCouponId));
    };

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
                    <SidebarMenuButton href="/admin/coupons" isActive tooltip="Coupons">
                        <Ticket />
                        Coupons
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/admin/payouts" tooltip="Payouts">
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
                        <h1 className="text-xl font-semibold">Coupon Management</h1>
                    </div>
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
                    <ClientOnly>
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                           <div className="lg:col-span-1">
                               <CreateCouponForm />
                           </div>
                           <div className="lg:col-span-2">
                                {isLoading ? (
                                    <ActiveCouponsSkeleton />
                                ) : (
                                    <ActiveCouponsList coupons={coupons} onCouponDelete={handleCouponDelete} />
                                )}
                           </div>
                       </div>
                   </ClientOnly>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

    
