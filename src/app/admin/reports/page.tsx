
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


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
import { Home, Ticket, Wallet, LogOut, Banknote, MessageSquare, LineChart as LineChartIcon, Calendar as CalendarIcon, Loader2, Download, Swords } from 'lucide-react';
import { signOut } from '@/app/actions';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

function SalesDashboard({ initialData }: { initialData: SalesData }) {
    const [data, setData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    });
    const isMobile = useIsMobile();
    
    const chartConfig = {
      revenue: {
        label: "Revenue",
        color: "hsl(var(--primary))",
      },
    }

    const pieChartConfig = {
        instant: { label: 'Instant', color: 'hsl(var(--chart-1))' },
        oneStep: { label: '1-Step', color: 'hsl(var(--chart-2))' },
        twoStep: { label: '2-Step', color: 'hsl(var(--chart-3))' },
    }
    
    const pieChartData = [
        { name: 'Instant', value: data.instantRevenue, fill: 'var(--color-instant)' },
        { name: '1-Step', value: data.oneStepRevenue, fill: 'var(--color-oneStep)' },
        { name: '2-Step', value: data.twoStepRevenue, fill: 'var(--color-twoStep)' },
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
            // This case handles the "All Time" scenario when dates are cleared
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
    
    const downloadPdfReport = () => {
        setIsGeneratingReport(true);
        const doc = new jsPDF('p', 'mm', 'a4');
        let yPos = 20;

        // 1. Add Title
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Sales Performance Report', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 10;
        
        // 2. Add Date Range
        const dateString = date?.from ? `${format(date.from, 'LLL dd, y')} - ${date.to ? format(date.to, 'LLL dd, y') : 'Present'}` : 'All Time';
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date Range: ${dateString}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 15;

        // 3. Add Summary Cards Data as Text
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Overall Summary', 14, yPos);
        yPos += 8;

        const summaryData = [
            `Total Revenue: ${data.totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} (from ${data.totalSalesCount} users)`,
            `Today's Revenue: ${data.todayRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`,
            `Instant Revenue: ${data.instantRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`,
            `1-Step Revenue: ${data.oneStepRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`,
            `2-Step Revenue: ${data.twoStepRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`,
        ];

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        summaryData.forEach(line => {
            doc.text(line, 14, yPos);
            yPos += 7;
        });
        yPos += 10;

        // 4. Add Plan Breakdown Tables using jspdf-autotable
        const addTableToPdf = (title: string, tableData: { [key: string]: number }) => {
            const body = Object.entries(tableData).map(([name, revenue]) => [
                name,
                revenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
            ]);

            if (body.length > 0) {
                 if (yPos > 240) { // Check if there's enough space for the table header + some rows
                    doc.addPage();
                    yPos = 20;
                 }
                (doc as any).autoTable({
                    startY: yPos,
                    head: [['Plan Name', 'Revenue']],
                    body: body,
                    theme: 'striped',
                    headStyles: { fillColor: [22, 163, 74] }, // A green color
                    didDrawPage: (data: any) => {
                        yPos = data.cursor.y; // Update yPos after table draws
                    }
                });
                yPos = (doc as any).lastAutoTable.finalY + 10;
            }
        };

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Instant Funding Plans Breakdown', 14, yPos);
        yPos += 8;
        addTableToPdf('Instant Funding Plans Breakdown', data.instantPlanBreakdown);
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('1-Step Evaluation Plans Breakdown', 14, yPos);
        yPos += 8;
        addTableToPdf('1-Step Evaluation Plans Breakdown', data.oneStepPlanBreakdown);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('2-Step Evaluation Plans Breakdown', 14, yPos);
        yPos += 8;
        addTableToPdf('2-Step Evaluation Plans Breakdown', data.twoStepPlanBreakdown);
        
        doc.save('Sales_Report.pdf');
        setIsGeneratingReport(false);
    };

    const StatCard = ({ title, value, description, className }: { title: string, value: number, description?: string, className?: string }) => (
        <Card className={cn(className)}>
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
    
    const getTotalRevenueDescription = () => {
        if (date?.from || date?.to) {
            const fromStr = date.from ? format(date.from, "LLL dd") : '';
            const toStr = date.to ? format(date.to, "LLL dd") : '';
            if (fromStr && toStr) {
                return `Revenue from ${fromStr} to ${toStr} from ${data.totalSalesCount} users.`;
            }
            return `Revenue from ${data.totalSalesCount} users in selected period.`;
        }
        return `All time revenue from ${data.totalSalesCount} users.`;
    };

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
                     <Button onClick={downloadPdfReport} variant="outline" size="sm" disabled={isLoading || isGeneratingReport}>
                        {isGeneratingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Download PDF
                    </Button>
                </div>
            </div>

            {isLoading ? <DashboardSkeleton /> : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <StatCard title="Total Revenue" value={data.totalRevenue} description={getTotalRevenueDescription()} className="sm:col-span-2 lg:col-span-3"/>
                        <StatCard title="Today's Revenue" value={data.todayRevenue} className="lg:col-span-2"/>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                        <StatCard title="Instant Revenue" value={data.instantRevenue} />
                        <StatCard title="1-Step Revenue" value={data.oneStepRevenue} />
                        <StatCard title="2-Step Revenue" value={data.twoStepRevenue} />
                    </div>

                    <div id="charts-grid" className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <Card className="lg:col-span-3">
                             <CardHeader>
                                <CardTitle>Sales Trend</CardTitle>
                                <CardDescription>Daily revenue over the selected period. Total: <span className="font-bold">₹{data.totalRevenue.toLocaleString('en-IN')}</span></CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig} className="h-64">
                                    <RechartsLineChart data={data.salesByDate} margin={{ top: 5, right: 10, left: isMobile ? -30 : -20, bottom: 5 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis 
                                            dataKey="date" 
                                            tickLine={false} 
                                            axisLine={false} 
                                            tickMargin={8} 
                                            tickFormatter={(value) => format(new Date(value), "MMM d")}
                                            interval={isMobile ? Math.floor(data.salesByDate.length / 4) : 'preserveStartEnd'}
                                        />
                                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent indicator="dot" />}
                                            />
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
                                     <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                        <Pie data={pieChartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5} labelLine={false} label={({
                                            cx,
                                            cy,
                                            midAngle,
                                            innerRadius,
                                            outerRadius,
                                            percent,
                                            index,
                                          }) => {
                                            const RADIAN = Math.PI / 180
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN)
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN)

                                            return (
                                              <text
                                                x={x}
                                                y={y}
                                                fill="hsl(var(--primary-foreground))"
                                                textAnchor={x > cx ? "start" : "end"}
                                                dominantBaseline="central"
                                              >
                                                {`${(percent * 100).toFixed(0)}%`}
                                              </text>
                                            )
                                          }}>
                                            {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <Tabs defaultValue="instant">
                            <CardHeader>
                                <CardTitle>Revenue by Plan</CardTitle>
                                <TabsList className="grid w-full grid-cols-3 mt-2">
                                    <TabsTrigger value="instant">Instant</TabsTrigger>
                                    <TabsTrigger value="oneStep">1-Step</TabsTrigger>
                                    <TabsTrigger value="twoStep">2-Step</TabsTrigger>
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
                            <SidebarMenuButton href="/admin/competition" tooltip="Competition">
                                <Swords />
                                Competition
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
                                <LineChartIcon />
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
                    <ThemeToggle />
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
