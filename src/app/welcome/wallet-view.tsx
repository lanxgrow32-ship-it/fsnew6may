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
        <div className="space-y-12 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">Wallet Balance</h2>
                <p className="text-gray-400 text-base mt-1 font-medium">Add funds to your wallet to purchase new plans and join competitions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GlassCard className="p-8 border-primary/20 bg-primary/5 h-full flex flex-col justify-center">
                    <p className="text-xs font-semibold text-gray-500">Current balance</p>
                    <h3 className="text-3xl font-bold text-white mt-2 tracking-tight">₹{Number(profile.wallet_balance).toLocaleString('en-IN')}</h3>
                    <div className="mt-8 p-3 bg-white rounded-2xl shadow-2xl w-fit mx-auto md:mx-0">
                        {paymentSettings?.qr_code_url ? (
                            <Image src={paymentSettings.qr_code_url} alt="Payment QR" width={180} height={180} className="rounded-lg" />
                        ) : (
                            <div className="w-[180px] h-[180px] bg-slate-100 flex items-center justify-center text-slate-900 font-bold">QR Loading...</div>
                        )}
                    </div>
                </GlassCard>

                <GlassCard className="h-full">
                    <form onSubmit={handleTopUp} className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-white"><Wallet className="w-5 h-5 text-primary"/> Submit Deposit</CardTitle>
                            <CardDescription className="text-gray-400 font-medium text-sm">Transfer funds and enter details below.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 flex-grow">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-500">Amount (₹)</Label>
                                    <Input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} required className="bg-black/20 border-white/10 text-white h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-500">Transaction ID (UTR)</Label>
                                    <Input placeholder="Enter 12-digit UTR" value={utr} onChange={(e) => setUtr(e.target.value)} required className="bg-black/20 border-white/10 text-white h-11" />
                                </div>
                            </div>
                            <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-semibold text-gray-600">Transfer To</p>
                                    <p className="font-mono text-white text-xs font-bold">{paymentSettings?.upi_id || 'pay@fundedstock'}</p>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => copyToClipboard(paymentSettings?.upi_id)}><Copy className="w-4 h-4 text-primary"/></Button>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isPending || !amount || !utr} className="w-full h-12 font-bold bg-primary text-white rounded-xl shadow-xl shadow-primary/20 text-sm">
                                {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Send className="mr-2 h-4 w-4" />}
                                Submit Deposit Request
                            </Button>
                        </CardFooter>
                    </form>
                </GlassCard>
            </div>
            
            <p className="text-center text-xs font-semibold text-gray-700 mt-8">
                Manual verification required · Usually verified within 15-30 mins
            </p>
        </div>
    );
}