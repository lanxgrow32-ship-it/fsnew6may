
'use server';

import { createClient } from '@/lib/supabase/server';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

export interface SalesData {
    // Core KPIs
    totalNetRevenue: number;
    totalGrossRevenue: number;
    totalDiscounts: number;
    totalSalesCount: number;
    arpu: number;
    
    // Growth Metrics
    wowRevenueGrowth: number | null;
    momRevenueGrowth: number | null;
    thisWeekRevenue: number;
    thisMonthRevenue: number;

    // Chart Data
    salesByDate: { date: string, revenue: number, sales: number }[];
    planCategoryBreakdown: { name: string, value: number }[];
    topPlans: { name: string, revenue: number, sales: number }[];
    salesByDayOfWeek: { day: string, revenue: number }[];
    salesByHour: { hour: string, revenue: number }[];
    allPlansBreakdown: { name: string, revenue: number, sales: number }[];

    
    // Detailed Log
    recentSales: { id: string, name: string | null, email: string | null, plan: string, amount: number, date: string }[];
}

async function fetchRevenueForPeriod(queryBuilder: any, startDate: Date, endDate: Date): Promise<number> {
    const { data, error } = await queryBuilder.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
    if (error) {
        console.error(`Error fetching revenue for period ${startDate}-${endDate}:`, error);
        return 0;
    }
    return data.reduce((sum: number, sale: any) => sum + (sale.final_amount_paid || 0), 0);
}


export async function getSalesData(startDate?: Date, endDate?: Date, masterView?: boolean): Promise<SalesData | null> {
    const supabase = createClient();
    
    const baseQuery = () => {
        let query = supabase
            .from('profiles')
            .select('id, full_name, email, final_amount_paid, plan_purchased, created_at, discount_amount')
            .eq('is_approved', true)
            .gt('final_amount_paid', 0); // Only count actual sales

        if (masterView) {
            query = query.eq('is_hidden', true);
        } else {
            query = query.or('is_hidden.is.false,is_hidden.is.null');
        }
        return query;
    };

    // Main data query for the selected period
    let mainQuery = baseQuery();
    const now = new Date();
    const periodStart = startDate ? startOfDay(startDate) : new Date(0);
    const periodEnd = endDate ? endOfDay(endDate) : now;

    mainQuery = mainQuery.gte('created_at', periodStart.toISOString()).lte('created_at', periodEnd.toISOString());

    const { data: sales, error } = await mainQuery.order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching main sales data:", error);
        return null;
    }

    // --- Growth Metrics Calculation ---
    // WoW Growth
    const startOfThisWeek = startOfWeek(periodEnd);
    const endOfThisWeek = periodEnd;
    const startOfLastWeek = startOfWeek(subWeeks(periodEnd, 1));
    const endOfLastWeek = endOfWeek(subWeeks(periodEnd, 1));
    const thisWeekRevenue = await fetchRevenueForPeriod(baseQuery(), startOfThisWeek, endOfThisWeek);
    const lastWeekRevenue = await fetchRevenueForPeriod(baseQuery(), startOfLastWeek, endOfLastWeek);
    let wowRevenueGrowth: number | null = null;
    if (lastWeekRevenue > 0) {
        wowRevenueGrowth = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;
    }

    // MoM Growth
    const startOfThisMonth = startOfMonth(periodEnd);
    const endOfThisMonth = periodEnd;
    const startOfLastMonth = startOfMonth(subMonths(periodEnd, 1));
    const endOfLastMonth = endOfMonth(subMonths(periodEnd, 1));
    const thisMonthRevenue = await fetchRevenueForPeriod(baseQuery(), startOfThisMonth, endOfThisMonth);
    const lastMonthRevenue = await fetchRevenueForPeriod(baseQuery(), startOfLastMonth, endOfLastMonth);
    let momRevenueGrowth: number | null = null;
    if (lastMonthRevenue > 0) {
        momRevenueGrowth = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    }


    const salesByDay: { [key: string]: { revenue: number, sales: number } } = {};
    const planCategoryBreakdown: { [key: string]: number } = { 'Instant': 0, '1-Step': 0, '2-Step': 0 };
    const planBreakdown: { [key: string]: { revenue: number, sales: number } } = {};
    const salesByDayOfWeek: number[] = Array(7).fill(0); // 0=Sun, 1=Mon, ...
    const salesByHour: number[] = Array(24).fill(0);

    const initialData: Omit<SalesData, 'wowRevenueGrowth' | 'momRevenueGrowth' | 'topPlans' | 'recentSales' | 'thisWeekRevenue' | 'thisMonthRevenue' | 'allPlansBreakdown' | 'salesByHour'> = {
        totalNetRevenue: 0,
        totalGrossRevenue: 0,
        totalDiscounts: 0,
        totalSalesCount: sales.length,
        arpu: 0,
        salesByDate: [],
        planCategoryBreakdown: [],
        salesByDayOfWeek: [],
    };
    
    sales.forEach(sale => {
        if (!sale.final_amount_paid || !sale.plan_purchased) return;

        const revenue = sale.final_amount_paid;
        const discount = sale.discount_amount || 0;
        const gross = revenue + discount;

        initialData.totalNetRevenue += revenue;
        initialData.totalDiscounts += discount;
        initialData.totalGrossRevenue += gross;
        
        const saleDate = new Date(sale.created_at);
        const saleDateString = saleDate.toISOString().split('T')[0];
        if (!salesByDay[saleDateString]) {
            salesByDay[saleDateString] = { revenue: 0, sales: 0 };
        }
        salesByDay[saleDateString].revenue += revenue;
        salesByDay[saleDateString].sales += 1;

        salesByDayOfWeek[saleDate.getDay()] += revenue;
        salesByHour[saleDate.getHours()] += revenue;

        const lowerPlanName = sale.plan_purchased.toLowerCase();
        if (lowerPlanName.includes('instant')) planCategoryBreakdown['Instant'] += revenue;
        else if (lowerPlanName.includes('1-step')) planCategoryBreakdown['1-Step'] += revenue;
        else if (lowerPlanName.includes('2-step')) planCategoryBreakdown['2-Step'] += revenue;
        
        if (!planBreakdown[sale.plan_purchased]) {
            planBreakdown[sale.plan_purchased] = { revenue: 0, sales: 0 };
        }
        planBreakdown[sale.plan_purchased].revenue += revenue;
        planBreakdown[sale.plan_purchased].sales += 1;
    });

    if (initialData.totalSalesCount > 0) {
        initialData.arpu = initialData.totalNetRevenue / initialData.totalSalesCount;
    }

    const finalData: SalesData = {
        ...initialData,
        wowRevenueGrowth,
        momRevenueGrowth,
        thisWeekRevenue,
        thisMonthRevenue,
        salesByDate: Object.entries(salesByDay)
            .map(([date, { revenue, sales }]) => ({ date, revenue, sales }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        planCategoryBreakdown: Object.entries(planCategoryBreakdown).map(([name, value]) => ({ name, value })),
        topPlans: Object.entries(planBreakdown)
            .map(([name, { revenue, sales }]) => ({ name, revenue, sales }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5),
        salesByDayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => ({ day, revenue: salesByDayOfWeek[i] })),
        salesByHour: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, revenue: salesByHour[i] })),
        allPlansBreakdown: Object.entries(planBreakdown)
            .map(([name, { revenue, sales }]) => ({ name, revenue, sales }))
            .sort((a, b) => b.revenue - a.revenue),
        recentSales: sales.slice(0, 25).map(s => ({ id: s.id, name: s.full_name, email: s.email, plan: s.plan_purchased, amount: s.final_amount_paid, date: s.created_at })),
    };

    return finalData;
}
