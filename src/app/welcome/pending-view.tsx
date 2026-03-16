
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

function UtrSubmitForm() {
    const ref = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [state, formAction] = useActionState(submitUtr, { error: null, success: false });

    useEffect(() => {
        if (state.error) {
            toast({
                title: "Submission Error",
                description: state.error,
                variant: "destructive",
            });
        }
        if (state.success) {
            toast({
                title: "Success",
                description: "Your Transaction ID has been submitted for verification.",
            });
            ref.current?.reset();
        }
    }, [state, toast]);

    function SubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" disabled={pending} className="w-full bg-purple-600 text-white hover:bg-purple-700">
                {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="mr-2 h-4 w-4" /> Submit for Verification</>}
            </Button>
        );
    }

    return (
        <form ref={ref} action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="utr" className="text-white">UTR / Transaction ID</Label>
                <Input id="utr" name="utr" placeholder="Enter the transaction ID from your payment app" required className="bg-black/20 border-white/10 text-white" />
            </div>
            <SubmitButton />
        </form>
    );
}

export function PendingView({ profile }: { profile: any }) {
    const supabase = createClient();
    const [settings, setSettings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('payment_details').select('upi_id, qr_code_url').eq('id', 1).single();
            setSettings(data);
            setIsLoading(false);
        }
        fetchSettings();
    }, [supabase]);

    const isUtrSubmitted = !!profile.transaction_id;

    if (isLoading) {
        return (
             <div className="dark min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Loader2 className="h-10 w-10 text-purple-400 animate-spin" />
            </div>
        )
    }

    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
            <main className="flex min-h-screen items-center justify-center p-4">
                <GlassCard className="w-full max-w-lg text-center p-8 border-amber-500/50">
                    <div className="mx-auto bg-amber-500/10 rounded-full p-3 w-fit mb-4">
                        <Loader2 className="h-10 w-10 text-amber-400 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-amber-400">Payment Verification Pending</h2>
                    {isUtrSubmitted ? (
                        <p className="text-gray-400 mt-2 mb-6">
                            Your payment is being verified by our team. This page will update automatically once your account is approved. This usually takes a few minutes.
                        </p>
                    ) : (
                         <p className="text-gray-400 mt-2 mb-6">
                            To activate your account, please complete the payment using the details below and submit your transaction ID.
                        </p>
                    )}

                    {!isUtrSubmitted && settings && (
                        <div className="text-left space-y-6 my-8">
                            <div className="space-y-4 rounded-lg border border-white/10 p-4 bg-black/20">
                                {settings.qr_code_url && (
                                     <div className="mx-auto w-fit p-2 bg-white rounded-md">
                                        <Image src={settings.qr_code_url} alt="UPI QR Code" width={180} height={180} />
                                     </div>
                                )}
                                {settings.upi_id && (
                                    <div>
                                        <Label className="text-gray-400">Or pay to this UPI ID:</Label>
                                        <p className="font-mono text-lg text-white">{settings.upi_id}</p>
                                    </div>
                                )}
                            </div>
                            <UtrSubmitForm />
                        </div>
                    )}
                    
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

