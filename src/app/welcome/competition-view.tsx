
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Eye, EyeOff, Check, History, Copy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from '@/components/ui/skeleton';

type CompetitionEntry = {
    id: number;
    week_identifier: string;
    stockmint_username: string;
    stockmint_password: string;
    account_balance: number;
    created_at: string;
};

export function CompetitionView() {
    const supabase = createClient();
    const { toast } = useToast();
    const [entries, setEntries] = useState<CompetitionEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchEntries = async () => {
            const { data, error } = await supabase
                .from('competition_entries')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setEntries(data);
            }
            setIsLoading(false);
        };
        fetchEntries();
    }, [supabase]);

    const togglePasswordVisibility = (id: number) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!" });
    }

    const SkeletonLoader = () => (
         <Card>
            <CardHeader>
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                 <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    )

    if (isLoading) {
        return <SkeletonLoader />;
    }
    
    if (entries.length === 0) {
        return (
            <Card className="w-full shadow-sm text-center">
                <CardHeader>
                    <CardTitle>No Active Competitions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <p className="text-muted-foreground">You have not joined any trading competitions yet.</p>
                     <Button asChild>
                         <Link href="/competition">Join a Competition</Link>
                     </Button>
                </CardContent>
            </Card>
        )
    }
    
    const activeEntry = entries[0]; // The most recent entry is the active one

    return (
        <div className="space-y-8">
            <Card className="w-full shadow-sm">
                <CardHeader>
                    <CardTitle>Your Active Competition Account</CardTitle>
                    <CardDescription>Use these credentials to log in to the trading platform for the current week.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="rounded-lg border bg-muted/40 p-4">
                            <p className="text-sm font-medium text-muted-foreground">Current Week</p>
                            <p className="text-lg font-semibold">{activeEntry.week_identifier}</p>
                        </div>
                         <div className="rounded-lg border bg-muted/40 p-4">
                            <p className="text-sm font-medium text-muted-foreground">Starting Balance</p>
                            <p className="text-lg font-semibold">₹{activeEntry.account_balance.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
                                <Label>Trading Username</Label>
                                <div className="flex items-center gap-2">
                                    <p className="text-base font-semibold tracking-wider truncate">{activeEntry.stockmint_username}</p>
                                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(activeEntry.stockmint_username)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
                                 <Label>Trading Password</Label>
                                <div className="flex items-center justify-between">
                                    <p className="text-base font-semibold tracking-wider">
                                        {visiblePasswords[activeEntry.id] ? activeEntry.stockmint_password : '••••••••••'}
                                    </p>
                                    <div className="flex items-center">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePasswordVisibility(activeEntry.id)}>
                                            {visiblePasswords[activeEntry.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(activeEntry.stockmint_password)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button asChild size="lg" className="w-full">
                        <Link href="https://www.stockmint.io/login" target="_blank">
                            Launch Trading Software
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History /> Competition History</CardTitle>
                    <CardDescription>Your credentials from previous competition weeks.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Week</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Password</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell className="font-medium">{entry.week_identifier}</TableCell>
                                    <TableCell>{entry.stockmint_username}</TableCell>
                                    <TableCell>••••••••••</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
