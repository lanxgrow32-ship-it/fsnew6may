
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import Papa from 'papaparse';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  DonutChart,
} from 'recharts';

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
import { Home, Ticket, Wallet, LogOut, Banknote, MessageSquare, LineChart, Calendar as CalendarIcon, Loader2, Download } from 'lucide-react';
import { signOut } from '@/app/actions';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

function SalesDashboard({ initialData }: { initialData: SalesData }) {
    const [data, setData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    });
    
    const chartConfig = {
      revenue: {
        label: "Revenue",
        color: "hsl(var(--chart-1))",
      },
    }

    const pieChartConfig = {
        instant: { label: 'Instant', color: 'hsl(var(--chart-1))' },
        oneStep: { label: '1-Step', color: 'hsl(var(--chart-2))' },
        twoStep: { label: '2-Step', color: 'hsl(var(--chart-3))' },
    }
    
    const pieChartData = [
        { name: 'Instant', value: data.instantRevenue, fill: pieChartConfig.instant.color },
        { name: '1-Step', value: data.oneStepRevenue, fill: pieChartConfig.oneStep.color },
        { name: '2-Step', value: data.twoStepRevenue, fill: pieChartConfig.twoStep.color },
    ].filter(d => d.value > 0);


    const fetchAndSetData = async (from?: Date, to?: Date) => {
        setIsLoading(true);
        const result = await getSalesData(from, to);
        if (result) {
            setData(result);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (date?.from || date?.to) {
            fetchAndSetData(date.from, date.to);
        } else {
            fetchAndSetData();
        }
    }, [date]);
    
    const setDatePreset = (days: number | null) => {
        if (days === null) { // All time
            setDate({ from: undefined, to: undefined });
        } else {
            const to = endOfDay(new Date());
            const from = startOfDay(subDays(new Date(), days));
            setDate({ from, to });
        }
    }
    
    const downloadReport = () => {
        if (!data) return;

        const reportData = [
            ...Object.entries(data.instantPlanBreakdown),
            ...Object.entries(data.oneStepPlanBreakdown),
            ...Object.entries(data.twoStepPlanBreakdown),
        ].map(([planName, revenue]) => ({
            "Plan Name": planName,
            "Revenue": revenue,
        }));

        const csv = Papa.unparse(reportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const dateString = date?.from ? `${format(date.from, 'yyyy-MM-dd')}_to_${date.to ? format(date.to, 'yyyy-MM-dd') : ''}` : 'all-time';
        link.setAttribute('download', `sales_report_${dateString}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


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
                    Object.entries(plans).sort(([, a], [, b]) => b - a).map(([name, revenue]) => (
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
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Skeleton className="h-28" />
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
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
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
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Sales Dashboard</h2>
                    <p className="text-muted-foreground">Here's an overview of your sales performance.</p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className="w-full sm:w-[240px] justify-start text-left font-normal"
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
                    <div className="flex gap-2">
                        <Button onClick={() => setDatePreset(0)} variant="ghost" size="sm">Today</Button>
                        <Button onClick={() => setDatePreset(6)} variant="ghost" size="sm">7D</Button>
                        <Button onClick={() => setDatePreset(29)} variant="ghost" size="sm">30D</Button>
                        <Button onClick={() => setDatePreset(null)} variant="ghost" size="sm">All</Button>
                    </div>
                     <Button onClick={downloadReport} variant="outline" size="sm" disabled={isLoading}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                    </Button>
                </div>
            </div>

            {isLoading ? <DashboardSkeleton /> : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                       <StatCard title="Total Revenue" value={data.totalRevenue} description={date?.from && date?.to ? `From ${format(date.from, "LLL dd")} to ${format(date.to, "LLL dd")}` : 'All time revenue'}/>
                       <StatCard title="Today's Revenue" value={data.todayRevenue} />
                       <StatCard title="Instant Revenue" value={data.instantRevenue} />
                       <StatCard title="1-Step Revenue" value={data.oneStepRevenue} />
                       <StatCard title="2-Step Revenue" value={data.twoStepRevenue} />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <Card className="lg:col-span-3">
                             <CardHeader>
                                <CardTitle>Sales Trend</CardTitle>
                                <CardDescription>Daily revenue over the selected period.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig} className="h-64">
                                    <RechartsLineChart data={data.salesByDate} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => format(new Date(value), "MMM d")} />
                                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `₹${value / 1000}k`} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                    </RechartsLineChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                         <Card className="lg:col-span-2">
                             <CardHeader>
                                <CardTitle>Revenue by Type</CardTitle>
                                <CardDescription>Breakdown of revenue by plan category.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                                <ChartContainer config={pieChartConfig} className="h-64">
                                     <DonutChart>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                        <Pie data={pieChartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                            {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </DonutChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <Tabs defaultValue="instant">
                            <CardHeader>
                                <CardTitle>Revenue by Plan</CardTitle>
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
