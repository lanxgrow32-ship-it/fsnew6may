
import { createClient } from '@/lib/supabase/server';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, Ticket, Mountain, LogOut, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteCoupon } from './actions';

function DeleteButton({ coupon }: { coupon: { id: number, code: string }}) {
  return (
    <form action={async () => {
      'use server';
      await deleteCoupon(coupon.id);
    }}>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the coupon <span className="font-bold">{coupon.code}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
                <Button type="submit" className="bg-destructive hover:bg-destructive/90">
                    Delete
                </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

export default async function CouponsPage() {
  const supabase = createClient();
  const { data: coupons, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching coupons: ", error);
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b">
           <div className="h-14 flex items-center px-4">
                <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg">
                    <Mountain className="w-6 h-6 text-primary" />
                    <span className="text-foreground">PropStar</span>
                </Link>
           </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="/admin/dashboard">
                <Home />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton href="/admin/coupons" isActive>
                <Ticket />
                Coupons
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton>
                        <LogOut />
                        Logout
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
         <header className="flex h-14 items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
           <div className="flex items-center gap-4">
             <SidebarTrigger className="md:hidden" />
             <h1 className="text-xl font-semibold">Coupon Management</h1>
           </div>
           <Button asChild>
                <Link href="/admin/coupons/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Coupon
                </Link>
           </Button>
        </header>
        <main className="p-4 md:p-8">
           <Card>
            <CardHeader>
                <CardTitle>Active Coupons</CardTitle>
                <CardDescription>A list of all currently available coupons.</CardDescription>
            </CardHeader>
            <CardContent>
                {!coupons || coupons.length === 0 ? (
                    <p className="text-muted-foreground">No active coupons found. Use the 'Create New Coupon' button to add one.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {coupons.map((coupon) => (
                                    <TableRow key={coupon.id}>
                                        <TableCell className="font-medium">{coupon.code}</TableCell>
                                        <TableCell>{coupon.discount_value}%</TableCell>
                                        <TableCell>{new Date(coupon.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <DeleteButton coupon={coupon} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
