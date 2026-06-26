
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Trash2, Loader2, X, Download, Calendar as CalendarIcon, User as UserIcon, Filter } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteMultipleUsers } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Papa from 'papaparse';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

type Profile = {
    id: string;
    full_name: string;
    email: string;
    mobile_number: string | null;
    is_approved: boolean;
    kyc_status: string;
    created_at: string;
    account_classification: string | null;
    account_model: string | null;
};

export function UserTable({ profiles }: { profiles: Profile[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [filters, setFilters] = useState({
        classification: 'all',
        kyc: 'all',
    });
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const filteredProfiles = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return profiles.filter((p) => {
            const matchesSearch = p.full_name?.toLowerCase().includes(lowerSearch) || p.email?.toLowerCase().includes(lowerSearch);
            const matchesKyc = filters.kyc === 'all' || p.kyc_status === filters.kyc;
            
            let matchesClass = true;
            if (filters.classification !== 'all') {
                if (filters.classification === 'instant') matchesClass = p.account_classification === 'instant_live';
                else if (filters.classification === 'one_step') matchesClass = p.account_classification === 'one_step_phase_1';
                else if (filters.classification === 'two_step') matchesClass = p.account_classification === 'two_step_phase_1';
                else if (filters.classification === 'ptp') matchesClass = p.account_model === 'passthrupay';
            }

            const profileDate = new Date(p.created_at);
            const matchesDate = !date?.from || (profileDate >= date.from && (!date.to || profileDate <= new Date(date.to.getTime() + 86400000)));

            return matchesSearch && matchesKyc && matchesClass && matchesDate;
        });
    }, [searchTerm, profiles, filters, date]);

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        await deleteMultipleUsers(selectedUserIds);
        setIsBulkDeleting(false);
        setSelectedUserIds([]);
        window.location.reload();
    }

    const handleDownloadCSV = () => {
        const data = filteredProfiles.map((p, i) => ({
            'S.No': i + 1,
            'Name': p.full_name,
            'Email': p.email,
            'Mobile': p.mobile_number,
            'Classification': p.account_classification || 'N/A',
            'Joined': format(new Date(p.created_at), 'yyyy-MM-dd')
        }));
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'traders-export.csv';
        link.click();
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search trader by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11" />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select value={filters.classification} onValueChange={(v) => setFilters(f => ({...f, classification: v}))}>
                        <SelectTrigger className="w-[180px] h-11"><SelectValue placeholder="Account Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Account Types</SelectItem>
                            <SelectItem value="instant">Instant Live</SelectItem>
                            <SelectItem value="one_step">1-Step Phase 1</SelectItem>
                            <SelectItem value="two_step">2-Step Phase 1</SelectItem>
                            <SelectItem value="ptp">PassThenPay</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.kyc} onValueChange={(v) => setFilters(f => ({...f, kyc: v}))}>
                        <SelectTrigger className="w-[150px] h-11"><SelectValue placeholder="KYC Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any KYC</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="submitted">Review Required</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleDownloadCSV} className="h-11"><Download className="h-4 w-4 mr-2"/>CSV</Button>
                </div>
            </div>

            {selectedUserIds.length > 0 && (
                <div className="bg-muted p-2 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2">
                    <span className="text-sm font-bold ml-2">{selectedUserIds.length} traders selected</span>
                    <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2"/>Delete Selected</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle><AlertDialogDescription>This will permanently delete {selectedUserIds.length} traders and all their account history.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleBulkDelete}>Delete All</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}

            <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-12"><Checkbox checked={selectedUserIds.length === filteredProfiles.length && filteredProfiles.length > 0} onCheckedChange={(v) => setSelectedUserIds(v ? filteredProfiles.map(p => p.id) : [])} /></TableHead>
                            <TableHead>Trader</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>KYC Status</TableHead>
                            <TableHead>Primary Level</TableHead>
                            <TableHead className="text-right">Registration</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProfiles.length > 0 ? filteredProfiles.map((p) => (
                            <TableRow 
                                key={p.id} 
                                onClick={() => router.push(`/admin/profile/${p.id}`)} 
                                className="cursor-pointer hover:bg-muted/30 transition-colors group h-16"
                            >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Checkbox checked={selectedUserIds.includes(p.id)} onCheckedChange={(checked) => setSelectedUserIds(prev => checked ? [...prev, p.id] : prev.filter(id => id !== p.id))} />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{p.full_name?.[0]}</div>
                                        <div className="min-w-0">
                                            <p className="font-bold truncate text-sm text-foreground">{p.full_name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs font-medium">{p.mobile_number || 'N/A'}</TableCell>
                                <TableCell>
                                    <Badge variant={p.kyc_status === 'verified' ? 'default' : p.kyc_status === 'submitted' ? 'secondary' : 'outline'} className="capitalize text-[10px]">
                                        {p.kyc_status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-bold text-primary capitalize">{p.account_classification?.replace(/_/g, ' ') || 'Registered'}</span>
                                </TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">{format(new Date(p.created_at), 'dd MMM yyyy')}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground">No traders match your current search and filter criteria.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
