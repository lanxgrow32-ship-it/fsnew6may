'use client';

import { useState, useMemo } from 'react';
import { 
    ArrowUpRight, 
    ShoppingCart, 
    Wallet, 
    Gift, 
    History,
    RefreshCw,
    Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Transaction = {
    id: string;
    amount: number;
    type: 'deposit' | 'purchase' | 'bonus' | 'refund';
    status: 'pending' | 'completed' | 'failed';
    description: string;
    gateway_transaction_id: string | null;
    created_at: string;
    bonus_amount?: number; // Added to support the split view logic
};

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

export function TransactionsView({ transactions }: { transactions: Transaction[] }) {
    const [filter, setFilter] = useState('all');

    // Logic to expand transactions that have bonuses into two separate visual items
    const displayTransactions = useMemo(() => {
        const expanded: any[] = [];
        
        transactions.forEach(tx => {
            // First, add the main transaction
            expanded.push({ ...tx, isBonusEntry: false });
            
            // If it's a deposit with a bonus, create a virtual bonus entry
            if (tx.type === 'deposit' && tx.bonus_amount && tx.bonus_amount > 0) {
                expanded.push({
                    ...tx,
                    id: `${tx.id}-bonus`,
                    amount: tx.bonus_amount,
                    type: 'bonus',
                    description: 'Credit Bonus',
                    isBonusEntry: true
                });
            }
        });

        if (filter === 'all') return expanded;
        return expanded.filter(tx => tx.type === filter);
    }, [transactions, filter]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'deposit': return <ArrowUpRight className="w-5 h-5"/>;
            case 'purchase': return <ShoppingCart className="w-5 h-5"/>;
            case 'bonus': return <Gift className="w-5 h-5"/>;
            default: return <RefreshCw className="w-5 h-5"/>;
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'deposit': return "bg-green-500/10 text-green-400";
            case 'purchase': return "bg-primary/10 text-primary";
            case 'bonus': return "bg-purple-500/10 text-purple-400";
            default: return "bg-red-500/10 text-red-400";
        }
    };

    const TransactionItem = ({ tx }: { tx: any }) => (
        <div className="group flex items-center justify-between p-5 bg-black/20 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors w-full overflow-hidden">
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className={cn("p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-105", getIconColor(tx.type))}>
                    {getIcon(tx.type)}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{tx.description || 'Transaction'}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-gray-500 font-bold">{new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                        {!tx.isBonusEntry && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <p className="text-[10px] text-gray-500 font-mono font-bold truncate max-w-[100px]">
                                    {tx.gateway_transaction_id || tx.id.substring(0, 8)}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="text-right shrink-0 ml-4 flex flex-col items-end">
                <p className={cn("text-base font-bold", tx.amount > 0 ? "text-green-400" : "text-white")}>
                    {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                </p>
                <div className="mt-1">
                    <Badge variant="outline" className={cn(
                        "capitalize text-[9px] h-4 py-0 px-1.5 font-bold border-none",
                        tx.status === 'completed' ? "text-green-500/70 bg-green-500/5" :
                        tx.status === 'pending' ? "text-amber-500/70 bg-amber-500/5" :
                        "text-red-500/70 bg-red-500/5"
                    )}>
                        {tx.status}
                    </Badge>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Transaction History</h2>
                    <p className="text-gray-400 mt-1 text-base font-medium">Review your account's financial audit trail.</p>
                </div>

                <div className="w-full md:w-56">
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-full h-12 bg-black/40 border-white/10 rounded-xl text-sm font-bold text-white focus:ring-primary/50">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <SelectValue placeholder="All Transactions" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                            <SelectItem value="all" className="text-sm font-bold">All Transactions</SelectItem>
                            <SelectItem value="purchase" className="text-sm font-bold">Purchases</SelectItem>
                            <SelectItem value="deposit" className="text-sm font-bold">Deposits</SelectItem>
                            <SelectItem value="bonus" className="text-sm font-bold">Bonuses</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <GlassCard>
                <div className="flex flex-col">
                    {displayTransactions.length > 0 ? (
                        displayTransactions.map((tx) => (
                            <TransactionItem key={tx.id} tx={tx} />
                        ))
                    ) : (
                        <div className="py-24 text-center">
                            <div className="mx-auto h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <History className="h-8 w-8 text-gray-700" />
                            </div>
                            <h3 className="text-white font-bold">No Records Found</h3>
                            <p className="text-gray-500 text-sm mt-1">Try changing your filter settings.</p>
                        </div>
                    )}
                </div>
            </GlassCard>

            <p className="text-center text-[10px] font-bold text-gray-700 uppercase tracking-widest">
                End of encrypted ledger
            </p>
        </div>
    );
}