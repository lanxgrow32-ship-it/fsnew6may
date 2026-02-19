
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
    const method = searchParams.get('method');
    const [status, setStatus] = useState<'loading' | 'success' | 'pending_crypto' | 'failed' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!orderId) {
            setStatus('error');
            setErrorMessage('No order information found in the URL.');
            return;
        }

        if (method === 'crypto') {
            setStatus('pending_crypto');
            return;
        }

        if (status !== 'loading') {
            return; // Stop effect if status is already resolved
        }
        
        let intervalId: NodeJS.Timeout;

        const verifyStatus = async () => {
            try {
                const result = await checkPaymentStatus(orderId);
                
                if (result.status === 'ok' && result.is_approved) {
                    setStatus('success');
                    clearInterval(intervalId); // Stop polling on success
                }
            } catch (e) {
                // Errors will be caught by the timeout
                console.error("Polling error:", e);
            }
        };

        // Poll every 3 seconds for 30 seconds
        verifyStatus(); // Initial immediate check
        intervalId = setInterval(verifyStatus, 3000);
        
        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            // Check one last time if status is still loading after timeout
            if (status === 'loading') {
                 checkPaymentStatus(orderId).then(finalResult => {
                    if (finalResult.status === 'ok' && finalResult.is_approved) {
                        setStatus('success');
                    } else {
                        setStatus('failed');
                    }
                 });
            }
        }, 30000);

        // Cleanup on component unmount
        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };

    }, [orderId, method, status]);

    if (status === 'loading') {
        return (
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <Loader2 className="h-6 w-6 text-gray-600 dark:text-gray-400 animate-spin" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Verifying Payment...</CardTitle>
                    <CardDescription>
                        Please wait while we confirm your transaction. This page will update automatically.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This can take up to 30 seconds.</p>
                </CardContent>
            </Card>
        );
    }
    
    if (status === 'success' || status === 'pending_crypto') {
        const isCrypto = status === 'pending_crypto';
        return (
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">{isCrypto ? 'Submission Received!' : 'Payment Successful!'}</CardTitle>
                    <CardDescription>
                        {isCrypto
                            ? "Your submission has been received. An admin will verify your crypto payment and approve your account shortly."
                            : "Your account has been created and your payment was processed successfully."}
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
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                    <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="mt-4 text-2xl">Payment Verification Timed Out</CardTitle>
                <CardDescription>
                    {status === 'failed' ? 'Your payment could not be automatically verified. If you have paid, your account will be approved shortly. You can now close this page and log in later.' : errorMessage}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    If your account is not approved within 30 minutes, please contact support.
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
