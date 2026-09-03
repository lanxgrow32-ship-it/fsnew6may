
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
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 font-poppins text-white">
            <div className="fixed top-8 left-8 space-y-2">
                <h1 className="text-2xl font-black uppercase tracking-tighter">Printer Diagnostic</h1>
                <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Protocol v2.1 Test Grid</p>
            </div>

            <div className="space-y-12 w-full max-w-md flex flex-col items-center relative z-10">
                <ReceiptPrinter.Root stage={stage}>
                    <ReceiptPrinter.Machine>
                        <ReceiptPrinter.Header>
                            <FundedStockLogo className="h-6 w-6 text-primary" />
                            <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-gray-500">Manual verification</Badge>
                        </ReceiptPrinter.Header>

                        <ReceiptPrinter.Screen className={cn(stage === 'complete' && "border-green-500/20")}>
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Session Target</p>
                                        <p className="text-sm font-bold text-white uppercase">10 Lakh Evaluation</p>
                                    </div>
                                    <p className="text-sm font-black text-primary">₹12,999</p>
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
                                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.4em]">Official Submission Receipt</p>
                                </div>
                                
                                <div className="border-y border-dashed border-slate-300 py-6 space-y-4">
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase">Product</span><span className="text-slate-950 uppercase">10L Evaluation</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase">Method</span><span className="text-slate-950 uppercase">Manual UPI</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase">UTR Ref</span><span className="text-slate-950 font-mono">992104558231</span></div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase text-slate-950">Final Cost</p>
                                        <p className="text-3xl font-black italic text-slate-950">₹12,999</p>
                                    </div>
                                    <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 text-left">
                                        <p className="text-[11px] font-black text-amber-600 uppercase">Status: PENDING REVIEW</p>
                                        <p className="text-[9px] text-amber-500 mt-1">Our risk desk will verify your UTR shortly.</p>
                                    </div>
                                </div>

                                <div className="pt-6 flex flex-col items-center gap-2">
                                    <div className="w-full h-10 bg-slate-950 flex items-center justify-center">
                                        <p className="text-[10px] text-white font-mono tracking-[0.5em]">FS2-PROTOCOL-SECURED</p>
                                    </div>
                                    <p className="text-[8px] text-gray-400 uppercase font-black">Digital Fingerprint Verified</p>
                                </div>
                            </div>
                        </ReceiptPrinter.Paper>
                    </ReceiptPrinter.Output>
                </ReceiptPrinter.Root>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <Button onClick={startAnimation} className="h-14 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest shadow-xl">
                        <Play className="mr-2 h-4 w-4" /> Run Animation
                    </Button>
                    <Button onClick={() => setStage('processing')} variant="outline" className="h-14 rounded-2xl border-white/10 text-white font-black uppercase text-xs tracking-widest">
                        <RefreshCw className="mr-2 h-4 w-4" /> Reset State
                    </Button>
                </div>
            </div>
        </main>
    );
}
