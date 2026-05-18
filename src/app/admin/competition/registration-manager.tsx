'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, User } from 'lucide-react';
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

    const ongoingEvent = events.find(e => e.status === 'ongoing');
    const defaultTab = ongoingEvent?.id || events[0]?.id;

    if (events.length === 0) {
        return <div className="text-center py-20 text-muted-foreground">Please create a tournament week in the "Tournament Events" tab first.</div>;
    }

    return (
        <div className="space-y-4">
            <Tabs defaultValue={defaultTab}>
                <TabsList className="flex flex-wrap h-auto bg-transparent gap-2">
                    {events.map(e => (
                        <TabsTrigger key={e.id} value={e.id} className="border border-muted-foreground/20 data-[state=active]:bg-primary data-[state=active]:text-white capitalize">
                            {e.week_label} {e.status === 'ongoing' && "(Live)"}
                        </TabsTrigger>
                    ))}
                </TabsList>
                
                {events.map(event => (
                    <TabsContent key={event.id} value={event.id}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{event.week_label} Registrations</CardTitle>
                                <CardDescription>Approval list for {event.start_date} to {event.end_date}.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>UTR / Transaction</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {registrations.filter(r => r.event_id === event.id).length > 0 ? 
                                            registrations.filter(r => r.event_id === event.id).map((reg: any) => (
                                            <TableRow key={reg.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><User className="h-4 w-4"/></div>
                                                        <div>
                                                            <div className="font-medium">{reg.profiles?.full_name || 'New User'}</div>
                                                            <div className="text-xs text-muted-foreground">{reg.profiles?.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-primary font-bold">{reg.transaction_id}</TableCell>
                                                <TableCell>
                                                    <Badge variant={reg.is_approved ? 'default' : 'secondary'}>{reg.is_approved ? 'Approved' : 'Pending'}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!reg.is_approved && (
                                                        <Button size="sm" onClick={() => handleApprove(reg.id)} disabled={pendingRegId === reg.id} className="bg-green-600 hover:bg-green-700">
                                                            {pendingRegId === reg.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4 mr-1"/>}
                                                            Approve
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No registrations for this week yet.</TableCell></TableRow>
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
