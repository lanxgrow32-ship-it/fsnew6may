
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
    const [planName, setPlanName] = useState<string>('Evaluation plan');
    const [method, setMethod] = useState<string>('wallet');

    useEffect(() => {
        setMounted(true);
        const id = searchParams.get('id') || `TX_${Date.now()}`;
        const amt = searchParams.get('amount') || '0';
        const plan = searchParams.get('plan') || 'Evaluation plan';
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
                            <Badge variant="outline" className="text-[8px] font-bold border-white/10 text-gray-500">Secure payment</Badge>
                        </ReceiptPrinter.Header>

                        <ReceiptPrinter.Screen className={cn(stage === 'complete' && "border-green-500/20")}>
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Account info</p>
                                        <p className="text-sm font-bold text-white truncate">{planName}</p>
                                    </div>
                                    <p className="text-sm font-bold text-primary">₹{Number(amount).toLocaleString()}</p>
                                </div>
                                <ReceiptPrinter.Status />
                            </div>
                        </ReceiptPrinter.Screen>
                    </ReceiptPrinter.Machine>

                    <ReceiptPrinter.Output>
                        <ReceiptPrinter.Paper>
                            <div className="space-y-6 text-center">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black tracking-tighter italic text-slate-950">FundedStock</h2>
                                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.4em]">Payment receipt</p>
                                </div>
                                
                                <div className="border-y border-dashed border-slate-300 py-6 space-y-4">
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500">Trading plan</span><span className="text-slate-950">{planName}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500">Paid using</span><span className="text-slate-950">{method}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500">Order ID</span><span className="text-slate-950 font-mono text-[9px]">{transactionId.substring(0, 14)}</span></div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-bold text-slate-950">Total paid</p>
                                        <p className="text-3xl font-black italic text-slate-950">₹{Number(amount).toLocaleString()}</p>
                                    </div>
                                    
                                    {isManual ? (
                                        <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 text-left">
                                            <p className="text-[11px] font-bold text-amber-600 uppercase">Status: Being checked</p>
                                            <p className="text-[9px] text-amber-500 mt-1 leading-relaxed">Our payment team is checking your transaction ID. This usually takes 15-60 minutes. Please check your dashboard soon.</p>
                                        </div>
                                    ) : (
                                        <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20 text-left">
                                            <p className="text-[11px] font-bold text-green-600 uppercase">Status: Ready to trade</p>
                                            <p className="text-[9px] text-green-500 mt-1 leading-relaxed">Your account is ready! You can find your login details in your trader dashboard.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 flex flex-col items-center gap-2">
                                    <div className="w-full h-10 bg-slate-950 flex items-center justify-center">
                                        <p className="text-[10px] text-white font-mono tracking-[0.4em]">{transactionId.substring(0, 12).toUpperCase()}</p>
                                    </div>
                                    <p className="text-[8px] text-gray-400 font-bold">Thank you for joining</p>
                                </div>
                            </div>
                        </ReceiptPrinter.Paper>
                    </ReceiptPrinter.Output>
                </ReceiptPrinter.Root>

                <div className={cn("mt-12 space-y-4 transition-all duration-1000", stage === 'complete' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                    <Button asChild size="lg" className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30">
                        <Link href="/welcome">
                            <LayoutDashboard className="mr-3 h-5 w-5" />
                            Go to my dashboard
                        </Link>
                    </Button>
                    <div className="flex gap-3">
                        <Button asChild variant="outline" className="flex-1 h-12 bg-white/5 border-white/10 text-white font-bold text-[10px] uppercase rounded-xl">
                            <Link href="/live-chat">Get help</Link>
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
