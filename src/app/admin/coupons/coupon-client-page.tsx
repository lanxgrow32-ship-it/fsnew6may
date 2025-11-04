
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCoupon } from './actions';
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
        <Card className="shadow-md">
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
        <Card className="shadow-md">
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


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
        {pending ? 'Creating...' : 'Create Coupon'}
    </Button>
  );
}


export function CouponClientPage({ coupons }: { coupons: Coupon[] }) {
  return (
    <main className="p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-md">
             <ClientOnly fallback={<CreateCouponFormSkeleton />}>
                <CreateCouponForm />
            </ClientOnly>
        </div>
    </main>
  );
}
