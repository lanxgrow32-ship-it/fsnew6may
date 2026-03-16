
'use client';
import { useState, useEffect, useActionState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { submitUtr } from './actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Send } from 'lucide-react';
import Image from 'next/image';
import { signOut } from '@/app/actions';
import { cn } from '@/lib/utils';


const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg', className)}>
        {children}
    </div>
);

export function PendingView({ profile }: { profile: any }) {
    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
            <main className="flex min-h-screen items-center justify-center p-4">
                <GlassCard className="w-full max-w-lg text-center p-8 border-amber-500/50">
                    <div className="mx-auto bg-amber-500/10 rounded-full p-3 w-fit mb-4">
                        <Loader2 className="h-10 w-10 text-amber-400 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-amber-400">Payment Verification Pending</h2>
                    <p className="text-gray-400 mt-2 mb-6">
                        Your payment is being verified by our team. This page will update automatically once your account is approved. This usually takes a few minutes.
                    </p>
                    <div className="flex flex-col items-center gap-4 pt-4">
                        <form action={signOut}>
                            <Button variant="outline" className="bg-black/20 border-white/10 text-white hover:bg-white/20">
                                Logout
                            </Button>
                        </form>
                    </div>
                </GlassCard>
            </main>
        </div>
    );
}
