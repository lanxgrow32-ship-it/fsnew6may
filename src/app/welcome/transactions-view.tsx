'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    ArrowUpRight, 
    ArrowDownRight, 
    ShoppingCart, 
    Wallet, 
    Gift, 
    History,
    RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden', className)}>
        {children}
    </div>
);

type Transaction = {
    id: string;
    amount: number;
    type: 'deposit' | 'purchase' | 'bonus' | 'refund';
    status: 'pending' | 'completed' | 'failed';
    description: string;
    gateway_transaction_id: string | null;
    created_at: string;
};

export function TransactionsView({ transactions }: { transactions: Transaction[] }) {
    const TransactionTable = ({ items }: { items: Transaction[] }) => (
        <div className="overflow-hidden rounded-xl border border-white/5">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-gray-400 font-bold uppercase text-[9px] tracking-widest h-12">Transaction</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase text-[9px] tracking-widest h-12">Date</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase text-[9px] tracking-widest h-12">Ref ID</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase text-[9px] tracking-widest h-12">Status</TableHead>
                        <TableHead className="text-right text-gray-400 font-bold uppercase text-[9px] tracking-widest h-12">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length > 0 ? items.map((tx) => (
                        <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02]">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        tx.type === 'deposit' ? "bg-green-500/10 text-green-400" : 
                                        tx.type === 'purchase' ? "bg-primary/10 text-primary" :
                                        tx.type === 'bonus' ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                                    )}>
                                        {tx.type === 'deposit' ? <ArrowUpRight className="w-4 h-4"/> : 
                                         tx.type === 'purchase' ? <ShoppingCart className="w-4 h-4"/> :
                                         tx.type === 'bonus' ? <Gift className="w-4 h-4"/> : <RefreshCw className="w-4 h-4"/>}
                                    </div>
                                    <p className="text-sm font-bold text-white leading-tight">{tx.description || 'Transaction'}</p>
                                </div>
                            </TableCell>
                            <TableCell className="text-gray-400 text-xs">
                                {new Date(tx.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-mono text-[10px] text-gray-500">
                                {tx.gateway_transaction_id || tx.id.substring(0, 8)}
                            </TableCell>
                            <TableCell>
                                <div className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full w-fit border",
                                    tx.status === 'completed' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                    tx.status === 'pending' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                    "bg-red-500/10 text-red-400 border-red-500/20"
                                )}>
                                    {tx.status}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <p className={cn("text-sm font-black", tx.amount > 0 ? "text-green-400" : "text-white")}>
                                    {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                                </p>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-gray-500 text-sm">No activity recorded in this category.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    const deposits = transactions.filter(t => t.type === 'deposit');
    const purchases = transactions.filter(t => t.type === 'purchase');
    const bonuses = transactions.filter(t => t.type === 'bonus');

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Ledger</h2>
                    <p className="text-gray-400 mt-1 text-lg">Full audit trail of your financial activity.</p>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-black/40 border border-white/5 p-1 rounded-xl mb-8 h-auto flex flex-wrap">
                    <TabsTrigger value="all" className="flex items-center gap-2 py-2 px-4 rounded-lg data-[state=active]:bg-white/10">
                        <History className="w-4 h-4"/> All
                    </TabsTrigger>
                    <TabsTrigger value="purchases" className="flex items-center gap-2 py-2 px-4 rounded-lg data-[state=active]:bg-white/10">
                        <ShoppingCart className="w-4 h-4"/> Purchases
                    </TabsTrigger>
                    <TabsTrigger value="deposits" className="flex items-center gap-2 py-2 px-4 rounded-lg data-[state=active]:bg-white/10">
                        <Wallet className="w-4 h-4"/> Deposits
                    </TabsTrigger>
                    <TabsTrigger value="bonuses" className="flex items-center gap-2 py-2 px-4 rounded-lg data-[state=active]:bg-white/10">
                        <Gift className="w-4 h-4"/> Bonuses
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                    <TransactionTable items={transactions} />
                </TabsContent>
                <TabsContent value="purchases" className="mt-0">
                    <TransactionTable items={purchases} />
                </TabsContent>
                <TabsContent value="deposits" className="mt-0">
                    <TransactionTable items={deposits} />
                </TabsContent>
                <TabsContent value="bonuses" className="mt-0">
                    <TransactionTable items={bonuses} />
                </TabsContent>
            </Tabs>
        </div>
    );
}