
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, LayoutDashboard, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);
    
    // Values that might cause hydration mismatch if computed during render
    const [transactionId, setTransactionId] = useState<string>('');
    const [amount, setAmount] = useState<string>('0');
    const [planName, setPlanName] = useState<string>('Evaluation Plan');
    const [method, setMethod] = useState<string>('wallet');

    useEffect(() => {
        // Signal that we are on the client
        setMounted(true);
        
        // Compute values from URL or fallback
        // Date.now() must be inside useEffect to avoid hydration mismatch
        const id = searchParams.get('id') || `TX_${Date.now()}`;
        const amt = searchParams.get('amount') || '0';
        const plan = searchParams.get('plan') || 'Evaluation Plan';
        const meth = searchParams.get('method') || 'wallet';
        
        setTransactionId(id);
        setAmount(amt);
        setPlanName(plan);
        setMethod(meth);

        // --- GOOGLE TAG MANAGER HANDSHAKE ---
        // Ensure dataLayer exists
        (window as any).dataLayer = (window as any).dataLayer || [];
        
        // Push the purchase event
        (window as any).dataLayer.push({
            event: "purchase_complete",
            transaction_id: id,
            value: parseFloat(amt) || 0,
            currency: "INR"
        });

        // Set global variables for "Extract data from your page" config
        (window as any).purchase_transaction_id = id;
        (window as any).purchase_value = parseFloat(amt) || 0;
        (window as any).purchase_currency = "INR";

        console.log(`[Conversion Tracking] Dispatched signal for TX: ${id} | Value: ${amt}`);
    }, [searchParams]);

    // Avoid rendering dynamic content that causes mismatches until after hydration
    if (!mounted) {
        return (
            <div className="dark min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="dark min-h-screen bg-slate-950 font-poppins text-gray-200 relative overflow-hidden flex items-center justify-center p-4">
            {/* Conversion Data - Hidden IDs for CSS Selector Extraction */}
            <span id="gtm-transaction-id" className="hidden">{transactionId}</span>
            <span id="gtm-value" className="hidden">{amount}</span>
            <span id="gtm-currency" className="hidden">INR</span>

            {/* Background Decor */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full filter blur-3xl opacity-20" />

            <div className="w-full max-w-xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <Card className="bg-white/5 backdrop-blur-2xl border-white/10 rounded-[40px] shadow-2xl overflow-hidden text-center">
                    <CardHeader className="pt-12 pb-6">
                        <div className="mx-auto w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.2)] mb-6">
                            <CheckCircle className="h-12 w-12 text-green-400" />
                        </div>
                        <CardTitle className="text-4xl font-black text-white tracking-tighter">Purchase Successful</CardTitle>
                        <CardDescription className="text-gray-400 text-lg mt-2">Your account is being activated.</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-8 px-10">
                        <div className="bg-black/40 border border-white/5 rounded-3xl p-8 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Plan Name</p>
                                <p className="text-xl font-bold text-white">{planName}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                                <div className="text-left space-y-1">
                                    <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Amount Paid</p>
                                    <p className="text-lg font-bold text-primary">₹{(parseFloat(amount) || 0).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Transaction ID</p>
                                    <p className="text-sm font-mono font-bold text-gray-400 truncate">{transactionId.substring(0, 14)}</p>
                                </div>
                            </div>
                        </div>

                        {method === 'manual' ? (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4 text-left">
                                <ShieldCheck className="h-6 w-6 text-amber-500 shrink-0" />
                                <p className="text-xs text-amber-400 font-medium">Your manual payment is now in the verification queue. Credentials will be released once the reference ID is verified by our team.</p>
                            </div>
                        ) : (
                            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-4 text-left">
                                <Sparkles className="h-6 w-6 text-primary shrink-0" />
                                <p className="text-xs text-primary font-medium">Account activated instantly! You can now access your credentials in the Portfolio hub.</p>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="pb-12 pt-4 px-10">
                        <Button asChild size="lg" className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Link href="/welcome">
                                <LayoutDashboard className="mr-3 h-5 w-5" />
                                Enter Portfolio Hub
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
                
                <p className="mt-8 text-center text-gray-600 text-[10px] font-bold uppercase tracking-[0.4em]">
                    Secure Payment Gateway · FundedStock
                </p>
            </div>
        </div>
    );
}

export default function PurchaseSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <SuccessContent />
        </Suspense>
    );
}
