
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClientOnly } from '@/components/ui/client-only';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Define the type for the autotable method
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

type Profile = {
    id: string;
    full_name: string;
    email: string;
    mobile_number: string | null;
    created_at: string;
    is_hidden: boolean | null;
};

export function CompetitionUserList({ initialProfiles }: { initialProfiles: Profile[] }) {
    const supabase = createClient();
    const [profiles, setProfiles] = useState(initialProfiles);
    const { toast } = useToast();

    useEffect(() => {
        const channel = supabase
            .channel('realtime competition profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: 'account_type=eq.competition' },
                (payload) => {
                    const fetchProfiles = async () => {
                        const { data, error } = await supabase
                          .from('profiles')
                          .select('*')
                          .eq('account_type', 'competition')
                          .order('created_at', { ascending: false })
                          .range(0, 49999); // Increased range

                        if (error) {
                            toast({ title: 'Error fetching updated profiles', variant: 'destructive' });
                        } else {
                            setProfiles(data || []);
                        }
                    }
                    fetchProfiles();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, toast]);

    const handleDownloadNumbersCSV = () => {
        const dataToExport = profiles.map((profile, index) => ({
            'S.No.': index + 1,
            'Full Name': profile.full_name,
            'Mobile Number': profile.mobile_number || 'N/A',
        }));
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'competition_user_numbers.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    const handleDownloadNumbersPDF = () => {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        doc.setFontSize(18);
        doc.text('Competition User Contact List', 14, 20);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
        
        const tableColumn = ["S.No.", "Full Name", "Mobile Number"];
        const tableRows = profiles.map((p, index) => [
            index + 1,
            p.full_name,
            p.mobile_number || 'N/A'
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'striped',
            headStyles: { fillColor: [45, 93, 47] }
        });

        doc.save('competition_user_numbers.pdf');
    }

    const SkeletonTable = () => (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
    );

    return (
        <ClientOnly fallback={<SkeletonTable />}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Competition Users</CardTitle>
                        <CardDescription>List of all users who have participated in trading competitions. Showing {profiles.length} users.</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4"/>
                                Download Numbers
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleDownloadNumbersCSV}>
                                <Download className="mr-2 h-4 w-4" /> CSV Format
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDownloadNumbersPDF}>
                                <FileText className="mr-2 h-4 w-4" /> PDF Format
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Date Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profiles.length > 0 ? profiles.map((profile) => (
                                <TableRow key={profile.id}>
                                    <TableCell className="font-medium">{profile.full_name}</TableCell>
                                    <TableCell>{profile.email}</TableCell>
                                    <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/admin/competition/${profile.id}`} className="text-primary hover:underline">
                                            View Details
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No competition users found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </ClientOnly>
    );
}
