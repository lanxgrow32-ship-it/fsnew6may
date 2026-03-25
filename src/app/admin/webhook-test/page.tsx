'use client';

import { useActionState } from 'react';
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
    
    React.useEffect(() => {
        if (state.success) {
            toast({
                title: "Test Signal Sent!",
                description: "Check your Make.com scenario to see the new data structure.",
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
                        First, click "Re-determine data structure" in your Make.com webhook module. Then, click the button below to send a test signal.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        {state.error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}
                         {state.success && <Alert variant="default" className="border-green-500 text-green-700"><AlertTitle>Success!</AlertTitle><AlertDescription>The test signal was sent successfully.</AlertDescription></Alert>}
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
