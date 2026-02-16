
'use client';

import { useState, useEffect, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Eye, EyeOff, Check, History, Copy, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

function GetCredentialsForm({ entry }: { entry: CompetitionEntry }) {
    const ref = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [state, formAction] = useActionState(generateCompetitionCredentials, { error: null, success: false });

    useEffect(() => {
        if (state.error) {
            toast({ title: "Error", description: state.error, variant: "destructive" });
        }
        if (state.success) {
            toast({ title: "Success!", description: "Your credentials have been generated." });
            // The page will re-render via revalidatePath, no need to do anything else here.
        }
    }, [state, toast]);

    function SubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" className="w-full" size="lg" disabled={pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                Get My Trading Credentials
            </Button>
        );
    }

    return (
        <Card className="w-full shadow-sm">
            <form action={formAction} ref={ref}>
                <input type="hidden" name="entry_id" value={entry.id} />
                <CardHeader>
                    <CardTitle>Get Your Trading Account</CardTitle>
                    <CardDescription>You've successfully joined the <span className="font-bold">{entry.week_identifier}</span> competition! Enter your mobile number to generate your credentials.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {state.error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}
                    <div className="space-y-2">
                        <Label htmlFor="mobile_number">Mobile Number</Label>
                        <Input id="mobile_number" name="mobile_number" type="tel" placeholder="Enter your 10-digit mobile number" required />
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </form>
        </Card>
    )
}

export function CompetitionView({ initialEntries }: { initialEntries: CompetitionEntry[] }) {
    const supabase = createClient();
    const { toast } = useToast();
    const [entries, setEntries] = useState<CompetitionEntry[]>(initialEntries);
    const [isLoading, setIsLoading] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});
    
    // This effect handles realtime updates after the initial server-side load
    useEffect(() => {
        const channel = supabase.channel('realtime competition entries')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_entries' },
                async (payload) => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if(user) {
                        const { data: freshEntries } = await supabase
                            .from('competition_entries')
                            .select('*')
                            .eq('user_id', user.id)
                            .order('created_at', { ascending: false });
                        if(freshEntries) {
                            setEntries(freshEntries);
                        }
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel) };

    }, [supabase]);


    const togglePasswordVisibility = (id: number) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!" });
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
    
    const activeEntry = entries[0]; // The most recent entry

    // If the active entry doesn't have credentials yet, show the form
    if (!activeEntry.stockmint_username || !activeEntry.stockmint_password) {
        return <GetCredentialsForm entry={activeEntry} />;
    }

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
                                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(activeEntry.stockmint_username!)}>
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
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(activeEntry.stockmint_password!)}>
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
                                    <TableCell>{entry.stockmint_username || 'N/A'}</TableCell>
                                    <TableCell>{entry.stockmint_password ? '••••••••••' : 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
