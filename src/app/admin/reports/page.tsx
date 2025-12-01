
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { getSalesData, SalesData } from './actions';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { FundedStockLogo } from '@/components/ui/logo';
import { Home, Ticket, Wallet, LogOut, Banknote, MessageSquare, LineChart, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { signOut } from '@/app/actions';

function SalesDashboard({ initialData }: { initialData: SalesData }) {
    const [data, setData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    });

    useEffect(() => {
        const fetchDataForRange = async () => {
            if (date?.from && date?.to) {
                setIsLoading(true);
                const result = await getSalesData(date.from, date.to);
                if (result) {
                    setData(result);
                }
                setIsLoading(false);
            }
        };
        fetchDataForRange();
    }, [date]);
    
    const setDatePreset = (days: number | null) => {
        if (days === null) { // All time
            setDate({ from: undefined, to: undefined });
            setData(initialData); // Reset to initial full data
        } else {
            const to = endOfDay(new Date());
            const from = startOfDay(subDays(new Date(), days));
            setDate({ from, to });
        }
    }

    const StatCard = ({ title, value, description }: { title: string, value: number, description?: string }) => (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );

    const PlanBreakdownTable = ({ plans }: { plans: { [key: string]: number } }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Object.keys(plans).length > 0 ? (
                    Object.entries(plans).map(([name, revenue]) => (
                        <TableRow key={name}>
                            <TableCell className="font-medium">{name}</TableCell>
                            <TableCell className="text-right">₹{revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center h-24">No sales in this category for the selected period.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    const DashboardSkeleton = () => (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-10 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    );
    
    return (
         <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                <h2 className="text-2xl font-bold">Sales Overview</h2>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className="w-[280px] justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
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
                    <Button onClick={() => setDatePreset(0)}>Today</Button>
                     <Button onClick={() => setDatePreset(6)}>Last 7 Days</Button>
                    <Button onClick={() => setDatePreset(29)}>Last 30 Days</Button>
                     <Button onClick={() => setDatePreset(null)} variant="ghost">All Time</Button>
                </div>
            </div>

            {isLoading ? <DashboardSkeleton /> : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Total Revenue" value={data.totalRevenue} />
                        <StatCard title="Today's Revenue" value={data.todayRevenue} />
                        <StatCard title="Instant Funding Revenue" value={data.instantRevenue} />
                        <StatCard title="Evaluation Revenue" value={data.evaluationRevenue} />
                    </div>

                    <Card>
                        <Tabs defaultValue="instant">
                            <CardHeader>
                                <CardTitle>Revenue by Plan Type</CardTitle>
                                <TabsList className="grid w-full grid-cols-3 mt-2">
                                    <TabsTrigger value="instant">Instant Funding</TabsTrigger>
                                    <TabsTrigger value="oneStep">1-Step Plans</TabsTrigger>
                                    <TabsTrigger value="twoStep">2-Step Plans</TabsTrigger>
                                </TabsList>
                            </CardHeader>
                            <CardContent>
                                <TabsContent value="instant">
                                    <PlanBreakdownTable plans={data.instantPlanBreakdown} />
                                </TabsContent>
                                <TabsContent value="oneStep">
                                    <PlanBreakdownTable plans={data.oneStepPlanBreakdown} />
                                </TabsContent>
                                <TabsContent value="twoStep">
                                    <PlanBreakdownTable plans={data.twoStepPlanBreakdown} />
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>
                </>
            )}
        </div>
    );
}


export default function ReportsPage() {
    const [initialData, setInitialData] = useState<SalesData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSalesData()
            .then(data => {
                if (data) {
                    setInitialData(data);
                } else {
                    setError('Could not fetch sales data. The function returned no data.');
                }
            })
            .catch(err => {
                 console.error("Error fetching initial sales data:", err);
                 setError('Failed to load sales data. Please check the server logs.');
            });
    }, []);

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
                        <h1 className="text-xl font-semibold">Sales Reports</h1>
                    </div>
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
                   <div className="max-w-7xl mx-auto">
                        {error ? (
                            <Card className="flex items-center justify-center h-96">
                                <CardContent className="text-center">
                                    <CardTitle className="text-destructive">An Error Occurred</CardTitle>
                                    <CardDescription>{error}</CardDescription>
                                </CardContent>
                            </Card>
                        ) : initialData ? (
                            <SalesDashboard initialData={initialData} />
                        ) : (
                             <div className="flex items-center justify-center h-96">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                             </div>
                        )}
                   </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
