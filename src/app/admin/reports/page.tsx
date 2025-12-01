
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import { Home, Ticket, Wallet, LogOut, Banknote, MessageSquare, LineChart } from 'lucide-react';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { signOut } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

async function getSalesData() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('final_amount_paid')
        .eq('is_approved', true);

    if (error) {
        console.error("Error fetching sales data:", error);
        return { error: 'Could not fetch sales data. Please try again later.' };
    }

    const totalRevenue = data.reduce((sum, current) => sum + (current.final_amount_paid || 0), 0);

    return { totalRevenue };
}


export default async function ReportsPage() {
    
    const { totalRevenue, error } = await getSalesData();

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="border-b p-4 h-[57px] flex items-center">
                    <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg">
                        <FundedStockLogo className="w-8 h-8 text-primary" />
                        <span className="text-foreground group-[[data-state=collapsed]]:hidden">FundedStock 2.0</span>
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/dashboard" tooltip="Dashboard">
                                <Home />
                                Dashboard
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/coupons" tooltip="Coupons">
                                <Ticket />
                                Coupons
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/payouts" tooltip="Payouts">
                                <Banknote />
                                Payouts
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/tickets" tooltip="Support">
                                <MessageSquare />
                                Support
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/reports" isActive tooltip="Reports">
                                <LineChart />
                                Reports
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/payment-settings" tooltip="Payment Settings">
                                <Wallet />
                                Payment Settings
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <form action={signOut} className="w-full">
                                <SidebarMenuButton tooltip="Logout" asChild>
                                    <button type="submit" className="w-full">
                                        <LogOut />
                                        Logout
                                    </button>
                                </SidebarMenuButton>
                            </form>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-xl font-semibold">Sales Report</h1>
                    </div>
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
                   <div className="max-w-4xl mx-auto">
                        {error ? (
                             <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Total Revenue</CardTitle>
                                    <CardDescription>
                                        This is the total revenue generated from all approved user signups.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-4xl font-bold">
                                        ₹{totalRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                   </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
