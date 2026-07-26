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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { FundedStockLogo } from '@/components/ui/logo';
import { 
    Home, 
    Ticket, 
    Wallet, 
    LogOut, 
    Banknote, 
    LineChart as LineChartIcon, 
    Calendar as CalendarIcon, 
    Loader2, 
    Download, 
    Swords, 
    Users, 
    RefreshCw, 
    Newspaper, 
    UserCheck,
    Globe,
    LayoutGrid
} from 'lucide-react';
import { signOut } from '@/app/actions';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ClientOnly } from '@/components/ui/client-only';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const StatCard = ({ title, value, description, prefix = '₹' }: { title: string, value: number, description?: string, prefix?: string }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-widest">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-black tracking-tighter">
                {prefix}{value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            {description && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{description}</p>}
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
                            <TableCell className="font-bold text-xs">{name}</TableCell>
                            <TableCell className="text-center font-bold text-xs">{sales}</TableCell>
                            <TableCell className="text-right font-black text-xs">₹{revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
    
    // Global Market Context
    const [marketType, setMarketType] = useState<'indian' | 'forex'>('indian');
    const { toast } = useToast();

    useEffect(() => {
        const saved = localStorage.getItem('fs_admin_market') as 'indian' | 'forex';
        if (saved) {
            setMarketType(saved);
            fetchAndSetData(date?.from, date?.to, saved);
        }
    }, []);

    const handleMarketSwitch = (type: 'indian' | 'forex') => {
        setMarketType(type);
        localStorage.setItem('fs_admin_market', type);
        toast({ title: `Report Switch`, description: `Analyzing ${type === 'indian' ? 'Indian Market' : 'Forex Arena'}` });
        fetchAndSetData(date?.from, date?.to, type);
    }
    
    const chartConfig = {
      revenue: { label: "Revenue", color: "hsl(var(--primary))" },
      sales: { label: "Sales", color: "hsl(var(--chart-2))" },
    }

    const pieChartConfig = {
        'Instant': { label: 'Instant', color: 'hsl(var(--chart-1))' },
        '1-Step': { label: '1-Step', color: 'hsl(var(--chart-2))' },
        '2-Step': { label: '2-Step', color: 'hsl(var(--chart-3))' },
        'Indian': { label: 'Indian', color: 'hsl(var(--chart-4))' },
        'Forex': { label: 'Forex', color: 'hsl(var(--chart-5))' },
    }
    
    const pieChartData = data.planCategoryBreakdown.filter(d => d.value > 0).map(d => ({
        ...d, fill: `var(--color-${d.name})`
    }));

    const fetchAndSetData = async (from?: Date, to?: Date, market?: string) => {
        startTransition(async () => {
            const result = await getSalesData(from, to, masterView, market || marketType);
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

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(`${marketType.toUpperCase()} Sales Executive Summary`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 15;

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
                headStyles: { fillColor: [40, 40, 40] }
            });
        }
        
        doc.save(`Executive_Sales_Report_${marketType}.pdf`);
        setIsGeneratingReport(false);
    };

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
                            <div className="px-2 py-4 space-y-4">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Market Context</p>
                                <div className="flex flex-col gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleMarketSwitch('indian')}
                                        className={cn("justify-start gap-2 h-10 px-3", marketType === 'indian' ? "bg-primary text-white hover:bg-primary" : "text-muted-foreground")}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                        Indian Market
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleMarketSwitch('forex')}
                                        className={cn("justify-start gap-2 h-10 px-3", marketType === 'forex' ? "bg-primary text-white hover:bg-primary" : "text-muted-foreground")}
                                    >
                                        <Globe className="w-4 h-4" />
                                        Forex Arena
                                    </Button>
                                </div>
                                <Separator className="opacity-50" />
                            </div>
                        </SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/dashboard" tooltip="Dashboard"><Home />Dashboard</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/account-requests" tooltip="Account Requests"><UserCheck />Account Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/activation-hub" tooltip="Activation Hub"><ShieldAlert />Activation Hub</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/competition" tooltip="Competition"><Swords />Competition</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/pay-later" tooltip="Pay Later Users"><Users />Pay Later Users</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/coupons" tooltip="Coupons"><Ticket />Coupons</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/blog" tooltip="Blog"><Newspaper />Blog</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/wallet-requests" tooltip="Wallet Requests"><Wallet />Wallet Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payouts" tooltip="Payouts"><Banknote />Payouts</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/reports" isActive tooltip="Sales Reports"><LineChartIcon />Reports</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payment-settings" tooltip="Payment Settings"><Wallet />Settings</SidebarMenuButton></SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu><SidebarMenuItem><form action={signOut} className="w-full"><SidebarMenuButton tooltip="Logout" asChild><button type="submit" className="w-full"><LogOut />Logout</button></SidebarMenuButton></form></SidebarMenuItem></SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                            Financial Reports
                            <Badge className="bg-primary/5 text-primary border-primary/20 text-[10px] font-black uppercase">
                                {marketType === 'indian' ? 'Indian' : 'Forex'}
                            </Badge>
                        </h1>
                    </div>
                    <ThemeToggle />
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
                   <div className="max-w-7xl mx-auto space-y-6">
                        <div className="flex flex-col xl:flex-row gap-4 xl:items-end justify-between">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight uppercase">Sales Analytics</h2>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Core execution revenue flow · StockMint v3.0</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className="w-full sm:w-[240px] h-11 justify-start text-left font-normal bg-card">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date?.from ? (date.to ? `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}` : format(date.from, "LLL dd, y")) : (<span>Pick a date range</span>)}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                        <Calendar initialFocus mode="range" selected={date} onSelect={(d) => { setDate(d); fetchAndSetData(d?.from, d?.to); }} numberOfMonths={2} />
                                    </PopoverContent>
                                </Popover>
                                <div className="flex gap-1">
                                    <Button onClick={() => handleDatePreset(0)} variant="ghost" size="sm" className="h-11 px-4 font-bold text-xs uppercase">Today</Button>
                                    <Button onClick={() => handleDatePreset(6)} variant="ghost" size="sm" className="h-11 px-4 font-bold text-xs uppercase">7D</Button>
                                    <Button onClick={() => handleDatePreset(29)} variant="ghost" size="sm" className="h-11 px-4 font-bold text-xs uppercase">30D</Button>
                                </div>
                                <Button onClick={() => fetchAndSetData(date?.from, date?.to)} variant="outline" size="sm" className="h-11 px-4 font-bold text-xs uppercase" disabled={isFetching}><RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />Refresh</Button>
                                <Button onClick={downloadPdfReport} variant="outline" size="sm" className="h-11 px-4 font-bold text-xs uppercase" disabled={isFetching || isGeneratingReport}>{isGeneratingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Export</Button>
                            </div>
                        </div>

                        {isFetching ? <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary"/></div> : (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                                    <StatCard title="Gross Revenue" value={data.totalGrossRevenue} description="Before coupon deductions" />
                                    <StatCard title="Net Revenue" value={data.totalNetRevenue} description={`from ${data.totalSalesCount} verified sales`} />
                                    <StatCard title="Total Discounts" value={data.totalDiscounts} description="Coupons & Referrals issued"/>
                                    <StatCard title="Average Order" value={data.arpu} description="Revenue per acquisition" />
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                    <Card className="lg:col-span-3 border-white/5 bg-card/50">
                                        <CardHeader><CardTitle className="text-base font-black uppercase tracking-widest">Revenue Performance</CardTitle></CardHeader>
                                        <CardContent>
                                            <ClientOnly fallback={<Skeleton className="h-72" />}>
                                                <ChartContainer config={chartConfig} className="h-72">
                                                    <RechartsLineChart data={data.salesByDate}>
                                                        <CartesianGrid vertical={false} strokeOpacity={0.1} />
                                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => format(new Date(value), "MMM d")} />
                                                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                                                    </RechartsLineChart>
                                                </ChartContainer>
                                            </ClientOnly>
                                        </CardContent>
                                    </Card>
                                    <Card className="lg:col-span-2 border-white/5 bg-card/50">
                                        <CardHeader><CardTitle className="text-base font-black uppercase tracking-widest">Plan Composition</CardTitle></CardHeader>
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
                                    <Card className="border-white/5 bg-card/50">
                                        <CardHeader><CardTitle className="text-base font-black uppercase tracking-widest">Top Revenue Plans</CardTitle></CardHeader>
                                        <CardContent><PlanBreakdownTable plans={data.topPlans} /></CardContent>
                                    </Card>
                                    <Card className="border-white/5 bg-card/50">
                                        <CardHeader><CardTitle className="text-base font-black uppercase tracking-widest">All Plan Performance</CardTitle></CardHeader>
                                        <CardContent><PlanBreakdownTable plans={data.allPlansBreakdown} /></CardContent>
                                    </Card>
                                </div>
                            </>
                        )}
                   </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

function ReportsPageInner() {
    const searchParams = useSearchParams();
    const masterView = searchParams.get('master_view') === 'true';
    const [initialData, setInitialData] = useState<SalesData | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('fs_admin_market') || 'indian';
        getSalesData(undefined, undefined, masterView, saved).then(setInitialData);
    }, [masterView]);

    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-slate-950"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            {initialData ? <SalesDashboard initialData={initialData} masterView={masterView} /> : <div className="flex items-center justify-center h-screen bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
        </Suspense>
    );
}

export default function ReportsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-slate-950"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>}>
            <ReportsPageInner />
        </Suspense>
    );
}
