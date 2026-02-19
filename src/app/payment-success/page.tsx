
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

async function approvePayment(orderId: string | undefined, transactionId: string | undefined) {
    if (!orderId || !transactionId) {
        return { success: false, message: 'Missing payment information in URL. Please contact support.' };
    }
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ is_approved: true, transaction_id: transactionId })
            .eq('id', orderId)
            .select('id')
            .single();

        if (error) {
            console.error('Direct payment approval DB error:', error);
            // Don't expose detailed DB errors to the user.
            return { success: false, message: 'A database error occurred while trying to approve your account. Please contact support.' };
        }

        if (!data) {
             return { success: false, message: 'We received your payment, but could not find a matching order to approve. Please contact support.' };
        }

        revalidatePath('/welcome', 'page');
        revalidatePath('/admin/dashboard', 'page');
        revalidatePath(`/admin/profile/${orderId}`, 'page');
        
        return { success: true, message: 'Payment successful!' };
    } catch (error: any) {
        console.error('Exception during payment approval:', error);
        return { success: false, message: 'An unexpected server error occurred. Please contact support.' };
    }
}

export default async function PaymentSuccessPage({ searchParams }: { searchParams: { order_id?: string, transaction_id?: string } }) {
    const { order_id, transaction_id } = searchParams;

    const result = await approvePayment(order_id, transaction_id);

    if (result.success) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="mt-4 text-2xl">Payment Successful!</CardTitle>
                        <CardDescription>
                            Your account has been approved and your payment was processed successfully.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            The next step is to complete your KYC verification. Please log in to your new account to continue.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button asChild className="w-full" size="lg">
                            <Link href="/login">Log In and Complete KYC</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        );
    }

    // Failed or Error status
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                        <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Payment Verification Failed</CardTitle>
                    <CardDescription>
                        {result.message || 'Your payment could not be automatically verified.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        If you have already paid, please contact our support team with your payment details.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button asChild className="w-full" size="lg" variant="secondary">
                        <Link href="/login">Go to Login</Link>
                    </Button>
                    <Button asChild className="w-full" size="lg" variant="outline">
                        <Link href="/pricing">View Plans and Try Again</Link>
                    </Button>
                </CardFooter>
            </Card>
        </main>
    );
}
