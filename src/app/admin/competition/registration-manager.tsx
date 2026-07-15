'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Loader2, User, Search, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { approveRegistration } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function RegistrationManager({ events }: { events: any[] }) {
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingRegId, setPendingRegId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

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

    const filteredRegistrations = useMemo(() => {
        return registrations.filter(reg => {
            const profile = reg.profiles || {};
            const search = searchTerm.toLowerCase();
            const matchesSearch = (profile.full_name || '').toLowerCase().includes(search) || 
                                (profile.email || '').toLowerCase().includes(search) || 
                                (reg.transaction_id || '').toLowerCase().includes(search);
            
            let matchesStatus = true;
            if (statusFilter === 'approved') matchesStatus = reg.is_approved;
            else if (statusFilter === 'pending') matchesStatus = !reg.is_approved;

            return matchesSearch && matchesStatus;
        });
    }, [registrations, searchTerm, statusFilter]);

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
        <div className="space-y-6">
            {/* Search and Global Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search registrations by name, email or UTR..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="pl-10 h-11 bg-card"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] h-11 bg-card">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="All Status" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Tabs defaultValue={defaultTab}>
                <TabsList className="flex flex-wrap h-auto bg-transparent gap-2 mb-4">
                    {events.map(e => (
                        <TabsTrigger key={e.id} value={e.id} className="border border-muted-foreground/20 data-[state=active]:bg-primary data-[state=active]:text-white capitalize px-6 h-10 rounded-full">
                            {e.week_label} {e.status === 'ongoing' && "(Live)"}
                        </TabsTrigger>
                    ))}
                </TabsList>
                
                {events.map(event => {
                    const eventRegs = filteredRegistrations.filter(r => r.event_id === event.id);
                    return (
                        <TabsContent key={event.id} value={event.id}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>{event.week_label} Registrations</CardTitle>
                                    <CardDescription>Found {eventRegs.length} participants for this week.</CardDescription>
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
                                            {eventRegs.length > 0 ? eventRegs.map((reg: any) => (
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
                                                <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No registrations matching your criteria for this week.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )
                })}
            </Tabs>
        </div>
    );
}
