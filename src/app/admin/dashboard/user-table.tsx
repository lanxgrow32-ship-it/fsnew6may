
'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Search, Trash2, Loader2, MoreHorizontal, X, ShieldAlert, Download, Eraser, Calendar as CalendarIcon, ChevronDown, Check, FileText } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteUser, clearPaymentData, deleteMultipleUsers, approveUserPayment } from './actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Papa from 'papaparse';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
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
    is_approved: boolean;
    plan_purchased: string | null;
    transaction_id: string | null;
    crypto_transaction_hash: string | null;
    kyc_status: 'pending' | 'submitted' | 'verified' | 'rejected';
    credentials_provided: boolean;
    role: string;
    is_breached: boolean;
    plan_price: number | null;
    discount_amount: number | null;
    final_amount_paid: number | null;
    created_at: string;
};

interface UserTableProps {
  profiles: Profile[];
  onUserDelete: (userId: string) => void;
  onUserDeleteError: (errorMessage: string) => void;
  onUserUpdate: () => void;
}


function ApproveButton({ userId, onApproved }: { userId: string, onApproved: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleApprove = () => {
        startTransition(async () => {
            const result = await approveUserPayment(userId);
            if (result?.error) {
                toast({ title: "Approval Failed", description: result.error, variant: 'destructive' });
            } else {
                toast({ title: "User Approved" });
                onApproved();
            }
        });
    }

    return (
        <Button size="sm" variant="outline" onClick={handleApprove} disabled={isPending} className="border-green-600 text-green-700 hover:bg-green-100 hover:text-green-800">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Approve
        </Button>
    )
}

function DeleteUserDialog({ profile, onUserDelete, onUserDeleteError, children }: { profile: Profile, onUserDelete: (userId: string) => void, onUserDeleteError: (msg: string) => void, children: React.ReactNode }) {
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    const result = await deleteUser(profile.id);
    if (result.error) {
      onUserDeleteError(result.error);
    } else {
      onUserDelete(profile.id);
    }
    setIsPending(false);
  };
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the user account for <span className="font-bold">{profile.full_name} ({profile.email})</span> and all of their associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Yes, delete user'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ClearPaymentDialog({ profile, onClearSuccess, onClearError, children }: { profile: Profile, onClearSuccess: () => void, onClearError: (msg: string) => void, children: React.ReactNode }) {
    const [isPending, setIsPending] = useState(false);

    const handleClear = async () => {
        setIsPending(true);
        const result = await clearPaymentData(profile.id);
        if (result.error) {
            onClearError(result.error);
        } else {
            onClearSuccess();
        }
        setIsPending(false);
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Clear Payment Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will reset all plan and payment information for <span className="font-bold">{profile.full_name}</span> to zero. This is useful for excluding test users from reports. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button onClick={handleClear} variant="destructive" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Yes, clear data'}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const PaymentSummary = ({ profile }: { profile: Profile }) => {
    if (!profile.is_approved) return null;
    
    return (
        <div className="text-xs border-t mt-4 pt-4">
            <h4 className="font-semibold mb-2">Payment Summary</h4>
            <div className="space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                    <span>Plan Price:</span>
                    <span className="font-medium">₹{profile.plan_price?.toFixed(2) ?? '0.00'}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Discount:</span>
                    <span className="font-medium">- ₹{profile.discount_amount?.toFixed(2) ?? '0.00'}</span>
                </div>
                 <div className="flex justify-between font-bold text-foreground">
                    <span>Final Paid:</span>
                    <span>₹{profile.final_amount_paid?.toFixed(2) ?? '0.00'}</span>
                </div>
            </div>
        </div>
    )
}

function UserMobileCard({ profile, index, onUserDelete, onUserDeleteError, onClearSuccess, onClearError, onUserUpdate, isSelected, onRowSelect }: { profile: Profile, index: number, onUserDelete: (userId: string) => void, onUserDeleteError: (msg: string) => void, onClearSuccess: () => void, onClearError: (msg: string) => void, onUserUpdate: () => void, isSelected: boolean, onRowSelect: (id: string, checked: boolean) => void }) {
    return (
        <Card className="mb-4">
            <CardHeader>
                 <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                            <Checkbox 
                                checked={isSelected}
                                onCheckedChange={(checked) => onRowSelect(profile.id, checked as boolean)}
                                aria-label="Select user"
                                className="mt-1"
                            />
                            <div>
                                <p className="text-sm text-muted-foreground">#{index + 1}</p>
                                <CardTitle className="text-base">{profile.full_name}</CardTitle>
                                <CardDescription>{profile.email}</CardDescription>
                                {profile.mobile_number && <p className="text-xs text-muted-foreground">Ph: {profile.mobile_number}</p>}
                            </div>
                        </div>
                        <ActionsMenu profile={profile} onUserDelete={onUserDelete} onUserDeleteError={onUserDeleteError} onClearSuccess={onClearSuccess} onClearError={onClearError} />
                    </div>
                    <div className="self-start ml-12">
                         {profile.is_breached ? (
                            <Badge variant="destructive"><ShieldAlert className="h-3 w-3 mr-1" />Breached</Badge>
                        ) : profile.is_approved ? (
                            <Badge className="bg-green-100 text-green-800">Approved</Badge>
                        ) : (
                           <ApproveButton userId={profile.id} onApproved={onUserUpdate} />
                        )}
                    </div>
                 </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm pl-12">
                <div>
                    <div className="font-medium text-muted-foreground">Plan</div>
                    <div className='truncate'>{profile.plan_purchased || 'N/A'}</div>
                </div>
                 <div>
                    <div className="font-medium text-muted-foreground">Transaction ID</div>
                    <div className="truncate">{profile.transaction_id || profile.crypto_transaction_hash ||'N/A'}</div>
                </div>
                <PaymentSummary profile={profile} />
            </CardContent>
        </Card>
    )
}

function ActionsMenu({ profile, onUserDelete, onUserDeleteError, onClearSuccess, onClearError }: { profile: Profile, onUserDelete: (userId: string) => void, onUserDeleteError: (msg: string) => void, onClearSuccess: () => void, onClearError: (msg: string) => void}) {
    if (profile.role === 'admin') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" disabled>
                           <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Admin users cannot be modified here.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                     <Link href={`/admin/profile/${profile.id}`} className="w-full cursor-pointer">Manage User</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <ClearPaymentDialog profile={profile} onClearSuccess={onClearSuccess} onClearError={onClearError}>
                    <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Eraser className="mr-2 h-4 w-4" />
                        <span>Clear Payment Data</span>
                    </div>
                </ClearPaymentDialog>
                 <DeleteUserDialog profile={profile} onUserDelete={onUserDelete} onUserDeleteError={onUserDeleteError}>
                    <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete User</span>
                    </div>
                </DeleteUserDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function UserTable({ profiles, onUserDelete, onUserDeleteError, onUserUpdate }: UserTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [filters, setFilters] = useState({
        is_approved: '',
        kyc_status: '',
        credentials_provided: '',
        is_breached: '',
    });
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const filteredProfiles = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        
        return profiles.filter((profile) => {
            const matchesSearch = (
                profile.full_name?.toLowerCase().includes(lowercasedFilter) ||
                profile.email?.toLowerCase().includes(lowercasedFilter)
            );

            const matchesApproved = filters.is_approved ? String(profile.is_approved) === filters.is_approved : true;
            const matchesKyc = filters.kyc_status ? profile.kyc_status === filters.kyc_status : true;
            const matchesCredentials = filters.credentials_provided ? String(profile.credentials_provided) === filters.credentials_provided : true;
            const matchesCredentialsLower = filters.credentials_provided ? String(profile.credentials_provided) === filters.credentials_provided : true;
            const matchesBreached = filters.is_breached ? String(profile.is_breached) === filters.is_breached : true;
            
            const profileDate = new Date(profile.created_at);
            const matchesDate = 
                (!date?.from || profileDate >= date.from) &&
                (!date?.to || profileDate <= new Date(date.to.getTime() + 86400000 - 1)); // Include the whole end day

            return matchesSearch && matchesApproved && matchesKyc && matchesCredentials && matchesBreached && matchesDate;
        });
    }, [searchTerm, profiles, filters, date]);
    
    // Reset selection when filters change
    useEffect(() => {
        setSelectedUserIds([]);
    }, [searchTerm, filters, date]);

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters(prev => ({...prev, [filterName]: value}));
    }
    
    const clearFilters = () => {
        setSearchTerm('');
        setDate(undefined);
        setFilters({
            is_approved: '',
            kyc_status: '',
            credentials_provided: '',
            is_breached: '',
        });
    }

    const isAnyFilterActive = searchTerm || date?.from || date?.to || Object.values(filters).some(v => v !== '');

    const handleDownloadCSV = () => {
        const dataToExport = filteredProfiles.map((profile, index) => ({
            'S.No.': index + 1,
            'Full Name': profile.full_name,
            'Email': profile.email,
            'Phone': profile.mobile_number,
            'Payment Status': profile.is_approved ? 'Approved' : 'Pending',
            'Account Status': profile.is_breached ? 'Breached' : 'Active',
            'KYC Status': profile.kyc_status,
            'Plan': profile.plan_purchased,
            'Transaction ID': profile.transaction_id || profile.crypto_transaction_hash,
            'Plan Price': profile.plan_price,
            'Discount': profile.discount_amount,
            'Final Amount Paid': profile.final_amount_paid,
        }));
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'users.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    const handleDownloadNumbersCSV = () => {
        const dataToExport = filteredProfiles.map((profile, index) => ({
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
            link.setAttribute('download', 'user_numbers.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    const handleDownloadNumbersPDF = () => {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        doc.setFontSize(18);
        doc.text('User Contact List', 14, 20);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
        
        const tableColumn = ["S.No.", "Full Name", "Mobile Number"];
        const tableRows = filteredProfiles.map((p, index) => [
            index + 1,
            p.full_name,
            p.mobile_number || 'N/A'
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'striped',
            headStyles: { fillColor: [45, 93, 47] } // Primary color theme
        });

        doc.save('user_numbers.pdf');
    }

    const handleSelectAllOnPage = (checked: boolean) => {
        if (checked) {
            setSelectedUserIds(filteredProfiles.map(p => p.id));
        } else {
            setSelectedUserIds([]);
        }
    };
    
    const handleSelectPending = () => {
        const pendingUserIds = profiles
            .filter(p => !p.is_approved && p.role !== 'admin')
            .map(p => p.id);
        setSelectedUserIds(pendingUserIds);
    };

    const handleRowSelect = (userId: string, checked: boolean) => {
        setSelectedUserIds(prev => 
            checked ? [...prev, userId] : prev.filter(id => id !== userId)
        );
    };

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        const result = await deleteMultipleUsers(selectedUserIds);
        if (result.error) {
            onUserDeleteError(result.error);
        } else {
            // onUserUpdate will trigger a re-fetch which re-renders this component
            onUserUpdate(); 
            setSelectedUserIds([]);
        }
        setIsBulkDeleting(false);
    }
    
    const numSelected = selectedUserIds.length;
    const numOnPage = filteredProfiles.length;
    const isAllOnPageSelected = numOnPage > 0 && numSelected === numOnPage && filteredProfiles.every(p => selectedUserIds.includes(p.id));
    const isSomeOnPageSelected = numSelected > 0 && !isAllOnPageSelected;

    return (
        <Card className="shadow-sm">
            <CardHeader>
              <div>
                <CardTitle>User List</CardTitle>
                <CardDescription>A list of all users in the system. Found {filteredProfiles.length} of {profiles.length} users.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                         <div className="relative w-full md:flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-full md:w-[300px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                    date.to ? (
                                        <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                         <Select value={filters.is_approved} onValueChange={(value) => handleFilterChange('is_approved', value)}>
                            <SelectTrigger className="w-full sm:w-auto flex-grow">
                                <SelectValue placeholder="Payment Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Approved</SelectItem>
                                <SelectItem value="false">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.kyc_status} onValueChange={(value) => handleFilterChange('kyc_status', value)}>
                            <SelectTrigger className="w-full sm:w-auto flex-grow">
                                <SelectValue placeholder="KYC Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="verified">Verified</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.credentials_provided} onValueChange={(value) => handleFilterChange('credentials_provided', value)}>
                            <SelectTrigger className="w-full sm:w-auto flex-grow">
                                <SelectValue placeholder="Credentials" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Provided</SelectItem>
                                <SelectItem value="false">Not Provided</SelectItem>
                            </SelectContent>
                        </Select>
                         <Select value={filters.is_breached} onValueChange={(value) => handleFilterChange('is_breached', value)}>
                            <SelectTrigger className="w-full sm:w-auto flex-grow">
                                <SelectValue placeholder="Account Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Breached</SelectItem>
                                <SelectItem value="false">Active</SelectItem>
                            </SelectContent>
                        </Select>
                         {isAnyFilterActive && (
                            <Button variant="ghost" onClick={clearFilters}>
                                <X className="mr-2 h-4 w-4"/>
                                Clear
                            </Button>
                        )}
                         <Button variant="outline" onClick={handleDownloadCSV}>
                            <Download className="mr-2 h-4 w-4"/>
                            Download CSV
                        </Button>

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
                    </div>

                    {selectedUserIds.length > 0 && (
                        <div className="flex items-center gap-4 rounded-md border bg-muted p-2.5">
                            <p className="text-sm font-medium">{selectedUserIds.length} user(s) selected.</p>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" disabled={isBulkDeleting}>
                                        {isBulkDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                                        Delete Selected
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the selected <span className="font-bold">{selectedUserIds.length} user account(s)</span>.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>

                <ClientOnly>
                    {/* Mobile View */}
                    <div className="md:hidden mt-4">
                        {filteredProfiles.length > 0 ? filteredProfiles.map((profile, index) => (
                           <UserMobileCard 
                                key={profile.id} 
                                profile={profile} 
                                index={index} 
                                onUserDelete={onUserDelete} 
                                onUserDeleteError={onUserDeleteError} 
                                onClearSuccess={onUserUpdate} 
                                onClearError={onUserDeleteError}
                                onUserUpdate={onUserUpdate}
                                isSelected={selectedUserIds.includes(profile.id)}
                                onRowSelect={handleRowSelect}
                           />
                        )) : (
                            <div className="text-center h-24 flex items-center justify-center">
                                <p>No users found matching your filters.</p>
                            </div>
                        )}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block mt-4">
                        <TooltipProvider>
                            <div className="overflow-x-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-20">
                                                <div className="flex items-center">
                                                    <Checkbox
                                                        checked={isAllOnPageSelected}
                                                        aria-checked={isSomeOnPageSelected ? "mixed" : isAllOnPageSelected}
                                                        onCheckedChange={(checked) => handleSelectAllOnPage(checked as boolean)}
                                                        aria-label="Select all on page"
                                                    />
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-1 data-[state=open]:bg-muted">
                                                                <ChevronDown className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start">
                                                            <DropdownMenuItem onClick={handleSelectPending}>Select all pending users</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => setSelectedUserIds([])}>Deselect all</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableHead>
                                            <TableHead>S.No.</TableHead>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Transaction ID</TableHead>
                                            <TableHead>Final Price</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProfiles.length > 0 ? filteredProfiles.map((profile, index) => (
                                            <TableRow key={profile.id} data-state={selectedUserIds.includes(profile.id) && "selected"}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedUserIds.includes(profile.id)}
                                                        onCheckedChange={(checked) => handleRowSelect(profile.id, checked as boolean)}
                                                        aria-label="Select row"
                                                    />
                                                </TableCell>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell className="font-medium">
                                                    <div>
                                                        {profile.full_name}
                                                        {profile.mobile_number && <p className="text-[10px] text-muted-foreground font-normal">{profile.mobile_number}</p>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{profile.email}</TableCell>
                                                <TableCell>
                                                    {profile.is_breached ? (
                                                        <Badge variant="destructive"><ShieldAlert className="h-3 w-3 mr-1" />Breached</Badge>
                                                    ) : profile.is_approved ? (
                                                        <Badge className="bg-green-100 text-green-800">Approved</Badge>
                                                    ) : (
                                                       <ApproveButton userId={profile.id} onApproved={onUserUpdate} />
                                                    )}
                                                </TableCell>
                                                <TableCell>{profile.plan_purchased || 'N/A'}</TableCell>
                                                <TableCell>
                                                    {profile.transaction_id || profile.crypto_transaction_hash ? (
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <span className="block max-w-32 truncate font-mono">
                                                                    {profile.transaction_id || profile.crypto_transaction_hash}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{profile.transaction_id || profile.crypto_transaction_hash}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {profile.is_approved ? `₹${profile.final_amount_paid?.toFixed(2) ?? '0.00'}` : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <ActionsMenu profile={profile} onUserDelete={onUserDelete} onUserDeleteError={onUserDeleteError} onClearSuccess={onUserUpdate} onClearError={onUserDeleteError} />
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center h-24">
                                                    No users found matching your filters.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TooltipProvider>
                    </div>
                </ClientOnly>
            </CardContent>
        </Card>
    );
}
