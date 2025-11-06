
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Search, Trash2, Loader2 } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteUser } from './actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';


type Profile = {
    id: string;
    full_name: string;
    email: string;
    is_approved: boolean;
    plan_purchased: string | null;
    transaction_id: string | null;
    kyc_status: string;
    role: string;
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


function UserMobileCard({ profile, onUserDelete, onUserDeleteError }: { profile: Profile, onUserDelete: (userId: string) => void, onUserDeleteError: (msg: string) => void }) {
    return (
        <Card className="mb-4">
            <CardHeader>
                 <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-base">{profile.full_name}</CardTitle>
                            <CardDescription>{profile.email}</CardDescription>
                        </div>
                        <ActionsMenu profile={profile} onUserDelete={onUserDelete} onUserDeleteError={onUserDeleteError} />
                    </div>
                    <Badge variant={profile.is_approved ? 'default' : 'destructive'} className={`${profile.is_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} self-start`}>
                        {profile.is_approved ? 'Approved' : 'Pending'}
                    </Badge>
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
    const [filteredProfiles, setFilteredProfiles] = useState(profiles);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = profiles.filter((profile) => {
            return (
                profile.full_name?.toLowerCase().includes(lowercasedFilter) ||
                profile.email?.toLowerCase().includes(lowercasedFilter)
            );
        });
        setFilteredProfiles(filteredData);
    }, [searchTerm, profiles]);

    return (
        <Card className="shadow-sm">
            <CardHeader className="flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>User List</CardTitle>
                <CardDescription>A list of all users in the system.</CardDescription>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filter by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
               </div>
            </CardHeader>
            <CardContent>
                <ClientOnly>
                    {/* Mobile View */}
                    <div className="md:hidden">
                        {filteredProfiles.length > 0 ? filteredProfiles.map((profile) => (
                           <UserMobileCard key={profile.id} profile={profile} onUserDelete={onUserDelete} onUserDeleteError={onUserDeleteError} />
                        )) : (
                            <div className="text-center h-24 flex items-center justify-center">
                                <p>No users found.</p>
                            </div>
                        )}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <TooltipProvider>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Transaction ID</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProfiles.length > 0 ? filteredProfiles.map((profile) => (
                                            <TableRow key={profile.id}>
                                                <TableCell className="font-medium">{profile.full_name}</TableCell>
                                                <TableCell>{profile.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={profile.is_approved ? 'default' : 'destructive'} className={profile.is_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                        {profile.is_approved ? 'Approved' : 'Pending'}
                                                    </Badge>
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
                                                <TableCell className="text-right">
                                                    <ActionsMenu profile={profile} onUserDelete={onUserDelete} onUserDeleteError={onUserDeleteError} />
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center h-24">
                                                    No users found.
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
