
'use client';

import { useState } from 'react';
import { ReceiptPrinter, type ReceiptPrinterStage } from '@/components/ui/receipt-printer';
import { Button } from '@/components/ui/button';
import { FundedStockLogo } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Play } from 'lucide-react';
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
                <h1 className="text-2xl font-black tracking-tighter">Printer Diagnostic</h1>
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
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-gray-500 tracking-widest mb-1">Account info</p>
                                        <p className="text-sm font-bold text-white truncate">10 Lakh Evaluation</p>
                                    </div>
                                    <p className="text-sm font-bold text-primary">₹12,999</p>
                                </div>
                                <ReceiptPrinter.Status />
                            </div>
                        </ReceiptPrinter.Screen>
                    </ReceiptPrinter.Machine>

                    <ReceiptPrinter.Output>
                        <ReceiptPrinter.Paper>
                            <div className="space-y-4 md:space-y-6 text-center">
                                <div className="space-y-1">
                                    <h2 className="text-xl md:text-2xl font-black tracking-tighter italic text-slate-950">FundedStock</h2>
                                    <p className="text-[8px] font-bold text-gray-500 tracking-[0.2em]">Official receipt</p>
                                </div>
                                
                                <div className="border-y border-dashed border-slate-300 py-3 md:py-6 space-y-3 md:space-y-4">
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500">Trading plan</span><span className="text-slate-950">10L Evaluation</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500">Method</span><span className="text-slate-950">Manual UPI</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500">Order ID</span><span className="text-slate-950 font-mono text-[9px]">992104558231</span></div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-bold text-slate-950">Total paid</p>
                                        <p className="text-2xl md:text-3xl font-black italic text-slate-950">₹12,999</p>
                                    </div>
                                    <div className="bg-amber-500/10 p-3 md:p-4 rounded-xl border border-amber-500/20 text-left">
                                        <p className="text-[10px] md:text-[11px] font-bold text-amber-600">Status: Being checked</p>
                                        <p className="text-[9px] text-amber-500 mt-1">Our payment team will verify your transaction shortly.</p>
                                    </div>
                                </div>

                                <div className="pt-4 md:pt-6 flex flex-col items-center gap-2">
                                    <div className="w-full h-8 md:h-10 bg-slate-950 flex items-center justify-center">
                                        <p className="text-[9px] md:text-[10px] text-white font-mono tracking-[0.4em]">992104558231</p>
                                    </div>
                                    <p className="text-[8px] text-gray-400 font-bold">Thank you for joining</p>
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
