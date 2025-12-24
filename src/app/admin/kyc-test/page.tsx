
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { verifyPan } from './actions';

export default function KycTestPage() {
    const [pan, setPan] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleVerification = async () => {
        if (!pan) {
            setResult({ error: 'Please enter a PAN number to test.' });
            return;
        }
        setIsLoading(true);
        setResult(null);
        const apiResult = await verifyPan(pan);
        setResult(apiResult);
        setIsLoading(false);
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/40">
            <div className="w-full max-w-xl space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>PAN Verification Test Page</CardTitle>
                        <CardDescription>This page is for testing the eKYCHub PAN verification API. Enter a PAN number below to see the raw API response.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="pan">PAN Number</Label>
                            <Input
                                id="pan"
                                value={pan}
                                onChange={(e) => setPan(e.target.value.toUpperCase())}
                                maxLength={10}
                                placeholder="Enter 10-digit PAN"
                            />
                        </div>
                        <Button onClick={handleVerification} disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Run Test Verification'}
                        </Button>
                    </CardContent>
                </Card>

                {result && (
                     <Card>
                        <CardHeader>
                            <CardTitle>API Response</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-x-auto text-sm">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
}
