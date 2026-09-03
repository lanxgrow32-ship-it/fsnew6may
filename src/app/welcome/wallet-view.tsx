
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
    ShieldCheck,
    Coins,
    ShieldAlert,
    Info,
    Cpu,
    ArrowUpRight,
    TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { topUpWallet, initiateGatewayPayment, processCryptoWalletTopUp } from './actions';
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
    
    // Top-up State
    const [amount, setAmount] = useState('');
    const [utr, setUtr] = useState('');
    const [txId, setTxId] = useState('');
    const [methodTab, setMethodTab] = useState<'gateway' | 'crypto' | 'manual'>('gateway');

    const parsedAmount = parseFloat(amount) || 0;
    const isBelowMin = parsedAmount > 0 && parsedAmount < 10000;
    
    // Fee Calculations (v7.0: Zero Fee Model)
    const finalAmountToPay = parsedAmount;
    const cryptoUsdtToPay = parseFloat((parsedAmount / 96).toFixed(2));

    const activeGateway = paymentSettings?.active_payment_gateway || 'manual';
    const walletAddress = paymentSettings?.usdt_wallet_address || 'T...';

    const handleManualTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !utr || isBelowMin) return;

        startTransition(async () => {
            const res = await topUpWallet(profile.id, parsedAmount, utr);
            if (res.error) {
                toast({ title: "Request failed", description: res.error, variant: "destructive" });
            } else {
                toast({ title: "Request submitted", description: "Verification in progress. Credits applied shortly." });
                setAmount('');
                setUtr('');
            }
        });
    };

    const handleAutoTopUp = async () => {
        if (!amount || isBelowMin) {
            toast({ title: "Min deposit: ₹10,000", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            const res = await initiateGatewayPayment(profile.id, { title: 'WALLET_TOPUP', price: parsedAmount }, activeGateway);
            if (res.error) {
                toast({ title: "Gateway error", description: res.error, variant: "destructive" });
            } else if (res.redirectUrl) {
                window.location.href = res.redirectUrl;
            }
        });
    }

    const handleCryptoTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || isBelowMin || !txId.trim()) return;

        startTransition(async () => {
            const res = await processCryptoWalletTopUp(profile.id, parsedAmount, txId);
            if (res.error) {
                toast({ title: "Verification failed", description: res.error, variant: "destructive" });
            } else {
                toast({ title: "Update success!", description: "Wallet balance and bonus credited." });
                setAmount('');
                setTxId('');
            }
        });
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
            {/* Balance Hero */}
            <GlassCard className="p-8 border-primary/20 bg-primary/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Available liquidity</p>
                        <h2 className="text-5xl font-black text-white tracking-tighter">₹{Number(profile.wallet_balance || 0).toLocaleString('en-IN')}</h2>
                    </div>
                    <div className="text-center md:text-right">
                         <Badge className="bg-primary/20 text-primary border-primary/20 px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider mb-2">Internal wallet v2.0</Badge>
                         <p className="text-[9px] text-gray-600 font-bold uppercase">Wallet ID: {profile.wallet_id}</p>
                    </div>
                </div>
            </GlassCard>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Recharge center</h2>
                    <p className="text-gray-400 text-sm font-medium">Recharge your wallet to purchase evaluation plans instantly. Now with 0% fees.</p>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-2xl p-1 flex items-center shadow-2xl">
                    <button onClick={() => setMethodTab('gateway')} className={cn("px-5 h-9 rounded-xl text-[10px] font-bold uppercase transition-all", methodTab === 'gateway' ? "bg-primary text-white" : "text-gray-500")}>Gateway</button>
                    <button onClick={() => setMethodTab('crypto')} className={cn("px-5 h-9 rounded-xl text-[10px] font-bold uppercase transition-all", methodTab === 'crypto' ? "bg-green-600 text-white" : "text-gray-500")}>Crypto</button>
                    <button onClick={() => setMethodTab('manual')} className={cn("px-5 h-9 rounded-xl text-[10px] font-bold uppercase transition-all", methodTab === 'manual' ? "bg-purple-600 text-white" : "text-gray-500")}>Manual</button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {methodTab === 'gateway' && (
                    <GlassCard className="p-8 border-primary/20 bg-primary/5 flex flex-col md:flex-row gap-12 items-center animate-in fade-in zoom-in-95">
                        <div className="flex-1 space-y-6">
                            <div className="p-3 rounded-2xl bg-primary/20 text-primary border border-primary/20 w-fit"><Zap className="w-6 h-6" /></div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Standard gateway</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">Deposit via automated UPI. Zero surcharges applied on this method.</p>
                            </div>
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label className={cn("text-[10px] font-bold uppercase", isBelowMin ? "text-red-500" : "text-gray-500")}>Top-up amount (INR)</Label>
                                    <Input type="number" placeholder="Min ₹10,000" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-black/40 border-white/10 text-white h-12 text-lg font-bold" />
                                </div>
                                {parsedAmount >= 10000 && (
                                    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                                        <div className="flex justify-between text-xs font-bold"><span className="text-gray-500 uppercase">Gateway fee</span><span className="text-green-500">0%</span></div>
                                        <div className="flex justify-between text-sm font-black border-t border-white/5 pt-3"><span className="text-white uppercase">Total to pay</span><span className="text-primary">₹{finalAmountToPay.toLocaleString()}</span></div>
                                    </div>
                                )}
                                <Button onClick={handleAutoTopUp} disabled={isPending || !amount || isBelowMin} className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20">
                                    {isPending ? <Loader2 className="animate-spin h-5 w-5 mr-2"/> : <Zap className="mr-2 h-4 w-4" />} Initiate recharge
                                </Button>
                            </div>
                        </div>
                        <div className="shrink-0 w-full md:w-64"><div className="bg-black/40 p-6 rounded-3xl border border-white/5 text-center space-y-4"><div className="flex justify-center"><Sparkles className="text-primary w-8 h-8"/></div><p className="text-[10px] font-bold text-white uppercase tracking-widest leading-relaxed">A 5% loyalty bonus is credited on all deposits above ₹10,000.</p></div></div>
                    </GlassCard>
                )}

                {methodTab === 'crypto' && (
                    <GlassCard className="p-0 border-green-500/20 bg-green-500/5 animate-in fade-in zoom-in-95">
                        <div className="flex flex-col md:flex-row">
                            <div className="p-8 md:w-[320px] bg-black/40 border-b md:border-b-0 md:border-r border-white/5 space-y-8">
                                <div className="space-y-2"><div className="h-10 w-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/20"><Coins className="h-5 w-5" /></div><h3 className="text-xl font-black text-white uppercase tracking-tighter">Crypto deposit</h3></div>
                                <div className="space-y-3"><p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">TRC-20 address</p><div className="p-4 bg-black/60 rounded-2xl border border-white/5 text-xs font-mono font-bold text-white break-all text-center">{walletAddress}</div><Button variant="outline" className="w-full h-9 rounded-xl border-white/10 bg-white/5 text-[9px] font-bold uppercase tracking-widest" onClick={() => { navigator.clipboard.writeText(walletAddress); toast({title: "Address copied"}); }}>Copy address</Button></div>
                            </div>
                            <form onSubmit={handleCryptoTopUp} className="flex-1 p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-gray-500 uppercase">Recharge amount (INR)</Label>
                                        <Input type="number" placeholder="Min ₹10,000" value={amount} onChange={(e) => setAmount(e.target.value)} required className="bg-black/20 border-white/10 text-white h-12 text-sm font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-green-400 uppercase">Pay in USDT (96 Rate)</Label>
                                        <div className="h-12 flex items-center justify-between px-4 bg-black/40 border border-white/10 rounded-xl text-white font-black font-mono text-sm">
                                            {cryptoUsdtToPay} <span className="text-[9px] opacity-40">USDT</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-gray-500 uppercase">Transaction hash (TxID)</Label>
                                    <Input placeholder="Paste hash here" value={txId} onChange={(e) => setTxId(e.target.value)} required className="bg-black/20 border-white/10 text-white h-14 font-mono text-xs focus:ring-green-500/50" />
                                </div>
                                <Button type="submit" disabled={isPending || !amount || !txId || isBelowMin} className="w-full h-16 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl shadow-xl shadow-green-900/20 text-xs uppercase tracking-widest">
                                    {isPending ? <Loader2 className="animate-spin h-5 w-5 mr-2"/> : <ShieldCheck className="mr-2 h-4 w-4" />} Verify & credit INR {parsedAmount.toLocaleString()}
                                </Button>
                                <p className="text-[9px] text-center text-gray-600 font-bold uppercase">You will receive the full INR amount + 5% Bonus (if eligible).</p>
                            </form>
                        </div>
                    </GlassCard>
                )}

                {methodTab === 'manual' && (
                    <GlassCard className="p-8 border-white/5 bg-black/20 animate-in fade-in zoom-in-95">
                        <div className="flex flex-col md:flex-row items-center gap-12">
                             <div className="shrink-0 flex flex-col items-center gap-6">
                                <div className="bg-white p-2 rounded-2xl shadow-2xl">{paymentSettings?.qr_code_url ? <Image src={paymentSettings.qr_code_url} alt="Manual QR" width={180} height={180} /> : <div className="w-[180px] h-[180px] flex items-center justify-center text-slate-900 font-bold text-[10px]">QR loading...</div>}</div>
                                <p className="font-mono text-xs font-bold text-white tracking-tight">{paymentSettings?.upi_id || 'pay@fundedstock'}</p>
                             </div>
                             <form onSubmit={handleManualTopUp} className="flex-1 space-y-6 w-full">
                                <div className="space-y-4">
                                    <div className="space-y-2"><Label className={cn("text-[10px] font-bold uppercase", isBelowMin ? "text-red-500" : "text-gray-500")}>Requested credit (INR)</Label><Input type="number" placeholder="Min ₹10,000" value={amount} onChange={(e) => setAmount(e.target.value)} required className="bg-black/20 border-white/10 text-white h-12 text-sm font-bold" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-bold text-gray-500 uppercase">Transaction ID (UTR)</Label><Input placeholder="12-digit UPI reference" value={utr} onChange={(e) => setUtr(e.target.value)} required className="bg-black/20 border-white/10 text-white h-12 text-sm font-mono" /></div>
                                    {parsedAmount >= 10000 && (
                                        <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl flex justify-between items-center"><span className="text-[10px] font-bold text-green-500 uppercase">Pay exactly</span><span className="text-sm font-black text-white">₹{finalAmountToPay.toLocaleString()}</span></div>
                                    )}
                                </div>
                                <Button type="submit" disabled={isPending || !amount || !utr || isBelowMin} variant="outline" className="w-full h-12 font-bold border-white/10 hover:bg-white/5 text-white text-[10px] uppercase tracking-widest">{isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Send className="mr-2 h-3.5 w-3.5" />} Submit request</Button>
                             </form>
                        </div>
                    </GlassCard>
                )}
            </div>
        </div>
    );
}
