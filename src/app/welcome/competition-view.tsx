
'use client';

import { useState, useEffect, useActionState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Eye, EyeOff, Check, History, Copy, KeyRound, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateCompetitionCredentials } from './actions';

type CompetitionEntry = {
    id: number;
    week_identifier: string;
    stockmint_username: string | null;
    stockmint_password: string | null;
    account_balance: number;
    created_at: string;
};

type PaymentSession = {
    status: 'initiated' | 'completed' | 'failed';
};

function GetCredentialsFlow({ paymentSession }: { paymentSession: PaymentSession | null }) {
    const { toast } = useToast();
    const [actionState, formAction, isPending] = useActionState(generateCompetitionCredentials, { error: null, success: false });

    useEffect(() => {
        if (actionState.error) {
            toast({ title: "Error", description: actionState.error, variant: "destructive" });
        }
        if (actionState.success) {
            toast({ title: "Success!", description: "Your credentials have been generated and will now appear." });
        }
    }, [actionState, toast]);

    if (!paymentSession || paymentSession.status === 'initiated') {
        return (
            <Card className="w-full shadow-sm text-center">
                 <CardHeader>
                    <CardTitle>Payment Pending</CardTitle>
                    <CardDescription>Your account is created, but we are waiting for payment confirmation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mx-auto" />
                     <p className="text-muted-foreground text-sm">Please complete your payment. If you have already paid, this page will update automatically once the confirmation is received (this may take a few minutes).</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full shadow-sm">
            <form action={formAction}>
                <CardHeader>
                    <CardTitle>Your Account is Ready!</CardTitle>
                    <CardDescription>Your payment has been confirmed. Click the button below to generate your unique trading account credentials for this competition.</CardDescription>
                </CardHeader>
                <CardContent>
                    {actionState.error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{actionState.error}</AlertDescription></Alert>}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                        Get My Trading Credentials
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}

function RenewalFlow() {
    const { toast } = useToast();
    const [actionState, formAction, isPending] = useActionState(generateCompetitionCredentials, { error: null, success: false, message: '' });

     useEffect(() => {
        if (actionState.error) {
            toast({ title: "Renewal Failed", description: actionState.error, variant: "destructive" });
        }
        if (actionState.success) {
            toast({ title: "Success!", description: actionState.message || "Your new credentials for this period are now active." });
        }
    }, [actionState, toast]);

    return (
        <Card>
            <form action={formAction}>
                <CardHeader>
                    <CardTitle>Subscription Renewal</CardTitle>
                    <CardDescription>If your weekly or monthly subscription has renewed, click here to generate your trading account for the new period.</CardDescription>
                </CardHeader>
                <CardContent>
                     {actionState.error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{actionState.error}</AlertDescription></Alert>}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isPending}>
                         {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Generate New Credentials
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

export function CompetitionView({ initialEntries, paymentSession }: { initialEntries: CompetitionEntry[], paymentSession: PaymentSession | null }) {
    const { toast } = useToast();
    const [entries, setEntries] = useState<CompetitionEntry[]>(initialEntries);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

    useEffect(() => {
        setEntries(initialEntries);
    }, [initialEntries]);

    const togglePasswordVisibility = (id: number) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };
    
    const copyToClipboard = (text: string | null) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!" });
    }
    
    const activeEntry = entries?.[0];

    // If there's no entry yet, show the flow to get credentials
    if (!activeEntry || !activeEntry.stockmint_username) {
        return <GetCredentialsFlow paymentSession={paymentSession} />;
    }

    return (
        <div className="space-y-8">
            <Card className="w-full shadow-sm">
                <CardHeader>
                    <CardTitle>Your Active Competition Account</CardTitle>
                    <CardDescription>Use these credentials to log in to the trading platform for the current competition.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="rounded-lg border bg-muted/40 p-4">
                            <p className="text-sm font-medium text-muted-foreground">Current Period</p>
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

            <RenewalFlow />

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History /> Competition History</CardTitle>
                    <CardDescription>Your credentials from previous competition entries.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Identifier</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Password</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.slice(1).map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell className="font-medium">{entry.week_identifier}</TableCell>
                                    <TableCell>{entry.stockmint_username || 'N/A'}</TableCell>
                                    <TableCell>{entry.stockmint_password ? '••••••••••' : 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                             {entries.length <= 1 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">No previous entries found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
