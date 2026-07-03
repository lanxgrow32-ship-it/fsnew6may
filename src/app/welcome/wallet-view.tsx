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
    Sparkles,
    AlertCircle,
    Zap,
    ExternalLink,
    ShieldCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { topUpWallet } from './actions';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

    const parsedAmount = parseFloat(amount) || 0;
    const isBelowMin = parsedAmount > 0 && parsedAmount < 10000;

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !utr || isBelowMin) return;

        startTransition(async () => {
            const res = await topUpWallet(profile.id, parsedAmount, utr);
            if (res.error) {
                toast({ title: "Request Failed", description: res.error, variant: "destructive" });
            } else {
                toast({ title: "Request Submitted", description: "Your transaction is being verified. Funds will be credited shortly." });
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
                <h2 className="text-2xl font-bold text-white tracking-tight">Express Wallet</h2>
                <p className="text-gray-400 text-sm font-medium">Add funds for instant activations via our secure payment gateway.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Method 1: Automated Gateway (Cashfree) */}
                <GlassCard className="p-8 border-primary/20 bg-primary/5 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="p-3 rounded-2xl bg-primary/20 text-primary border border-primary/20 shadow-[0_0_30px_rgba(139,44,245,0.2)]">
                                <Zap className="w-6 h-6" />
                            </div>
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 font-bold px-3 py-1">Instant Credits</Badge>
                        </div>
                        
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Private Wallet ID</p>
                            <div className="flex items-center gap-3">
                                <h3 className="text-4xl font-black text-white tracking-tighter">{profile.wallet_id || 'Generating...'}</h3>
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(profile.wallet_id?.toString())} className="h-8 w-8 text-gray-500 hover:text-white"><Copy className="w-4 h-4"/></Button>
                            </div>
                            <p className="text-xs text-gray-400 font-medium">This ID identifies your account on our official payment portal.</p>
                        </div>

                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-primary">
                                <Sparkles className="w-3.5 h-3.5" /> 5% Bonus Protocol Active
                            </div>
                            <p className="text-[10px] text-gray-500 leading-relaxed">A 5% cash bonus is automatically credited to all wallet deposits of ₹10,000 or more via our official portal.</p>
                        </div>
                    </div>

                    <div className="pt-8">
                        <Button asChild className="w-full h-14 text-base font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Link href={`https://www.fundedstock.shop/topup?wallet_id=${profile.wallet_id}`} target="_blank">
                                Pay via Official Portal <ExternalLink className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <p className="text-[9px] text-center text-gray-600 mt-3 font-bold uppercase tracking-widest">Gateway Provider: Cashfree Payments</p>
                    </div>
                </GlassCard>

                {/* Method 2: Manual UPI */}
                <GlassCard className="p-8 border-white/5 bg-black/20">
                    <div className="space-y-8">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Wallet className="w-4 h-4 text-purple-400"/> Manual UPI Deposit</h3>
                            <p className="text-xs text-gray-500">Scan and send reference manually. Verification takes ~30 mins.</p>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-6 py-4">
                            <div className="bg-white p-2 rounded-xl shadow-2xl">
                                {paymentSettings?.qr_code_url ? (
                                    <Image src={paymentSettings.qr_code_url} alt="Manual QR" width={160} height={160} className="rounded-lg" />
                                ) : (
                                    <div className="w-[160px] h-[160px] bg-slate-100 flex items-center justify-center text-slate-900 font-bold text-[10px]">QR Loading...</div>
                                )}
                            </div>
                            <div className="w-full space-y-2">
                                <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                                    <p className="font-mono text-white text-[10px] font-bold truncate">{paymentSettings?.upi_id || 'pay@fundedstock'}</p>
                                    <button type="button" onClick={() => copyToClipboard(paymentSettings?.upi_id)} className="text-gray-500 hover:text-white transition-colors"><Copy className="w-4 h-4"/></button>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleTopUp} className="space-y-4">
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label className={cn("text-[10px] font-bold uppercase", isBelowMin ? "text-red-400" : "text-gray-600")}>Amount (₹)</Label>
                                    <Input type="number" placeholder="Min ₹10,000" value={amount} onChange={(e) => setAmount(e.target.value)} required className="bg-black/20 border-white/10 text-white h-11 text-sm font-bold" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-600 uppercase">Transaction ID (UTR)</Label>
                                    <Input placeholder="12-digit reference" value={utr} onChange={(e) => setUtr(e.target.value)} required className="bg-black/20 border-white/10 text-white h-11 text-sm font-mono" />
                                </div>
                            </div>
                            <Button type="submit" disabled={isPending || !amount || !utr || isBelowMin} variant="outline" className="w-full h-11 font-bold border-white/10 hover:bg-white/5 text-white">
                                {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Send className="mr-2 h-3.5 w-3.5" />}
                                Submit Manually
                            </Button>
                        </form>
                    </div>
                </GlassCard>
            </div>
            
            <div className="max-w-xl mx-auto pt-10">
                <GlassCard className="p-6 border-green-500/10 bg-green-500/5">
                    <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                            <ShieldCheck className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white">Secure Transfer Protocol</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">All wallet transactions are encrypted. Deposits via the portal are audited instantly through the Cashfree payment bridge, while manual deposits take standard verification time.</p>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
