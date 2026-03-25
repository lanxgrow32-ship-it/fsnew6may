'use client';

import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { sendTestWebhook } from './actions';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Test Signal'}
        </Button>
    );
}

export default function WebhookTestPage() {
    const { toast } = useToast();
    const [state, formAction] = useActionState(sendTestWebhook, { error: null, success: false });
    
    useEffect(() => {
        if (state.success) {
            toast({
                title: "Test Signal Sent!",
                description: "Check your Make.com scenario. The data variables should now be available.",
            });
        }
        if (state.error) {
            toast({
                title: "Error Sending Signal",
                description: state.error,
                variant: "destructive",
            });
        }
    }, [state, toast]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Webhook Tester</CardTitle>
                    <CardDescription>
                        This page sends a test signal to your webhook WITHOUT needing an API key.
                        <br/><br/>
                        <b>Step 1:</b> In your Make.com scenario, click "Re-determine data structure".
                        <br/>
                        <b>Step 2:</b> Come back here and click the button below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        {state.error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}
                         {state.success && <Alert variant="default" className="border-green-500 text-green-700"><AlertTitle>Success!</AlertTitle><AlertDescription>The test signal was sent successfully. You can now map the variables in Make.com.</AlertDescription></Alert>}
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
