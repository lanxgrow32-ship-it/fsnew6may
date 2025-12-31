
'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCheck, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClientOnly } from '@/components/ui/client-only';

// This is the new component that contains the logic using searchParams
function KycVerificationFlow() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [apiUrl, setApiUrl] = useState('');

    // Fetch the microservice URL from the client-side environment variable
    useEffect(() => {
        // Vercel exposes public env vars with NEXT_PUBLIC_ prefix to the browser
        const url = process.env.NEXT_PUBLIC_API_URL;
        if (url) {
            setApiUrl(url);
        } else {
             // Fallback for local development if you set it in .env.local
            setApiUrl('http://localhost:3001');
        }
    }, []);

    // This effect runs when the page loads, checking for redirect parameters from Digilocker.
    useEffect(() => {
        const verification_id = searchParams.get('verification_id');
        const reference_id = searchParams.get('reference_id');
        const document_type = searchParams.get('document_type') as 'AADHAAR' | 'PAN' | null;

        if (verification_id && reference_id && document_type) {
            startTransition(async () => {
                setError(null);
                setResult(null);

                if (!apiUrl) {
                    setError('API URL is not configured. Cannot fetch document.');
                    return;
                }

                try {
                    const response = await fetch(`${apiUrl}/api/get-document`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ verification_id, reference_id, document_type })
                    });
                    const data = await response.json();
                    
                    if (response.ok) {
                        setResult(data);
                    } else {
                        setError(data.error || 'Failed to retrieve document data.');
                    }
                } catch (e: any) {
                    setError(`Failed to connect to the verification service: ${e.message}`);
                }

                // Clean the URL
                router.replace('/admin/kyc-test');
            });
        }
    }, [searchParams, router, apiUrl]);


    const handleVerification = (docType: 'AADHAAR' | 'PAN') => {
        startTransition(async () => {
            setError(null);
            setResult(null);

            if (!apiUrl) {
                setError('API URL is not configured. Cannot start verification.');
                return;
            }

            // Construct the redirect URL from the current window location
            const currentUrl = window.location.href.split('?')[0];
            const redirectBackUrl = `${currentUrl}?document_type=${docType}`;
            
            try {
                const response = await fetch(`${apiUrl}/api/create-digilocker-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        documentType: docType,
                        redirectBackUrl: redirectBackUrl // Send the dynamic URL to the backend
                    })
                });

                const data = await response.json();
                
                if (response.ok && data.url) {
                    // Redirect the user to the Digilocker URL
                    window.location.href = data.url;
                } else {
                    setError(data.error || 'Failed to start verification process.');
                }
            } catch (e: any) {
                setError(`Failed to connect to the verification service: ${e.message}`);
            }
        });
    };

    return (
        <div className="w-full max-w-2xl space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Digilocker Verification Test Page</CardTitle>
                    <CardDescription>Use this page to test the end-to-end eKYCHub Digilocker verification flow for Aadhaar and PAN.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Click a button below to start the verification. You will be redirected to the official Digilocker website to provide consent.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={() => handleVerification('AADHAAR')} disabled={isPending || !apiUrl} className="w-full">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                            Verify Aadhaar via Digilocker
                        </Button>
                         <Button onClick={() => handleVerification('PAN')} disabled={isPending || !apiUrl} className="w-full">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                            Verify PAN via Digilocker
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <ClientOnly>
                {isPending && !result && !error && (
                     <Card>
                        <CardContent className="p-6 flex flex-col items-center justify-center space-y-3 h-48">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground">Waiting for Digilocker response...</p>
                        </CardContent>
                    </Card>
                )}

                {error && (
                     <Alert variant="destructive">
                        <AlertTitle>Verification Failed</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {result && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Verification Successful</CardTitle>
                            <CardDescription>Below is the data retrieved from Digilocker.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {result.photo_link && (
                                 <div className="space-y-2">
                                    <h3 className="font-semibold">User Photograph</h3>
                                    <Image
                                        src={`data:image/jpeg;base64,${result.photo_link}`}
                                        alt="User Photo from Aadhaar"
                                        width={150}
                                        height={200}
                                        className="rounded-md border p-1"
                                    />
                                 </div>
                            )}
                            <div className="space-y-2">
                                <h3 className="font-semibold">Raw JSON Response</h3>
                                <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-x-auto text-sm">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                )}
             </ClientOnly>
        </div>
    )
}

// This is the main page component, now acting as a wrapper.
export default function KycTestPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/40">
            <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-primary" />}>
                <KycVerificationFlow />
            </Suspense>
        </main>
    );
}
