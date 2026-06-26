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


import { getPayLaterSalesData, SalesData } from './actions';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { FundedStockLogo } from '@/components/ui/logo';
import { Home, Ticket, Wallet, LogOut, Banknote, LineChart as LineChartIcon, Calendar as CalendarIcon, Loader2, Download, Swords, Users, RefreshCw, Newspaper, UserCheck } from 'lucide-react';
import { signOut } from '@/app/actions';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ClientOnly } from '@/components/ui/client-only';

function SalesDashboard({ initialData, masterView }: { initialData: SalesData, masterView: boolean }) {
    const [data, setData] = useState(initialData);
    const [isFetching, startTransition] = useTransition();
    const [date, setDate] = useState<DateRange | undefined>({ from: undefined, to: undefined });
    
    const chartConfig = {
      revenue: { label: "Revenue", color: "hsl(var(--primary))" },
      sales: { label: "Sales", color: "hsl(var(--chart-2))" },
    }

    const fetchAndSetData = async (from?: Date, to?: Date) => {
        startTransition(async () => {
            const result = await getPayLaterSalesData(from, to, masterView);
            if (result) setData(result);
        });
    };
    
    return (
         <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Pay Later Analytics</h2>
                    <p className="text-sm text-muted-foreground">Detailed revenue reports for PassThenPay users.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                    <Button onClick={() => fetchAndSetData(date?.from, date?.to)} variant="outline" size="sm" disabled={isFetching}><RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />Refresh</Button>
                </div>
            </div>

            {isFetching ? <div className="p-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto"/></div> : (
                <div className="grid gap-6">
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Net Revenue</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">₹{data.totalNetRevenue.toLocaleString('en-IN')}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Sales Count</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{data.totalSalesCount}</div></CardContent></Card>
                    </div>
                    
                    <Card>
                         <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
                        <CardContent>
                            <ClientOnly fallback={<Skeleton className="h-72" />}>
                                <ChartContainer config={chartConfig} className="h-72">
                                    <RechartsLineChart data={data.salesByDate}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => format(new Date(value), "MMM d")} />
                                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                    </RechartsLineChart>
                                </ChartContainer>
                            </ClientOnly>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default function PayLaterReportsPage() {
    const searchParams = useSearchParams();
    const masterView = searchParams.get('master_view') === 'true';
    const [initialData, setInitialData] = useState<SalesData | null>(null);

    useEffect(() => {
        getPayLaterSalesData(undefined, undefined, masterView).then(setInitialData);
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
                        <SidebarMenuItem><SidebarMenuButton href="/admin/dashboard" tooltip="Dashboard"><Home />Dashboard</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/account-requests" tooltip="Account Requests"><UserCheck />Account Requests</SidebarMenuButton></SidebarMenuItem>
                         <SidebarMenuItem><SidebarMenuButton href="/admin/competition" tooltip="Competition"><Swords />Competition</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/pay-later" tooltip="Pay Later Users"><Users />Pay Later Users</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/coupons" tooltip="Coupons"><Ticket />Coupons</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/blog" tooltip="Blog"><Newspaper />Blog</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/wallet-requests" tooltip="Wallet Requests"><Wallet />Wallet Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payouts" tooltip="Payouts"><Banknote />Payouts</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/reports" isActive tooltip="Reports"><LineChartIcon />Reports</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payment-settings" tooltip="Payment Settings"><Wallet />Payment Settings</SidebarMenuButton></SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu><SidebarMenuItem><form action={signOut} className="w-full"><SidebarMenuButton tooltip="Logout" asChild><button type="submit" className="w-full"><LogOut />Logout</button></SidebarMenuButton></form></SidebarMenuItem></SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4"><SidebarTrigger className="md:hidden" /><h1 className="text-xl font-semibold">Pay Later Sales Reports</h1></div>
                    <ThemeToggle />
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
                   <div className="max-w-7xl mx-auto">
                        {initialData ? <SalesDashboard initialData={initialData} masterView={masterView} /> : <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                   </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
