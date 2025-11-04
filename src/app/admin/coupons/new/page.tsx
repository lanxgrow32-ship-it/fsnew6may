
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCoupon } from '../actions';
import { useFormStatus } from 'react-dom';
import { useEffect, useRef, useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
        {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Coupon'}
    </Button>
  );
}

export default function NewCouponPage() {
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
    }, [state, toast]);

    return (
        <div className="bg-muted/40 min-h-screen">
            <header className="flex h-14 items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/admin/coupons">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-semibold">Create New Coupon</h1>
                </div>
            </header>
            <main className="p-4 md:p-8">
                <div className="max-w-xl mx-auto">
                    <form ref={ref} action={formAction}>
                        <Card>
                            <CardHeader>
                                <CardTitle>New Coupon Details</CardTitle>
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
                            <CardFooter className="flex justify-end gap-2">
                                <Button variant="outline" asChild>
                                    <Link href="/admin/coupons">Cancel</Link>
                                </Button>
                                <SubmitButton />
                            </CardFooter>
                        </Card>
                    </form>
                </div>
            </main>
        </div>
    );
}
