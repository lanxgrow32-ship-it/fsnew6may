'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldAlert, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendPurchaseTestWebhook } from './actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function SubmitButton({ needsKyc, label, icon: Icon }: { needsKyc: boolean, label: string, icon: any }) {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      variant={needsKyc ? "outline" : "default"}
      className="w-full h-12 font-bold rounded-xl flex items-center justify-center gap-2" 
      disabled={pending}
    >
      <input type="hidden" name="needsKyc" value={String(needsKyc)} />
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </Button>
  );
}

export default function WebhookTestPagePurchase() {
  const { toast } = useToast();
  const [state, formAction] = useActionState(sendPurchaseTestWebhook, { error: null, success: false });

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Signal Sent!',
        description: 'Verify your Make.com router filters with this data.',
      });
    }
  }, [state, toast]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-poppins text-white">
      <Card className="w-full max-w-md bg-white/5 border-white/10 text-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Step 3: Intelligent Routing</CardTitle>
          <CardDescription className="text-gray-400">
            Test both branches of your Make.com Router.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.error && <Alert variant="destructive" className="mb-4 bg-red-500/10 border-red-500/20"><AlertTitle>Error</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}
          
          <form action={formAction}>
            <SubmitButton needsKyc={true} label="Test 'Needs KYC' Route" icon={ShieldAlert} />
          </form>

          <form action={formAction}>
            <SubmitButton needsKyc={false} label="Test 'Credentials' Route" icon={KeyRound} />
          </form>
          
          <p className="text-[10px] text-gray-600 text-center uppercase font-bold tracking-widest mt-4 italic">
            Note: Use these buttons to verify your Boolean filters (true/false) in Make.com.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
