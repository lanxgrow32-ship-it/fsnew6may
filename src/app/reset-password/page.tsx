
'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react';
import { resetPasswordSubmit } from './actions';
import { FundedStockLogo } from '@/components/ui/logo';
import { ClientOnly } from '@/components/ui/client-only';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(resetPasswordSubmit, { error: null, success: false });

  useEffect(() => {
    if (state.success) {
      toast({ 
        title: "Security Updated", 
        description: "Your password has been reset successfully. Redirecting to dashboard..." 
      });
      setTimeout(() => router.push('/welcome'), 2000);
    }
  }, [state.success, router, toast]);

  return (
    <div className="dark min-h-screen bg-slate-950 font-poppins text-gray-200">
      <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute inset-0 z-0">
            <div className="absolute top-[-25%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full filter blur-3xl opacity-20 " />
            <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-green-600 rounded-full filter blur-3xl opacity-10" />
        </div>

        <ClientOnly>
            <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="bg-green-500/10 p-3 rounded-2xl border border-green-500/20 mb-4 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                        <FundedStockLogo className="h-10 w-10 text-green-400" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Finalize Protocol</h1>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em]">Account Security Re-Authorization</p>
                </div>

                <Card className="bg-white/5 backdrop-blur-2xl border-white/10 rounded-[32px] shadow-2xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl text-white">Create New Password</CardTitle>
                        <CardDescription className="text-gray-400">Your identity has been verified. Set your new access key below.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {state?.error && (
                            <div className="space-y-4">
                                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                                    <AlertTitle>Protocol Error</AlertTitle>
                                    <AlertDescription>{state.error}</AlertDescription>
                                </Alert>
                                <Button asChild variant="outline" className="w-full h-11 border-white/10 bg-black/40 text-gray-400 hover:text-white">
                                    <Link href="/forgot-password">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Request New Link
                                    </Link>
                                </Button>
                            </div>
                        )}

                        {state?.success ? (
                             <div className="space-y-6 text-center py-4">
                                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto border border-green-500/20">
                                    <CheckCircle2 className="h-8 w-8 text-green-400 animate-bounce" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-white text-lg">Reset Successful</h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest">Routing to Dashboard...</p>
                                </div>
                            </div>
                        ) : !state?.error && (
                            <form action={formAction} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" title="password" className="text-gray-300">New Password</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                                        <Input 
                                            id="password" 
                                            name="password" 
                                            type="password" 
                                            required 
                                            autoComplete="new-password"
                                            className="pl-10 bg-black/20 border-white/10 text-white h-12 focus:ring-primary/50" 
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 px-1">Min 6 characters required.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm_password" title="password" className="text-gray-300">Confirm Password</Label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                                        <Input 
                                            id="confirm_password" 
                                            name="confirm_password" 
                                            type="password" 
                                            required 
                                            autoComplete="new-password"
                                            className="pl-10 bg-black/20 border-white/10 text-white h-12 focus:ring-primary/50" 
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-black h-12 rounded-xl mt-4 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isPending}>
                                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> UPDATING SECURE KEY...</> : 'CONFIRM RESET'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ClientOnly>
      </main>
    </div>
  );
}
