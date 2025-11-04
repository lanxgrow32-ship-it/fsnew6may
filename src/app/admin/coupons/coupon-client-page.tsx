
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCoupon, deleteCoupon } from './actions';
import { useFormStatus } from 'react-dom';
import { useEffect, useRef, useActionState, useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ClientOnly } from '@/components/ui/client-only';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Trash2 } from 'lucide-react';

type Coupon = {
  id: number;
  code: string;
  discount_value: number;
  created_at: string;
};

function CreateCouponForm() {
    const ref = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const router = useRouter();

    const [state, formAction] = useActionState(createCoupon, { error: null, success: false });

    useEffect(() => {
        if (state.error) {
            toast({
                title: "Error",
                description: state.error,
                variant: "destructive",
            });
        }
        if (state.success) {
            toast({
                title: "Coupon Created",
                description: "The new coupon has been added.",
            });
            ref.current?.reset();
            router.refresh();
        }
    }, [state, toast, router]);

    return (
        <Card>
            <form ref={ref} action={formAction}>
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
                        <Input id="discount_value" name="discount_value" type="number" step="0.01" min="1" max="100" placeholder="e.g. 10" required />
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </form>
        </Card>
    );
}

function CreateCouponFormSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-28" />
            </CardFooter>
        </Card>
    );
}

function ActiveCoupons({ coupons }: { coupons: Coupon[] }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleDelete = (couponId: number) => {
        startTransition(async () => {
            const result = await deleteCoupon(couponId);
            if (result.error) {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                });
            } else {
                 toast({
                    title: "Coupon Deleted",
                    description: "The coupon has been successfully removed.",
                });
            }
        });
    }

    if (!coupons || coupons.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Active Coupons</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No active coupons found.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Coupons</CardTitle>
                <CardDescription>A list of all currently available coupons.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
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
                                                    <AlertDialogAction onClick={() => handleDelete(coupon.id)} className="bg-destructive hover:bg-destructive/90">
                                                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
        {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Coupon'}
    </Button>
  );
}


export function CouponClientPage({ coupons }: { coupons: Coupon[] }) {
  return (
    <main className="p-4 md:p-8">
        <div className="grid gap-8 lg:grid-cols-2">
             <ClientOnly fallback={<CreateCouponFormSkeleton />}>
                <CreateCouponForm />
            </ClientOnly>
            <ClientOnly fallback={<Skeleton className='h-64 w-full' />}>
                <ActiveCoupons coupons={coupons} />
            </ClientOnly>
        </div>
    </main>
  );
}
