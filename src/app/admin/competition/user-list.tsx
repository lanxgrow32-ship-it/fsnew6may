
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClientOnly } from '@/components/ui/client-only';
import { Skeleton } from '@/components/ui/skeleton';

type Profile = {
    id: string;
    full_name: string;
    email: string;
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
                    // This is a simple implementation. A more robust one would merge changes.
                    const fetchProfiles = async () => {
                        const { data, error } = await supabase
                          .from('profiles')
                          .select('*')
                          .eq('account_type', 'competition')
                          .order('created_at', { ascending: false });

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

    const SkeletonTable = () => (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
    );

    return (
        <ClientOnly fallback={<SkeletonTable />}>
            <Card>
                <CardHeader>
                    <CardTitle>Competition Users</CardTitle>
                    <CardDescription>List of all users who have participated in trading competitions.</CardDescription>
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
