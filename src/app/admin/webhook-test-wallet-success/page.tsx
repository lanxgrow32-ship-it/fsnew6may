'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendWalletSuccessTestWebhook } from './actions';

export default function WalletSuccessTestPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleTest = () => {
    startTransition(async () => {
      const res = await sendWalletSuccessTestWebhook();
      if (res.error) toast({ title: "Error", description: res.error, variant: "destructive" });
      else toast({ title: "Signal Sent!", description: "Check Make.com for the Wallet payload." });
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-poppins">
      <Card className="w-full max-w-md bg-white/5 border-white/10 text-white">
        <CardHeader>
          <CardTitle>Step 6: Wallet Top-up</CardTitle>
          <CardDescription className="text-gray-400">Teaches Make.com the Wallet Confirmation data structure.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleTest} disabled={isPending} className="w-full h-12 font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
            Send Wallet Success Signal
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}