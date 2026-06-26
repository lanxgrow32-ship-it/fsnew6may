
'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import { signup } from './actions';
import { FundedStockLogo } from '@/components/ui/logo';

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, { error: null });

  return (
    <div className="dark min-h-screen bg-slate-950 font-poppins text-gray-200">
      <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        <div className="w-full max-w-md space-y-8 relative z-10">
            <div className="flex justify-center">
                <Button asChild variant="outline" size="sm" className="bg-black/20 border-white/10 text-gray-400 hover:text-white rounded-full transition-all">
                    <Link href="/pricing">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Plans
                    </Link>
                </Button>
            </div>

            <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 mb-4">
                    <FundedStockLogo className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Join FundedStock</h1>
                <p className="text-gray-500 text-sm">Create your trader portal account</p>
            </div>

            <Card className="bg-white/5 backdrop-blur-2xl border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                <form action={formAction}>
                    <CardHeader>
                        <CardTitle className="text-xl text-white">Trader Registration</CardTitle>
                        <CardDescription className="text-gray-400">Join India's leading performance platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {state?.error && (
                            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                                <AlertTitle>Registration Error</AlertTitle>
                                <AlertDescription>{state.error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="full_name" className="text-gray-300">Full Name</Label>
                            <Input id="full_name" name="full_name" required placeholder="John Doe" className="bg-black/20 border-white/10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mobile_number" className="text-gray-300">Mobile Number</Label>
                            <Input id="mobile_number" name="mobile_number" required placeholder="10-digit number" className="bg-black/20 border-white/10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                            <Input id="email" name="email" type="email" required placeholder="name@example.com" className="bg-black/20 border-white/10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" title="password" className="text-gray-300">Choose Password</Label>
                            <Input id="password" name="password" type="password" required className="bg-black/20 border-white/10 text-white" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pb-8">
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl" disabled={isPending}>
                            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</> : 'CREATE ACCOUNT'}
                        </Button>
                        <p className="text-sm text-center text-gray-500">
                            Already have an account? <Link href="/login" className="text-primary hover:underline font-bold">Sign In</Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
      </main>
    </div>
  );
}
