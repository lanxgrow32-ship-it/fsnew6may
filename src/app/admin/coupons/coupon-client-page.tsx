
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { createCoupon, deleteCoupon } from './actions';
import { useFormStatus } from 'react-dom';
import { useEffect, useRef, useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ClientOnly } from '@/components/ui/client-only';
import { Skeleton } from '@/components/ui/skeleton';

type Coupon = {
  id: number;
  code: string;
  discount_value: number;
  created_at: string;
};

function DeleteButton({ couponId }: { couponId: number }) {
  const deleteCouponWithId = deleteCoupon.bind(null, couponId);
  const router = useRouter();

  const handleDelete = async () => {
    await deleteCouponWithId();
    router.refresh();
  }

  return (
    <form action={handleDelete}>
      <Button variant="destructive" size="icon">
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  )
}

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
                    <CardDescription>Add a new promotional code.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Coupon Code</Label>
                        <Input id="code" name="code" placeholder="e.g. SAVE100" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="discount_value">Discount Value (₹)</Label>
                        <Input id="discount_value" name="discount_value" type="number" step="0.01" placeholder="e.g. 100.00" required />
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
                <CardTitle>Create New Coupon</CardTitle>
                <CardDescription>Add a new promotional code.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="code">Coupon Code</Label>
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="discount_value">Discount Value (₹)</Label>
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-28" />
            </CardFooter>
        </Card>
    );
}


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create Coupon'}
    </Button>
  );
}


export function CouponClientPage({ coupons }: { coupons: Coupon[] }) {
  return (
    <main className="p-4 md:p-8 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Active Coupons</CardTitle>
                    <CardDescription>A list of all available coupons.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Discount Value (₹)</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coupons?.map((coupon) => (
                                <TableRow key={coupon.id}>
                                    <TableCell className="font-medium">{coupon.code}</TableCell>
                                    <TableCell>₹{coupon.discount_value}</TableCell>
                                    <TableCell>{new Date(coupon.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <DeleteButton couponId={coupon.id} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {coupons?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">No coupons found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <div>
             <ClientOnly fallback={<CreateCouponFormSkeleton />}>
                <CreateCouponForm />
            </ClientOnly>
        </div>
    </main>
  );
}
