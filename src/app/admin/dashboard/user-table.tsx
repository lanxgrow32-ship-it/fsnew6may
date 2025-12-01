
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Search, Trash2, Loader2, MoreHorizontal, X, ShieldAlert } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteUser } from './actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';


type Profile = {
    id: string;
    full_name: string;
    email: string;
    is_approved: boolean;
    plan_purchased: string | null;
    transaction_id: string | null;
    kyc_status: 'pending' | 'submitted' | 'verified' | 'rejected';
    credentials_provided: boolean;
    role: string;
    is_breached: boolean;
    plan_price: number | null;
    discount_amount: number | null;
    final_amount_paid: number | null;
};

interface UserTableProps {
  profiles: Profile[];
  onUserDelete: (userId: string) => void;
  onUserDeleteError: (errorMessage: string) => void;
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

function StatusBadge({ profile }: { profile: Profile }) {
    if (profile.is_breached) {
        return (
            <Badge variant="destructive" className="flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                Breached
            </Badge>
        );
    }
    
    return (
        <Badge variant={profile.is_approved ? 'default' : 'destructive'} className={profile.is_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {profile.is_approved ? 'Approved' : 'Pending'}
        </Badge>
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

function UserMobileCard({ profile, index, onUserDelete, onUserDeleteError }: { profile: Profile, index: number, onUserDelete: (userId: string) => void, onUserDeleteError: (msg: string) => void }) {
    return (
        <Card className="mb-4">
            <CardHeader>
                 <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-muted-foreground">#{index + 1}</p>
                            <CardTitle className="text-base">{profile.full_name}</CardTitle>
                            <CardDescription>{profile.email}</CardDescription>
                        </div>
                        <ActionsMenu profile={profile} onUserDelete={onUserDelete} onUserDeleteError={onUserDeleteError} />
                    </div>
                    <div className="self-start">
                        <StatusBadge profile={profile} />
                    </div>
                 </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div>
                    <div className="font-medium text-muted-foreground">Plan</div>
                    <div className='truncate'>{profile.plan_purchased || 'N/A'}</div>
                </div>
                 <div>
                    <div className="font-medium text-muted-foreground">Transaction ID</div>
                    <div className="truncate">{profile.transaction_id || 'N/A'}</div>
                </div>
                <PaymentSummary profile={profile} />
            </CardContent>
        </Card>
    )
}

function ActionsMenu({ profile, onUserDelete, onUserDeleteError }: { profile: Profile, onUserDelete: (userId: string) => void, onUserDeleteError: (msg: string) => void}) {
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
                        <p>Admin users cannot be deleted here.</p>
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

export function UserTable({ profiles, onUserDelete, onUserDeleteError }: UserTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        is_approved: '',
        kyc_status: '',
        credentials_provided: '',
        is_breached: '',
    });

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
            const matchesBreached = filters.is_breached ? String(profile.is_breached) === filters.is_breached : true;
            
            return matchesSearch && matchesApproved && matchesKyc && matchesCredentials && matchesBreached;
        });
    }, [searchTerm, profiles, filters]);
    
    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters(prev => ({...prev, [filterName]: value}));
    }
    
    const clearFilters = () => {
        setSearchTerm('');
        setFilters({
            is_approved: '',
            kyc_status: '',
            credentials_provided: '',
            is_breached: '',
        });
    }

    const isAnyFilterActive = searchTerm || Object.values(filters).some(v => v !== '');

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
                        </div>
                    </div>
                </div>

                <ClientOnly>
                    {/* Mobile View */}
                    <div className="md:hidden mt-4">
                        {filteredProfiles.length > 0 ? filteredProfiles.map((profile, index) => (
                           <UserMobileCard key={profile.id} profile={profile} index={index} onUserDelete={onUserDelete} onUserDeleteError={onUserDeleteError} />
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
                                            <TableRow key={profile.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell className="font-medium">{profile.full_name}</TableCell>
                                                <TableCell>{profile.email}</TableCell>
                                                <TableCell>
                                                    <StatusBadge profile={profile} />
                                                </TableCell>
                                                <TableCell>{profile.plan_purchased || 'N/A'}</TableCell>
                                                <TableCell>
                                                    {profile.transaction_id ? (
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <span className="block max-w-32 truncate">
                                                                    {profile.transaction_id}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{profile.transaction_id}</p>
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
                                                    <ActionsMenu profile={profile} onUserDelete={onUserDelete} onUserDeleteError={onUserDeleteError} />
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center h-24">
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

    