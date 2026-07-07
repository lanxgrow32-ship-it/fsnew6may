
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function CompetitionUserDetailsPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .eq('account_type', 'competition')
        .single();
    
    const { data: entries, error: entriesError } = await supabase
        .from('competition_entries')
        .select('*')
        .eq('user_id', params.id)
        .order('created_at', { ascending: false });

    if (profileError || !profile) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Competition user not found.</AlertDescription>
                    <Button asChild variant="link" className="p-0 h-auto mt-2">
                        <Link href="/admin/competition">Go Back</Link>
                    </Button>
                </Alert>
            </div>
        );
    }
    
    return (
        <div className="bg-muted/40 min-h-screen">
            <header className="flex h-[57px] items-center gap-4 p-4 border-b bg-card sticky top-0 z-10">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/competition">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-xl font-semibold">{profile.full_name}</h1>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
            </header>
            <main className="p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Competition Entry History</CardTitle>
                            <CardDescription>A log of all weekly/monthly competition entries for this user.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Period ID</TableHead>
                                        <TableHead>StockMint Username</TableHead>
                                        <TableHead>StockMint Password</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries && entries.length > 0 ? entries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="font-medium">{entry.week_identifier}</TableCell>
                                            <TableCell>{entry.stockmint_username}</TableCell>
                                            <TableCell>{entry.stockmint_password}</TableCell>
                                            <TableCell>₹{Number(entry.account_balance).toLocaleString('en-IN')}</TableCell>
                                            <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">No competition entries found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
