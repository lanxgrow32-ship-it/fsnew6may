'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Trash2, Trophy, Medal, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { archiveWeekResults } from './actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { cn } from '@/lib/utils';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function ResultsManager({ events }: { events: any[] }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const supabase = createClient();

    const completedWeeks = events.filter(e => e.status === 'completed');

    const downloadFullPDF = async (event: any) => {
        setIsExporting(event.id);
        try {
            // 1. Fetch ALL registrations for this week (Approved and Unapproved)
            const { data: regs } = await supabase
                .from('competition_registrations')
                .select('*, profiles(full_name, email, mobile_number)')
                .eq('event_id', event.id);

            if (!regs || regs.length === 0) {
                toast({ title: "No data to export", variant: "destructive" });
                setIsExporting(null);
                return;
            }

            const doc = new jsPDF() as jsPDFWithAutoTable;
            doc.setFontSize(18);
            doc.text(`Tournament Report: ${event.week_label}`, 14, 20);
            doc.setFontSize(10);
            doc.text(`Dates: ${event.start_date} to ${event.end_date}`, 14, 28);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 33);

            const tableColumn = ["S.No.", "Name", "Email", "Phone", "Status", "UTR"];
            const tableRows = regs.map((r, i) => [
                i + 1,
                r.profiles?.full_name || 'N/A',
                r.profiles?.email || 'N/A',
                r.profiles?.mobile_number || 'N/A',
                r.is_approved ? 'Verified' : 'Pending',
                r.transaction_id
            ]);

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                theme: 'striped',
                headStyles: { fillColor: [45, 93, 47] }
            });

            doc.save(`Tournament_Report_${event.week_label.replace(/\s+/g, '_')}.pdf`);
            toast({ title: "Report Downloaded" });
        } catch (e) {
            toast({ title: "Export failed", variant: "destructive" });
        }
        setIsExporting(null);
    };

    const handleArchive = (id: string) => {
        startTransition(async () => {
            const res = await archiveWeekResults(id);
            if (res.success) {
                toast({ title: "Week Archived Successfully", description: "Top 3 saved, database cleaned." });
                window.location.reload();
            } else {
                toast({ title: "Archive Failed", description: res.error, variant: "destructive" });
            }
        });
    };

    if (completedWeeks.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-dashed">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No completed weeks found to export or archive.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {completedWeeks.map((week) => (
                <Card key={week.id} className={week.is_archived ? "bg-muted/50 opacity-80" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {week.week_label}
                                {week.is_archived && <Badge variant="secondary" className="gap-1"><CheckCircle className="w-3 h-3"/> Archived</Badge>}
                            </CardTitle>
                            <CardDescription>{week.start_date} to {week.end_date}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {!week.is_archived && (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => downloadFullPDF(week)} disabled={isExporting === week.id}>
                                        {isExporting === week.id ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <FileText className="w-4 h-4 mr-2"/>}
                                        Export PDF
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm" disabled={isPending}>
                                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Trash2 className="w-4 h-4 mr-2"/>}
                                                Archive & Cleanup
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Archive Week & Clean Database?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will fetch final balances from StockMint, save the **Top 3 Winners** permanently, and then **DELETE all participant data** for this week. 
                                                    Make sure you have exported the PDF first!
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleArchive(week.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    Yes, Archive Results
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <WinnersList eventId={week.id} isArchived={week.is_archived} />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function WinnersList({ eventId, isArchived }: { eventId: string, isArchived: boolean }) {
    const [winners, setWinners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchWinners = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('competition_winners')
            .select('*')
            .eq('event_id', eventId)
            .order('rank', { ascending: true });
        setWinners(data || []);
        setLoading(false);
    };

    useState(() => {
        if (isArchived) fetchWinners();
    });

    if (!isArchived) {
        return (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
                <p className="text-sm text-amber-600 font-medium">Pending Archive. Click "Archive & Cleanup" to save the official winners of this week.</p>
            </div>
        );
    }

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground"/></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {winners.length > 0 ? winners.map((winner) => (
                <div key={winner.id} className="flex items-center gap-4 p-4 bg-background rounded-xl border">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-lg",
                        winner.rank === 1 ? "bg-yellow-500/20 text-yellow-600 border border-yellow-500/30" :
                        winner.rank === 2 ? "bg-gray-300/20 text-gray-600 border border-gray-300/30" :
                        "bg-orange-500/20 text-orange-600 border border-orange-500/30"
                    )}>
                        {winner.rank}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{winner.user_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{winner.user_email}</p>
                        <p className="text-xs font-black text-primary mt-0.5">₹{Number(winner.final_balance).toLocaleString('en-IN')}</p>
                    </div>
                </div>
            )) : (
                <p className="col-span-3 text-center text-sm text-muted-foreground">No winners found for this archive.</p>
            )}
        </div>
    );
}
