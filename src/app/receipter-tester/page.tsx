
'use client';

import { useState } from 'react';
import { ReceiptPrinter, type ReceiptPrinterStage } from '@/components/ui/receipt-printer';
import { Button } from '@/components/ui/button';
import { FundedStockLogo } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Play, ShieldAlert, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReceiptTester() {
    const [stage, setStage] = useState<ReceiptPrinterStage>("processing");

    const startAnimation = () => {
        setStage("processing");
        // Start printing after delay
        setTimeout(() => setStage("printing"), 1200);
        // Complete printing after animation duration
        setTimeout(() => setStage("complete"), 4500);
    };

    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 font-poppins text-white">
            <div className="fixed top-8 left-8 space-y-2 hidden md:block">
                <h1 className="text-2xl font-black uppercase tracking-tighter">Printer Diagnostic</h1>
                <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Protocol v2.1 Test Grid</p>
            </div>

            <div className="space-y-12 w-full max-w-md flex flex-col items-center relative z-10">
                <ReceiptPrinter.Root stage={stage}>
                    <ReceiptPrinter.Machine>
                        <ReceiptPrinter.Header>
                            <FundedStockLogo className="h-6 w-6 text-primary" />
                            <Badge variant="outline" className="text-[8px] font-bold border-white/10 text-gray-500">Checking payment</Badge>
                        </ReceiptPrinter.Header>

                        <ReceiptPrinter.Screen className={cn(stage === 'complete' && "border-green-500/20")}>
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Session target</p>
                                        <p className="text-sm font-bold text-white">10 Lakh Evaluation</p>
                                    </div>
                                    <p className="text-sm font-bold text-primary">₹12,999</p>
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
                                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.4em]">Official receipt</p>
                                </div>
                                
                                <div className="border-y border-dashed border-slate-300 py-6 space-y-4">
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500">Product</span><span className="text-slate-950">10L Evaluation</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500">Method</span><span className="text-slate-950">Manual UPI</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500">UTR Ref</span><span className="text-slate-950 font-mono text-[9px]">992104558231</span></div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-bold text-slate-950">Final cost</p>
                                        <p className="text-3xl font-black italic text-slate-950">₹12,999</p>
                                    </div>
                                    <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 text-left">
                                        <p className="text-[11px] font-bold text-amber-600 uppercase">Status: Being checked</p>
                                        <p className="text-[9px] text-amber-500 mt-1">Our payment team will verify your UTR shortly.</p>
                                    </div>
                                </div>

                                <div className="pt-6 flex flex-col items-center gap-2">
                                    <div className="w-full h-10 bg-slate-950 flex items-center justify-center">
                                        <p className="text-[10px] text-white font-mono tracking-[0.4em]">FS2-MOBILE-READY</p>
                                    </div>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase">Digital fingerprint verified</p>
                                </div>
                            </div>
                        </ReceiptPrinter.Paper>
                    </ReceiptPrinter.Output>
                </ReceiptPrinter.Root>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <Button onClick={startAnimation} className="h-14 rounded-2xl bg-white text-black font-bold uppercase text-xs tracking-widest shadow-xl">
                        <Play className="mr-2 h-4 w-4" /> Run Animation
                    </Button>
                    <Button onClick={() => setStage('processing')} variant="outline" className="h-14 rounded-2xl border-white/10 text-white font-bold uppercase text-xs tracking-widest">
                        <RefreshCw className="mr-2 h-4 w-4" /> Reset State
                    </Button>
                </div>
            </div>
        </main>
    );
}
