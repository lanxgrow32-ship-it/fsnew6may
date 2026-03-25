'use client';

import { useEffect, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendKycTestWebhook } from './actions';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <><Send className="mr-2 h-4 w-4" /> Send Test Signal</>}
        </Button>
    );
}

export default function KycWebhookTestPage() {
    const ref = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [state, formAction] = useActionState(sendKycTestWebhook, { error: null, success: null });

    useEffect(() => {
        if (state.error) {
            toast({ title: "Error", description: state.error, variant: "destructive" });
        }
        if (state.success) {
            toast({ title: "Success", description: state.success });
        }
    }, [state, toast]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>KYC Webhook Tester</CardTitle>
                    <CardDescription>
                        Use this page to send a test signal to your "KYC Reminder" Make.com scenario to determine the data structure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form ref={ref} action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="user_name">User Name</Label>
                            <Input id="user_name" name="user_name" defaultValue="Test User" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue="test.user@example.com" required />
                        </div>
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
