
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
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, { error: null });

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

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
                    <CardHeader>
                        <CardTitle className="text-xl text-white">Sign In</CardTitle>
                        <CardDescription className="text-gray-400">Enter your credentials to access your dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Google Auth Button */}
                        <Button 
                            variant="outline" 
                            className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold rounded-xl gap-3"
                            onClick={handleGoogleLogin}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
                            </svg>
                            Continue with Google
                        </Button>

                        <div className="relative flex items-center">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Or email</span>
                            <div className="flex-grow border-t border-white/5"></div>
                        </div>

                        <form action={formAction} className="space-y-4">
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
                                    <Link href="/forgot-password" title="reset" className="text-xs text-primary hover:underline font-bold">Forgot Password?</Link>
                                </div>
                                <Input 
                                    id="password" 
                                    name="password" 
                                    type="password" 
                                    required 
                                    className="bg-black/20 border-white/10 text-white h-12 focus:ring-primary/50" 
                                />
                            </div>
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] mt-4" disabled={isPending}>
                                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authorizing...</> : 'LOGIN TO DASHBOARD'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pb-8">
                        <p className="text-sm text-center text-gray-500">
                            New to FundedStock? <Link href="/pricing" className="text-primary hover:underline font-bold">Start Evaluation</Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </ClientOnly>
      </main>
    </div>
  );
}
