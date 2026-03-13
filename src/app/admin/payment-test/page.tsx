
'use client';

import { useEffect } from 'react';
import { useActionState } from 'react-dom';
import { initiateLgPayPayment } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Proceed to Payment
        </Button>
    );
}

export default function PaymentTestPage() {
    const [state, formAction] = useActionState(initiateLgPayPayment, { error: null, redirectUrl: null });

    useEffect(() => {
        if (state.redirectUrl) {
            window.location.href = state.redirectUrl;
        }
    }, [state.redirectUrl]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>LG-Pay Integration Test</CardTitle>
                    <CardDescription>
                        Use this page to test the LG-Pay payment flow.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        {state.error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (INR)</Label>
                            <Input
                                id="amount"
                                name="amount"
                                placeholder="e.g., 10.50"
                                required
                                type="number"
                                step="0.01"
                            />
                        </div>
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
