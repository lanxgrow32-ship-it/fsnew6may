'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import { login } from './actions';
import { FundedStockLogo } from '@/components/ui/logo';
import { ClientOnly } from '@/components/ui/client-only';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, { error: null });

  return (
    <div className="dark min-h-screen bg-slate-950 font-poppins text-gray-200">
      <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute inset-0 z-0">
            <div className="absolute top-[-25%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full filter blur-3xl opacity-20 " />
            <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-purple-600 rounded-full filter blur-3xl opacity-10" />
        </div>

        <ClientOnly>
            <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex justify-center">
                    <Button asChild variant="outline" size="sm" className="bg-black/20 border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 shadow-[0_0_30px_rgba(234,179,8,0.1)] mb-4">
                        <FundedStockLogo className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-white">Welcome Back</h1>
                    <p className="text-gray-500 uppercase text-[10px] font-bold tracking-[0.2em]">Trader Portal Login</p>
                </div>

                <Card className="bg-white/5 backdrop-blur-2xl border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                    <form action={formAction}>
                        <CardHeader>
                            <CardTitle className="text-xl text-white">Sign In</CardTitle>
                            <CardDescription className="text-gray-400">Enter your credentials to access your dashboard.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {state?.error && (
                                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 animate-in shake-1">
                                    <AlertTitle>Login Error</AlertTitle>
                                    <AlertDescription>{state.error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                                <Input 
                                    id="email" 
                                    name="email" 
                                    type="email" 
                                    placeholder="name@example.com" 
                                    required 
                                    className="bg-black/20 border-white/10 text-white h-12 focus:ring-primary/50" 
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="password" title="password" className="text-gray-300">Password</Label>
                                    <Link href="#" className="text-xs text-primary hover:underline font-bold">Forgot Password?</Link>
                                </div>
                                <Input 
                                    id="password" 
                                    name="password" 
                                    type="password" 
                                    required 
                                    className="bg-black/20 border-white/10 text-white h-12 focus:ring-primary/50" 
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 pb-8">
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isPending}>
                                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authorizing...</> : 'LOGIN TO DASHBOARD'}
                            </Button>
                            <p className="text-sm text-center text-gray-500">
                                New to FundedStock? <Link href="/pricing" className="text-primary hover:underline font-bold">Start Evaluation</Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </ClientOnly>
      </main>
    </div>
  );
}
