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
    Wallet,
    Sparkles
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
                <p className="text-gray-400 text-sm font-medium">Add funds for faster account activations and competition fees.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="p-8 border-primary/20 bg-primary/5 h-full flex flex-col justify-center text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Available Cash</p>
                            <h3 className="text-3xl font-bold text-white tracking-tight">₹{Number(profile.wallet_balance).toLocaleString('en-IN')}</h3>
                        </div>
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 py-1.5 px-3 rounded-full flex items-center gap-2 font-bold animate-pulse">
                            <Sparkles className="w-3.5 h-3.5" /> 5% Extra Bonus
                        </Badge>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-6">
                        <div className="bg-white p-3 rounded-2xl shadow-2xl w-fit">
                            {paymentSettings?.qr_code_url ? (
                                <Image src={paymentSettings.qr_code_url} alt="Payment QR" width={200} height={200} className="rounded-lg" />
                            ) : (
                                <div className="w-[200px] h-[200px] bg-slate-100 flex items-center justify-center text-slate-900 font-bold text-[10px]">QR Loading...</div>
                            )}
                        </div>
                        
                        <div className="w-full max-w-[240px] space-y-2">
                             <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center">UPI Address</p>
                             <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between shadow-xl">
                                <p className="font-mono text-white text-xs font-bold truncate max-w-[150px]">{paymentSettings?.upi_id || 'pay@fundedstock'}</p>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-white" onClick={() => copyToClipboard(paymentSettings?.upi_id)}><Copy className="w-3.5 h-3.5"/></Button>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="h-full">
                    <form onSubmit={handleTopUp} className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-white"><Wallet className="w-5 h-5 text-primary"/> Load Wallet</CardTitle>
                            <CardDescription className="text-gray-400 font-medium text-xs">Submit your reference to credit your wallet instantly.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 flex-grow">
                            <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Deposit Bonus Active</p>
                                    <p className="text-[11px] text-gray-500 font-medium">Get 5% extra cash added to every successful top-up.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-600 uppercase">Deposit Amount (₹)</Label>
                                    <Input type="number" placeholder="e.g. 5000" value={amount} onChange={(e) => setAmount(e.target.value)} required className="bg-black/20 border-white/10 text-white h-12 text-base font-bold" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-600 uppercase">UPI Reference (UTR)</Label>
                                    <Input placeholder="Enter 12-digit ID" value={utr} onChange={(e) => setUtr(e.target.value)} required className="bg-black/20 border-white/10 text-white h-12 text-sm font-mono" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0 pb-8">
                            <Button type="submit" disabled={isPending || !amount || !utr} className="w-full h-12 font-bold bg-primary text-white rounded-xl shadow-xl shadow-primary/20 text-xs">
                                {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Send className="mr-2 h-3.5 w-3.5" />}
                                Confirm Deposit Request
                            </Button>
                        </CardFooter>
                    </form>
                </GlassCard>
            </div>
            
            <p className="text-center text-[10px] font-bold text-gray-800 uppercase tracking-[0.2em] mt-8">
                Official Financial Gateway · Professional Performance Hub
            </p>
        </div>
    );
}