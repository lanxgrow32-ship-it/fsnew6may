'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { upsertEvent, deleteEvent } from './actions';
import { useToast } from '@/hooks/use-toast';

export function EventManager({ initialEvents }: { initialEvents: any[] }) {
    const [events, setEvents] = useState(initialEvents);
    const [isOpen, setIsOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState('upcoming');
    const { toast } = useToast();

    const openAddDialog = () => {
        setEditingEvent(null);
        setStatus('upcoming');
        setIsOpen(true);
    };

    const openEditDialog = (event: any) => {
        setEditingEvent(event);
        setStatus(event.status);
        setIsOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        formData.set('status', status); // Ensure status from state is included

        const res = await upsertEvent(formData);
        if (res.success) {
            toast({ title: "Tournament Week Saved Successfully" });
            setIsOpen(false);
            window.location.reload();
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" });
        }
        setIsSaving(false);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Tournament Weeks</CardTitle>
                    <CardDescription>Manage the schedule of weekly competitions.</CardDescription>
                </div>
                <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if(!v) setEditingEvent(null); }}>
                    <DialogTrigger asChild>
                        <Button onClick={openAddDialog}><Plus className="w-4 h-4 mr-2"/> Add Week</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{editingEvent ? 'Edit' : 'Add'} Tournament Week</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {editingEvent?.id && <input type="hidden" name="id" value={editingEvent.id} />}
                            <div className="space-y-2">
                                <Label>Week Label</Label>
                                <Input name="week_label" defaultValue={editingEvent?.week_label} placeholder="e.g. Week 45 - Nov" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input type="date" name="start_date" defaultValue={editingEvent?.start_date} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input type="date" name="end_date" defaultValue={editingEvent?.end_date} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Entry Fee (₹)</Label>
                                <Input type="number" name="entry_fee" defaultValue={editingEvent?.entry_fee} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="upcoming">Upcoming</SelectItem>
                                        <SelectItem value="ongoing">Ongoing (Live)</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Save Tournament
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Week</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Fee</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events && events.length > 0 ? events.map((event) => (
                            <TableRow key={event.id}>
                                <TableCell className="font-bold">{event.week_label}</TableCell>
                                <TableCell>{event.start_date} to {event.end_date}</TableCell>
                                <TableCell>₹{event.entry_fee}</TableCell>
                                <TableCell>
                                    <Badge variant={event.status === 'ongoing' ? 'destructive' : 'secondary'} className="capitalize">
                                        {event.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(event)}><Edit className="w-4 h-4"/></Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No tournament weeks created yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
