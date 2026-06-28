'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendWelcomeTestWebhook } from './actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Send Welcome Test Signal
    </Button>
  );
}

export default function WelcomeWebhookTestPage() {
  const { toast } = useToast();
  const [state, formAction] = useActionState(sendWelcomeTestWebhook, { error: null, success: false });

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Signal Sent!',
        description: 'Make.com should now show "Successfully determined".',
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
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-poppins">
      <Card className="w-full max-w-md bg-white/5 border-white/10 text-white">
        <CardHeader>
          <CardTitle>Welcome Flow - Webhook Test</CardTitle>
          <CardDescription className="text-gray-400">
            Ensure your Webhook URL is in .env, then click below to teach Make.com your data structure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            {state.error && <Alert variant="destructive" className="mb-4 bg-red-500/10 border-red-500/20"><AlertTitle>Error</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
