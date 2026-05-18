'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { approveRegistration } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function RegistrationManager({ events }: { events: any[] }) {
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingRegId, setPendingRegId] = useState<string | null>(null);
    const { toast } = useToast();
    const supabase = createClient();

    const fetchRegistrations = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('competition_registrations')
            .select('*, profiles(full_name, email)')
            .order('created_at', { ascending: false });
        setRegistrations(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const handleApprove = async (id: string) => {
        setPendingRegId(id);
        const res = await approveRegistration(id);
        if (res.success) {
            toast({ title: "Approved & Account Created" });
            fetchRegistrations();
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" });
        }
        setPendingRegId(null);
    };

    const grouped = events.map(event => ({
        ...event,
        regs: registrations.filter(r => r.event_id === event.id)
    }));

    return (
        <div className="space-y-4">
            <Tabs defaultValue={events.find(e => e.status === 'ongoing')?.id || events[0]?.id}>
                <TabsList className="flex flex-wrap h-auto bg-transparent gap-2">
                    {events.map(e => (
                        <TabsTrigger key={e.id} value={e.id} className="border data-[state=active]:bg-primary data-[state=active]:text-white">
                            {e.week_label}
                        </TabsTrigger>
                    ))}
                </TabsList>
                
                {grouped.map(week => (
                    <TabsContent key={week.id} value={week.id}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{week.week_label} Registrations</CardTitle>
                                <CardDescription>UTR Approval list for this week's tournament.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>UTR / TxID</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {week.regs.length > 0 ? week.regs.map((reg: any) => (
                                            <TableRow key={reg.id}>
                                                <TableCell>
                                                    <div className="font-medium">{reg.profiles?.full_name}</div>
                                                    <div className="text-xs text-muted-foreground">{reg.profiles?.email}</div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{reg.transaction_id}</TableCell>
                                                <TableCell>
                                                    <Badge variant={reg.is_approved ? 'default' : 'secondary'}>{reg.is_approved ? 'Approved' : 'Pending'}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!reg.is_approved && (
                                                        <Button size="sm" onClick={() => handleApprove(reg.id)} disabled={pendingRegId === reg.id}>
                                                            {pendingRegId === reg.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4 mr-1"/>}
                                                            Approve
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No registrations for this week yet.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
