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
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/20">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-gray-400 font-semibold h-12 pl-6">Transaction</TableHead>
                        <TableHead className="text-gray-400 font-semibold h-12">Date</TableHead>
                        <TableHead className="text-gray-400 font-semibold h-12">Reference ID</TableHead>
                        <TableHead className="text-gray-400 font-semibold h-12">Status</TableHead>
                        <TableHead className="text-right text-gray-400 font-semibold h-12 pr-6">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length > 0 ? items.map((tx) => (
                        <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02]">
                            <TableCell className="pl-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg shrink-0",
                                        tx.type === 'deposit' ? "bg-green-500/10 text-green-400" : 
                                        tx.type === 'purchase' ? "bg-primary/10 text-primary" :
                                        tx.type === 'bonus' ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                                    )}>
                                        {tx.type === 'deposit' ? <ArrowUpRight className="w-5 h-5"/> : 
                                         tx.type === 'purchase' ? <ShoppingCart className="w-5 h-5"/> :
                                         tx.type === 'bonus' ? <Gift className="w-5 h-5"/> : <RefreshCw className="w-5 h-5"/>}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white leading-tight">{tx.description || 'Transaction'}</p>
                                        <p className="text-xs text-gray-500 capitalize mt-1">{tx.type}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-gray-400 text-sm">
                                {new Date(tx.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-gray-500">
                                {tx.gateway_transaction_id || tx.id.substring(0, 8)}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn(
                                    "capitalize text-[10px] py-0 px-2",
                                    tx.status === 'completed' ? "text-green-400 border-green-500/20 bg-green-500/5" :
                                    tx.status === 'pending' ? "text-amber-400 border-amber-500/20 bg-amber-500/5" :
                                    "text-red-400 border-red-500/20 bg-red-500/5"
                                )}>
                                    {tx.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                                <p className={cn("text-base font-bold", tx.amount > 0 ? "text-green-400" : "text-white")}>
                                    {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                                </p>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-40 text-center">
                                <History className="h-10 w-10 text-gray-800 mx-auto mb-4 opacity-30" />
                                <p className="text-gray-500 text-sm font-medium">No transactions found</p>
                            </TableCell>
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
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Transaction History</h2>
                <p className="text-gray-500 mt-1">A detailed log of your account activity.</p>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-black/40 border border-white/10 p-1 rounded-2xl mb-8 h-auto flex flex-wrap gap-1 max-w-fit">
                    <TabsTrigger value="all" className="flex items-center gap-2 py-2.5 px-6 rounded-xl font-semibold text-sm">
                        <History className="w-4 h-4"/> All
                    </TabsTrigger>
                    <TabsTrigger value="purchases" className="flex items-center gap-2 py-2.5 px-6 rounded-xl font-semibold text-sm">
                        <ShoppingCart className="w-4 h-4"/> Purchases
                    </TabsTrigger>
                    <TabsTrigger value="deposits" className="flex items-center gap-2 py-2.5 px-6 rounded-xl font-semibold text-sm">
                        <Wallet className="w-4 h-4"/> Deposits
                    </TabsTrigger>
                    <TabsTrigger value="bonuses" className="flex items-center gap-2 py-2.5 px-6 rounded-xl font-semibold text-sm">
                        <Gift className="w-4 h-4"/> Bonuses
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0"><TransactionTable items={transactions} /></TabsContent>
                <TabsContent value="purchases" className="mt-0"><TransactionTable items={purchases} /></TabsContent>
                <TabsContent value="deposits" className="mt-0"><TransactionTable items={deposits} /></TabsContent>
                <TabsContent value="bonuses" className="mt-0"><TransactionTable items={bonuses} /></TabsContent>
            </Tabs>
        </div>
    );
}
