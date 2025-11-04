import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, Ticket, Trash2 } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { createCoupon, deleteCoupon } from './actions';
import { revalidatePath } from 'next/cache';

function DeleteButton({ couponId }: { couponId: number }) {
  const deleteWithId = async () => {
    "use server"
    await deleteCoupon(couponId);
    revalidatePath('/admin/coupons');
  }
  return (
    <form action={deleteWithId}>
      <Button variant="destructive" size="icon">
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  )
}

export default async function CouponsPage() {
  const supabase = createClient();
  const { data: coupons, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
           <h2 className="text-xl font-bold">PropStar Admin</h2>
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
        <SidebarFooter />
      </Sidebar>
      <SidebarInset>
         <header className="flex items-center justify-between p-4 border-b">
           <div>
            <h1 className="text-2xl font-bold">Coupon Management</h1>
            <p className="text-muted-foreground">Create and manage promotional coupons.</p>
          </div>
          <SidebarTrigger className="md:hidden" />
        </header>

        <main className="p-4 md:p-8 grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Coupons</CardTitle>
                <CardDescription>A list of all available coupons.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount Value (₹)</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons?.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-medium">{coupon.code}</TableCell>
                        <TableCell>₹{coupon.discount_value}</TableCell>
                        <TableCell>{new Date(coupon.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <DeleteButton couponId={coupon.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {coupons?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">No coupons found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
                <form action={createCoupon}>
                    <CardHeader>
                        <CardTitle>Create New Coupon</CardTitle>
                        <CardDescription>Add a new promotional code.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Coupon Code</Label>
                            <Input id="code" name="code" placeholder="e.g. SAVE100" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discount_value">Discount Value (₹)</Label>
                            <Input id="discount_value" name="discount_value" type="number" step="0.01" placeholder="e.g. 100.00" required />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit">Create Coupon</Button>
                    </CardFooter>
                </form>
            </Card>
          </div>
        </main>

      </SidebarInset>
    </SidebarProvider>
  );
}
