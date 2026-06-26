
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
    History, 
    Loader2, 
    CheckCircle, 
    Clock, 
    XCircle,
    ArrowUpRight,
    ArrowDownRight,
    Wallet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { topUpWallet } from './actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from 'next/image';
import { cn } from '@/lib/utils';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

export function WalletView({ profile, transactions, paymentSettings }: { profile: any, transactions: any[], paymentSettings: any }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [amount, setAmount] = useState('');
    const [utr, setUtr] = useState('');

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !utr) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.append('user_id', profile.id);
            formData.append('amount', amount);
            formData.append('utr', utr);

            const res = await topUpWallet(formData);
            if (res.error) {
                toast({ title: "Request Failed", description: res.error, variant: "destructive" });
            } else {
                toast({ title: "Request Submitted", description: "Admin will verify your UTR and update balance shortly." });
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
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Balance & Topup Column */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard className="p-8 border-primary/20 bg-primary/5">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Available Cash</p>
                                <h3 className="text-5xl font-black text-white mt-1">₹{Number(profile.wallet_balance).toLocaleString('en-IN')}</h3>
                                <div className="mt-4 flex items-center gap-2">
                                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">VERIFIED BALANCE</Badge>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">+ 5% Bonus on deposits over ₹10,000</p>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-2xl shadow-2xl">
                                {paymentSettings?.qr_code_url ? (
                                    <Image src={paymentSettings.qr_code_url} alt="Topup QR" width={160} height={160} className="rounded-lg" />
                                ) : (
                                    <div className="w-[160px] h-[160px] bg-slate-100 flex items-center justify-center text-slate-900 font-bold">SCAN & PAY</div>
                                )}
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <form onSubmit={handleTopUp}>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2 text-white"><Wallet className="w-5 h-5 text-primary"/> Pay-In Request</CardTitle>
                                <CardDescription className="text-gray-400">Transfer funds to our UPI and enter details below.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Amount to Top-Up (₹)</Label>
                                        <Input type="number" placeholder="e.g. 5000" value={amount} onChange={(e) => setAmount(e.target.value)} required className="bg-black/20 border-white/10 h-12" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Transaction ID (UTR)</Label>
                                        <Input placeholder="Enter 12-digit UPI UTR" value={utr} onChange={(e) => setUtr(e.target.value)} required className="bg-black/20 border-white/10 h-12" />
                                    </div>
                                </div>
                                <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Transfer To</p>
                                        <p className="font-mono text-white text-sm">{paymentSettings?.upi_id || 'payout@fundedstock'}</p>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => copyToClipboard(paymentSettings?.upi_id)}><Copy className="w-4 h-4 text-primary"/></Button>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isPending || !amount || !utr} className="w-full h-12 font-bold bg-primary text-primary-foreground rounded-xl">
                                    {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Send className="mr-2 h-4 w-4" />}
                                    Submit Verification Request
                                </Button>
                            </CardFooter>
                        </form>
                    </GlassCard>
                </div>

                {/* History Column */}
                <div className="space-y-6">
                    <GlassCard>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-white"><History className="w-4 h-4" /> Activity Log</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="max-h-[500px] overflow-auto">
                                {transactions.length > 0 ? (
                                    <Table>
                                        <TableBody>
                                            {transactions.map((tx) => (
                                                <TableRow key={tx.id} className="border-white/5">
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "p-2 rounded-lg",
                                                                tx.type === 'deposit' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                                            )}>
                                                                {tx.type === 'deposit' ? <ArrowUpRight className="w-4 h-4"/> : <ArrowDownRight className="w-4 h-4"/>}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-white leading-tight">{tx.description || 'Transaction'}</p>
                                                                <p className="text-[10px] text-gray-500 mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-4">
                                                        <p className={cn("text-sm font-bold", tx.amount > 0 ? "text-green-400" : "text-white")}>
                                                            {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                                                        </p>
                                                        <p className="text-[9px] uppercase font-bold tracking-tighter text-gray-500 mt-0.5">{tx.status}</p>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="p-8 text-center text-gray-600 text-sm">No activity recorded yet.</div>
                                )}
                            </div>
                        </CardContent>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
