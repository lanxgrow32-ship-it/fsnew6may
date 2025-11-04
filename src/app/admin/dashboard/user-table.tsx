
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';

type Profile = {
    id: string;
    full_name: string;
    email: string;
    is_approved: boolean;
    plan_purchased: string | null;
    transaction_id: string | null;
    kyc_status: string;
};

function UserMobileCard({ profile }: { profile: Profile }) {
    return (
        <Card className="mb-4">
            <CardHeader>
                 <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow overflow-hidden">
                        <CardTitle className="text-base truncate">{profile.full_name}</CardTitle>
                        <CardDescription className="truncate">{profile.email}</CardDescription>
                    </div>
                     <Badge variant={profile.is_approved ? 'default' : 'destructive'} className={`${profile.is_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} shrink-0`}>
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
                <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link href={`/admin/profile/${profile.id}`}>Manage</Link>
                </Button>
            </CardContent>
        </Card>
    )
}

export function UserTable({ profiles }: { profiles: Profile[] }) {
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
                           <UserMobileCard key={profile.id} profile={profile} />
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
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/admin/profile/${profile.id}`}>Manage</Link>
                                                    </Button>
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
