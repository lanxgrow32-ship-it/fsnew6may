
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { checkPaymentStatus } from './actions';

function PaymentStatusContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');
    const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!orderId) {
            setStatus('error');
            setErrorMessage('No order information found in the URL.');
            return;
        }

        const verifyStatus = async () => {
            // Wait a moment for the webhook to potentially process
            await new Promise(resolve => setTimeout(resolve, 2000));
            const result = await checkPaymentStatus(orderId);
            
            if (result.status === 'ok') {
                setStatus(result.is_approved ? 'success' : 'failed');
            } else {
                setStatus('error');
                setErrorMessage(result.message || 'An unknown error occurred.');
            }
        };

        verifyStatus();
    }, [orderId]);

    if (status === 'loading') {
        return (
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <Loader2 className="h-6 w-6 text-gray-600 animate-spin" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Verifying Payment...</CardTitle>
                    <CardDescription>
                        Please wait while we confirm your transaction.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This may take a few moments.</p>
                </CardContent>
            </Card>
        );
    }
    
    if (status === 'success') {
        return (
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Payment Successful!</CardTitle>
                    <CardDescription>
                        Your account has been created and your payment was processed successfully.
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
        );
    }

    // Failed or Error status
    return (
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="mt-4 text-2xl">Payment Incomplete</CardTitle>
                <CardDescription>
                    {status === 'failed' ? 'Your payment was not successful or is still pending.' : errorMessage}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    If you believe this is an error, please contact support. Otherwise, you can attempt to purchase a plan again.
                </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button asChild className="w-full" size="lg" variant="outline">
                    <Link href="/pricing">View Plans and Try Again</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function PaymentStatusPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin"/>}>
                <PaymentStatusContent />
            </Suspense>
        </main>
    );
}
