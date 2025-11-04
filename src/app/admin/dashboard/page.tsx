
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, Ticket, User } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: profiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
           <h2 className="text-xl font-bold">PropStar Admin</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="/admin/dashboard" isActive>
                <Home />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/admin/coupons">
                <Ticket />
                Coupons
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            {/* Maybe a logout button here later */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
           <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Approve new sign-ups and manage user details.</p>
          </div>
          <SidebarTrigger className="md:hidden" />
        </header>
        <main className="p-4 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle>User List</CardTitle>
              <CardDescription>A list of all users in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
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
                    {profiles?.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.full_name}</TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>
                          <Badge variant={profile.is_approved ? 'default' : 'destructive'}>
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
                    ))}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
