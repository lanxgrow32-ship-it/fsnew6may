'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendBreachRecoveryTestWebhook } from './actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Send Breach Recovery Test Signal
    </Button>
  );
}

export default function WebhookTestPageBreachRecovery() {
  const { toast } = useToast();
  const [state, formAction] = useActionState(sendBreachRecoveryTestWebhook, { error: null, success: false });

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Signal Sent!',
        description: 'Check your Make.com scenario to see if the data was received.',
      });
    }
    if (state.error) {
      toast({
        title: 'Error',
        description: state.error,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Breach Recovery - Webhook Test</CardTitle>
          <CardDescription>
            Click the button to send a test payload to your Make.com webhook for the breach recovery email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            {state.error && <Alert variant="destructive" className="mb-4"><AlertTitle>Error</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
