
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ReceiptPrinter, type ReceiptPrinterStage } from '@/components/ui/receipt-printer';
import { MessageSquare, LogOut, ChevronLeft, ShieldAlert } from 'lucide-react';
import { signOut } from '@/app/actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';

export function PendingView({ profile, pendingAccount }: { profile: any, pendingAccount?: any }) {
    const [stage, setStage] = useState<ReceiptPrinterStage>("processing");

    useEffect(() => {
        // Animation sequence logic
        const timer1 = setTimeout(() => setStage("printing"), 1500);
        const timer2 = setTimeout(() => setStage("complete"), 4500);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, []);

    const planName = pendingAccount?.plan_name || "Evaluation Plan";
    const amountPaid = pendingAccount?.final_amount_paid || 0;
    const utr = pendingAccount?.transaction_id || "N/A";
    const date = new Date().toLocaleDateString('en-IN');

    return (
        <div className="dark min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-700">
                <ReceiptPrinter.Root stage={stage}>
                    <ReceiptPrinter.Machine>
                        <ReceiptPrinter.Header>
                            <FundedStockLogo className="h-6 w-6 text-primary opacity-50" />
                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-white/10 opacity-30">Admin Loop v2.0</Badge>
                        </ReceiptPrinter.Header>

                        <ReceiptPrinter.Screen className={cn(stage === 'complete' && "border-green-500/30 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]")}>
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Terminal Status</p>
                                        <p className="text-sm font-bold text-white truncate">{planName}</p>
                                    </div>
                                    <p className="text-sm font-black text-primary">₹{amountPaid.toLocaleString()}</p>
                                </div>
                                <ReceiptPrinter.Status />
                            </div>
                        </ReceiptPrinter.Screen>
                    </ReceiptPrinter.Machine>

                    <ReceiptPrinter.Output>
                        <ReceiptPrinter.Paper>
                            <div className="space-y-6 text-center">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black uppercase tracking-tighter italic">FundedStock</h2>
                                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.3em]">Official Receipt</p>
                                </div>
                                
                                <div className="border-y border-dashed border-slate-300 py-4 space-y-3">
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase">Item</span><span className="text-slate-900 uppercase">{planName}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase">Date</span><span className="text-slate-900">{date}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500 uppercase">UTR Ref</span><span className="text-slate-900 font-mono">{utr}</span></div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase">Total Paid</p>
                                        <p className="text-2xl font-black italic">₹{amountPaid.toLocaleString()}</p>
                                    </div>
                                    
                                    <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Status: Awaiting Approval</p>
                                        <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">Our risk desk is verifying your UTR. Your terminal credentials will be released shortly.</p>
                                    </div>
                                </div>

                                <div className="pt-4 flex flex-col items-center gap-2">
                                    <div className="w-full h-8 bg-slate-950 flex items-center justify-center">
                                        <p className="text-[9px] text-white font-mono tracking-[0.4em]">990184422312003</p>
                                    </div>
                                    <p className="text-[8px] text-gray-400 uppercase font-bold">Secure Verification Chain</p>
                                </div>
                            </div>
                        </ReceiptPrinter.Paper>
                    </ReceiptPrinter.Output>
                </ReceiptPrinter.Root>

                <div className={cn("mt-12 space-y-4 transition-all duration-1000", stage === 'complete' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button asChild className="flex-1 h-12 bg-white text-black hover:bg-gray-100 font-black uppercase text-[10px] tracking-widest rounded-2xl">
                            <Link href="https://wa.me/917020749658" target="_blank">
                                <MessageSquare className="mr-2 h-4 w-4" /> Help Desk
                            </Link>
                        </Button>
                        <form action={signOut} className="flex-1">
                            <Button variant="outline" className="w-full h-12 bg-black/20 border-white/10 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl">
                                <LogOut className="mr-2 h-4 w-4"/> Terminate
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
