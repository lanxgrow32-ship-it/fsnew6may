
'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { sendResetLink } from './actions';
import { FundedStockLogo } from '@/components/ui/logo';
import { ClientOnly } from '@/components/ui/client-only';

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(sendResetLink, { error: null, success: null });

  return (
    <div className="dark min-h-screen bg-slate-950 font-poppins text-gray-200">
      <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute inset-0 z-0">
            <div className="absolute top-[-25%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full filter blur-3xl opacity-20 " />
            <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-purple-600 rounded-full filter blur-3xl opacity-10" />
        </div>

        <ClientOnly>
            <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex justify-center">
                    <Button asChild variant="outline" size="sm" className="bg-black/20 border-white/10 text-gray-400 hover:text-white rounded-full transition-all">
                        <Link href="/login">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 mb-4">
                        <FundedStockLogo className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Identity Recovery</h1>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em]">Secure Password Reset</p>
                </div>

                <Card className="bg-white/5 backdrop-blur-2xl border-white/10 rounded-[32px] shadow-2xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl text-white">Reset Password</CardTitle>
                        <CardDescription className="text-gray-400">Enter your registered email to receive a recovery link.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {state?.error && (
                            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{state.error}</AlertDescription>
                            </Alert>
                        )}

                        {state?.success ? (
                            <div className="space-y-6 text-center py-4">
                                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto border border-green-500/20">
                                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-white text-lg">Signal Dispatched</h3>
                                    <p className="text-sm text-gray-400 px-4">{state.success}</p>
                                </div>
                                <Button asChild variant="outline" className="w-full h-11 border-white/10 text-white font-bold rounded-xl mt-4">
                                    <Link href="/login">Return to Login</Link>
                                </Button>
                            </div>
                        ) : (
                            <form action={formAction} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                                        <Input 
                                            id="email" 
                                            name="email" 
                                            type="email" 
                                            placeholder="name@example.com" 
                                            required 
                                            className="pl-10 bg-black/20 border-white/10 text-white h-12 focus:ring-primary/50" 
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-black h-12 rounded-xl mt-2 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isPending}>
                                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> DISPATCHING...</> : 'SEND RECOVERY LINK'}
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
