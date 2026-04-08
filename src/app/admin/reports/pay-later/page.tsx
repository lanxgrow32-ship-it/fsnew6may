
'use client';

import { useState, useEffect, Suspense, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


import { getPayLaterSalesData, SalesData } from './actions';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { FundedStockLogo } from '@/components/ui/logo';
import { Home, Ticket, Wallet, LogOut, Banknote, MessageSquare, LineChart as LineChartIcon, Calendar as CalendarIcon, Loader2, Download, Swords, Users, RefreshCw, TrendingUp, TrendingDown, ArrowRight, IndianRupee } from 'lucide-react';
import { signOut } from '@/app/actions';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ClientOnly } from '@/components/ui/client-only';


interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const StatCard = ({ title, value, change, description, prefix = '₹', suffix = '' }: { title: string, value: number, change?: number | null, description?: string, prefix?: string, suffix?: string }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-bold">
                {prefix}{value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}{suffix}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                 {typeof change === 'number' && (
                    <span className={cn('flex items-center gap-1', change >= 0 ? 'text-green-600' : 'text-destructive')}>
                        {change >= 0 ? <TrendingUp className="h-4 w-4"/> : <TrendingDown className="h-4 w-4"/>}
                        {change.toFixed(2)}%
                    </span>
                )}
                {description && <p>{description}</p>}
            </div>
        </CardContent>
    </Card>
);

const PlanBreakdownTable = ({ plans }: { plans: { name: string, revenue: number, sales: number }[] }) => (
    <div className="max-h-80 overflow-y-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead className="text-center">Sales Count</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {plans.length > 0 ? (
                    plans.map(({ name, revenue, sales }) => (
                        <TableRow key={name}>
                            <TableCell className="font-medium">{name}</TableCell>
                            <TableCell className="text-center">{sales}</TableCell>
                            <TableCell className="text-right">₹{revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center h-24">No sales data for the selected period.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
);


function SalesDashboard({ initialData, masterView }: { initialData: SalesData, masterView: boolean }) {
    const [data, setData] = useState(initialData);
    const [isFetching, startTransition] = useTransition();
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>({ from: undefined, to: undefined });
    const isMobile = useIsMobile();
    
    const chartConfig = {
      revenue: { label: "Revenue", color: "hsl(var(--primary))" },
      sales: { label: "Sales", color: "hsl(var(--chart-2))" },
    }

    const pieChartConfig = {
        'Instant': { label: 'Instant', color: 'hsl(var(--chart-1))' },
        '1-Step': { label: '1-Step', color: 'hsl(var(--chart-2))' },
        '2-Step': { label: '2-Step', color: 'hsl(var(--chart-3))' },
        'PassThenPay': { label: 'PassThenPay', color: 'hsl(var(--chart-4))' },
    }
    
    const pieChartData = data.planCategoryBreakdown.filter(d => d.value > 0).map(d => ({
        ...d, fill: `var(--color-${d.name})`
    }));


    const fetchAndSetData = async (from?: Date, to?: Date) => {
        startTransition(async () => {
            const result = await getPayLaterSalesData(from, to, masterView);
            if (result) setData(result);
        });
    };
    
    const handleDatePreset = (days: number | null) => {
        let newDate: DateRange | undefined;
        if (days === null) {
            newDate = { from: undefined, to: undefined };
        } else {
            newDate = { from: startOfDay(subDays(new Date(), days)), to: endOfDay(new Date()) };
        }
        setDate(newDate);
        fetchAndSetData(newDate.from, newDate.to);
    }
    
    const downloadPdfReport = () => {
        setIsGeneratingReport(true);
        const doc = new jsPDF('p', 'mm', 'a4') as jsPDFWithAutoTable;
        let yPos = 20;

        // --- Header ---
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Pay Later Sales Executive Summary', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 10;
        const dateString = date?.from ? `${format(date.from, 'LLL dd, y')} - ${date.to ? format(date.to, 'LLL dd, y') : 'Present'}` : 'All Time';
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date Range: ${dateString}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 15;

        // --- KPIs ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Performance Indicators', 14, yPos);
        yPos += 8;

        const kpiData = [
            `Net Revenue: ${data.totalNetRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`,
            `Total Sales: ${data.totalSalesCount}`,
            `ARPU: ${data.arpu.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`,
            `Total Discounts: ${data.totalDiscounts.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`,
        ];

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        kpiData.forEach(line => { doc.text(line, 14, yPos); yPos += 7; });
        yPos += 5;

        // --- Top Plans Table ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Top Performing Plans', 14, yPos);
        yPos += 8;

        const topPlansBody = data.topPlans.map(plan => [
            plan.name,
            plan.sales,
            plan.revenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
        ]);
        
        if (topPlansBody.length > 0) {
            doc.autoTable({
                startY: yPos,
                head: [['Plan Name', 'Sales Count', 'Revenue']],
                body: topPlansBody,
                theme: 'striped',
                headStyles: { fillColor: [40, 40, 40] },
                didDrawPage: (data: any) => { yPos = data.cursor.y; }
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
        }

        // --- Recent Sales Log ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Recent Sales Log', 14, yPos);
        yPos += 8;
        
        const recentSalesBody = data.recentSales.map(sale => [
            format(new Date(sale.date), 'dd/MM/yy'),
            sale.name || 'N/A',
            sale.plan,
            sale.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
        ]);

        if (recentSalesBody.length > 0) {
            doc.autoTable({
                startY: yPos,
                head: [['Date', 'User Name', 'Plan', 'Amount']],
                body: recentSalesBody,
                theme: 'grid',
                headStyles: { fillColor: [40, 40, 40] },
            });
        }
        
        doc.save('PayLater_Sales_Report.pdf');
        setIsGeneratingReport(false);
    };

    const DashboardSkeleton = () => (
        <div className="space-y-6 animate-pulse">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Skeleton className="h-80 lg:col-span-3" />
                <Skeleton className="h-80 lg:col-span-2" />
            </div>
            <Skeleton className="h-96" />
        </div>
    );

    return (
         <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Analytics Hub</h2>
                    <p className="text-sm text-muted-foreground">This report only includes sales from "PassThenPay" users.</p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className="w-full sm:w-[240px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (date.to ? `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}` : format(date.from, "LLL dd, y")) : (<span>Pick a date range</span>)}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar initialFocus mode="range" selected={date} onSelect={(d) => { setDate(d); fetchAndSetData(d?.from, d?.to); }} numberOfMonths={2} />
                        </PopoverContent>
                    </Popover>
                    <div className="flex gap-2">
                        <Button onClick={() => handleDatePreset(0)} variant="ghost" size="sm">Today</Button>
                        <Button onClick={() => handleDatePreset(6)} variant="ghost" size="sm">7D</Button>
                        <Button onClick={() => handleDatePreset(29)} variant="ghost" size="sm">30D</Button>
                        <Button onClick={() => handleDatePreset(null)} variant="ghost" size="sm">All</Button>
                    </div>
                    <Button onClick={() => fetchAndSetData(date?.from, date?.to)} variant="outline" size="sm" disabled={isFetching}><RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />Refresh</Button>
                    <Button onClick={downloadPdfReport} variant="outline" size="sm" disabled={isFetching || isGeneratingReport}>{isGeneratingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}PDF</Button>
                </div>
            </div>

            {isFetching ? <DashboardSkeleton /> : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        <StatCard title="Gross Revenue" value={data.totalGrossRevenue} description="Before discounts" />
                        <StatCard title="Net Revenue" value={data.totalNetRevenue} description={`from ${data.totalSalesCount} sales`} />
                        <StatCard title="Total Discounts" value={data.totalDiscounts} description="Coupons & Referrals"/>
                        <StatCard title="Average Revenue / User" value={data.arpu} description="ARPU" />
                        <StatCard title="WoW Revenue" value={data.thisWeekRevenue} change={data.wowRevenueGrowth} description="vs. last week"/>
                        <StatCard title="MoM Revenue" value={data.thisMonthRevenue} change={data.momRevenueGrowth} description="vs. last month"/>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <Card className="lg:col-span-3">
                             <CardHeader>
                                <CardTitle>Revenue vs. Sales Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ClientOnly fallback={<Skeleton className="h-72" />}>
                                    <ChartContainer config={chartConfig} className="h-72">
                                        <RechartsLineChart data={data.salesByDate} margin={{ top: 5, right: 10, left: isMobile ? -30 : -10, bottom: 5 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => format(new Date(value), "MMM d")} />
                                            <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                                            <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                            <Line yAxisId="right" type="monotone" dataKey="sales" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                                        </RechartsLineChart>
                                    </ChartContainer>
                                </ClientOnly>
                            </CardContent>
                        </Card>
                         <Card className="lg:col-span-2">
                             <CardHeader>
                                <CardTitle>Revenue by Category</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center">
                                <ClientOnly fallback={<Skeleton className="h-72" />}>
                                    <ChartContainer config={pieChartConfig} className="h-72 w-full">
                                        <PieChart>
                                            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                            <Pie data={pieChartData} dataKey="value" nameKey="name" innerRadius="60%" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                                {pieChartData.map((entry) => (<Cell key={entry.name} fill={entry.fill} />))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </ClientOnly>
                            </CardContent>
                        </Card>
                    </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                             <CardHeader><CardTitle>Top 5 Selling Plans</CardTitle></CardHeader>
                             <CardContent><PlanBreakdownTable plans={data.topPlans} /></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Peak Activity by Day</CardTitle></CardHeader>
                            <CardContent>
                               <ClientOnly fallback={<Skeleton className="h-64" />}>
                                    <ChartContainer config={{}} className="h-64">
                                        <BarChart data={data.salesByDayOfWeek} margin={{ top: 5, right: 10, left: isMobile ? -30 : -10, bottom: 5 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                                            <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={4} />
                                        </BarChart>
                                    </ChartContainer>
                                </ClientOnly>
                            </CardContent>
                        </Card>
                     </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                             <CardHeader><CardTitle>Full Plan Performance</CardTitle></CardHeader>
                             <CardContent><PlanBreakdownTable plans={data.allPlansBreakdown} /></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Peak Activity by Hour</CardTitle></CardHeader>
                            <CardContent>
                               <ClientOnly fallback={<Skeleton className="h-64" />}>
                                    <ChartContainer config={{}} className="h-64">
                                        <BarChart data={data.salesByHour} margin={{ top: 5, right: 10, left: isMobile ? -30 : -10, bottom: 5 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} />
                                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                                            <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={4} />
                                        </BarChart>
                                    </ChartContainer>
                                </ClientOnly>
                            </CardContent>
                        </Card>
                     </div>
                     
                     <Card>
                        <CardHeader>
                            <CardTitle>Recent Sales Log</CardTitle>
                            <CardDescription>A log of the last 25 sales transactions in the selected period.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.recentSales.length > 0 ? data.recentSales.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell>
                                                <div className="font-medium">{sale.name}</div>
                                                <div className="text-xs text-muted-foreground">{sale.email}</div>
                                            </TableCell>
                                            <TableCell>{sale.plan}</TableCell>
                                            <TableCell>{format(new Date(sale.date), 'PPp')}</TableCell>
                                            <TableCell className="text-right font-semibold">₹{sale.amount.toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">No recent sales found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                     </Card>
                </>
            )}
        </div>
    );
}

function ReportsPageContent() {
    const searchParams = useSearchParams();
    const masterView = searchParams.get('master_view') === 'true';
    const [initialData, setInitialData] = useState<SalesData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getPayLaterSalesData(undefined, undefined, masterView)
            .then(data => {
                if (data) setInitialData(data);
                else setError('Could not fetch sales data.');
            })
            .catch(err => {
                 console.error("Error fetching initial sales data:", err);
                 setError('Failed to load sales data.');
            });
    }, [masterView]);

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
                            <SidebarMenuButton href="/admin/dashboard" tooltip="Dashboard"><Home />Dashboard</SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/competition" tooltip="Competition"><Swords />Competition</SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton href="/admin/pay-later" tooltip="Pay Later Users">
                            <Users />
                            Pay Later Users
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/coupons" tooltip="Coupons"><Ticket />Coupons</SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/payouts" tooltip="Payouts"><Banknote />Payouts</SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/tickets" tooltip="Support"><MessageSquare />Support</SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/reports" tooltip="Reports"><LineChartIcon />Reports</SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/reports/pay-later" isActive tooltip="Pay Later Reports"><LineChartIcon />Pay Later Reports</SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/payment-settings" tooltip="Payment Settings"><Wallet />Payment Settings</SidebarMenuButton>
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
                        <h1 className="text-xl font-semibold">Pay Later Sales Reports</h1>
                    </div>
                    <ThemeToggle />
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
                   <div className="max-w-7xl mx-auto">
                        {error && <Card className="flex items-center justify-center h-96"><CardContent className="text-center"><CardTitle className="text-destructive">An Error Occurred</CardTitle><CardDescription>{error}</CardDescription></CardContent></Card>}
                        {initialData ? <SalesDashboard initialData={initialData} masterView={masterView} /> : <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                   </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

export default function PayLaterReportsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <ReportsPageContent />
        </Suspense>
    )
}
