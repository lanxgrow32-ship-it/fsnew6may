
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ReceiptPrinter, type ReceiptPrinterStage } from '@/components/ui/receipt-printer';
import { Button } from '@/components/ui/button';
import { FundedStockLogo } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { 
    LayoutDashboard, 
    MessageSquare, 
    ArrowRight, 
    Loader2, 
    Sparkles, 
    ShieldCheck, 
    CheckCircle,
    ChevronRight,
    Home
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function SuccessContent() {
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);
    const [stage, setStage] = useState<ReceiptPrinterStage>("processing");
    
    const [transactionId, setTransactionId] = useState<string>('');
    const [amount, setAmount] = useState<string>('0');
    const [planName, setPlanName] = useState<string>('Evaluation Plan');
    const [method, setMethod] = useState<string>('wallet');

    useEffect(() => {
        setMounted(true);
        const id = searchParams.get('id') || `TX_${Date.now()}`;
        const amt = searchParams.get('amount') || '0';
        const plan = searchParams.get('plan') || 'Evaluation Plan';
        const meth = searchParams.get('method') || 'wallet';
        
        setTransactionId(id);
        setAmount(amt);
        setPlanName(plan);
        setMethod(meth);

        // Sequence Animation
        const timer1 = setTimeout(() => setStage("printing"), 1200);
        const timer2 = setTimeout(() => setStage("complete"), 4500);

        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, [searchParams]);

    if (!mounted) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const isManual = method === 'manual' || method === 'automated';

    return (
        <div className="dark min-h-screen bg-slate-950 font-poppins text-gray-200 relative overflow-hidden flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            
            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <ReceiptPrinter.Root stage={stage}>
                    <ReceiptPrinter.Machine>
                        <ReceiptPrinter.Header>
                            <FundedStockLogo className="h-6 w-6 text-primary" />
                            <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-gray-500">Secure Payment</Badge>
                        </ReceiptPrinter.Header>

                        <ReceiptPrinter.Screen className={cn(stage === 'complete' && "border-green-500/20")}>
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Account Info</p>
                                        <p className="text-sm font-bold text-white truncate uppercase">{planName}</p>
                                    </div>
                                    <p className="text-sm font-black text-primary">₹{Number(amount).toLocaleString()}</p>
                                </div>
                                <ReceiptPrinter.Status />
                            </div>
                        </ReceiptPrinter.Screen>
                    </ReceiptPrinter.Machine>

                    <ReceiptPrinter.Output>
                        <ReceiptPrinter.Paper>
                            <div className="space-y-6 text-center">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter italic text-slate-950">FundedStock</h2>
                                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.4em]">Payment Receipt</p>
                                </div>
                                
                                <div className="border-y border-dashed border-slate-300 py-6 space-y-4">
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase">Trading Plan</span><span className="text-slate-950 uppercase">{planName}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase">Paid Using</span><span className="text-slate-950 uppercase">{method}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase">Order ID</span><span className="text-slate-950 font-mono">{transactionId.substring(0, 14)}</span></div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase text-slate-950">Total Paid</p>
                                        <p className="text-3xl font-black italic text-slate-950">₹{Number(amount).toLocaleString()}</p>
                                    </div>
                                    
                                    {isManual ? (
                                        <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 text-left">
                                            <p className="text-[11px] font-black text-amber-600 uppercase">Status: Being Checked</p>
                                            <p className="text-[9px] text-amber-500 mt-1 leading-relaxed">Our payment team is checking your transaction ID. This usually takes 15-60 minutes. Please check your dashboard soon.</p>
                                        </div>
                                    ) : (
                                        <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20 text-left">
                                            <p className="text-[11px] font-black text-green-600 uppercase">Status: Ready to Trade</p>
                                            <p className="text-[9px] text-green-500 mt-1 leading-relaxed">Your account is ready! You can find your login details in your trader dashboard.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 flex flex-col items-center gap-2">
                                    <div className="w-full h-10 bg-slate-950 flex items-center justify-center">
                                        <p className="text-[10px] text-white font-mono tracking-[0.5em]">{transactionId.substring(0, 12).toUpperCase()}</p>
                                    </div>
                                    <p className="text-[8px] text-gray-400 uppercase font-bold">Verified Order</p>
                                </div>
                            </div>
                        </ReceiptPrinter.Paper>
                    </ReceiptPrinter.Output>
                </ReceiptPrinter.Root>

                <div className={cn("mt-12 space-y-4 transition-all duration-1000", stage === 'complete' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                    <Button asChild size="lg" className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30">
                        <Link href="/welcome">
                            <LayoutDashboard className="mr-3 h-5 w-5" />
                            Go to My Dashboard
                        </Link>
                    </Button>
                    <div className="flex gap-3">
                        <Button asChild variant="outline" className="flex-1 h-12 bg-white/5 border-white/10 text-white font-bold text-[10px] uppercase rounded-xl">
                            <Link href="/live-chat">Get Help</Link>
                        </Button>
                    </div>
                </div>
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
