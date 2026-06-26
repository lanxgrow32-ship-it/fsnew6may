'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
    IndianRupee, 
    Copy, 
    Send, 
    Loader2, 
    Wallet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { topUpWallet } from './actions';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

export function WalletView({ profile, paymentSettings }: { profile: any, paymentSettings: any }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [amount, setAmount] = useState('');
    const [utr, setUtr] = useState('');

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !utr) return;

        startTransition(async () => {
            const res = await topUpWallet(profile.id, parseFloat(amount), utr);
            if (res.error) {
                toast({ title: "Request Failed", description: res.error, variant: "destructive" });
            } else {
                toast({ title: "Request Submitted", description: "Admin will verify your transaction shortly." });
                setAmount('');
                setUtr('');
            }
        });
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard" });
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">Wallet</h2>
                <p className="text-gray-400 text-sm font-medium">Add funds for instant plan activations and entry fees.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="p-8 border-primary/20 bg-primary/5 h-full flex flex-col justify-center text-center md:text-left">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Available Cash</p>
                    <h3 className="text-3xl font-bold text-white mt-1.5 tracking-tight">₹{Number(profile.wallet_balance).toLocaleString('en-IN')}</h3>
                    <div className="mt-8 p-2.5 bg-white rounded-2xl shadow-2xl w-fit mx-auto md:mx-0">
                        {paymentSettings?.qr_code_url ? (
                            <Image src={paymentSettings.qr_code_url} alt="Payment QR" width={160} height={160} className="rounded-lg" />
                        ) : (
                            <div className="w-[160px] h-[160px] bg-slate-100 flex items-center justify-center text-slate-900 font-bold text-[10px]">QR Loading...</div>
                        )}
                    </div>
                </GlassCard>

                <GlassCard className="h-full">
                    <form onSubmit={handleTopUp} className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-white"><Wallet className="w-5 h-5 text-primary"/> Load Wallet</CardTitle>
                            <CardDescription className="text-gray-400 font-medium text-xs">Verify transfer to receive 5% Credit Bonus.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-grow">
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-600 uppercase">Deposit Amount (₹)</Label>
                                    <Input type="number" placeholder="e.g. 5000" value={amount} onChange={(e) => setAmount(e.target.value)} required className="bg-black/20 border-white/10 text-white h-11 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-600 uppercase">UPI Reference (UTR)</Label>
                                    <Input placeholder="Enter 12-digit ID" value={utr} onChange={(e) => setUtr(e.target.value)} required className="bg-black/20 border-white/10 text-white h-11 text-sm font-mono" />
                                </div>
                            </div>
                            <div className="p-3.5 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-gray-700 uppercase">Account</p>
                                    <p className="font-mono text-white text-xs font-bold">{paymentSettings?.upi_id || 'pay@fundedstock'}</p>
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(paymentSettings?.upi_id)}><Copy className="w-3.5 h-3.5 text-primary"/></Button>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isPending || !amount || !utr} className="w-full h-11 font-bold bg-primary text-white rounded-xl shadow-lg text-xs">
                                {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Send className="mr-2 h-3.5 w-3.5" />}
                                Submit Deposit
                            </Button>
                        </CardFooter>
                    </form>
                </GlassCard>
            </div>
            
            <p className="text-center text-[10px] font-bold text-gray-800 uppercase tracking-[0.2em] mt-8">
                Manual Verification Required · SLA: 15 Minutes
            </p>
        </div>
    );
}

