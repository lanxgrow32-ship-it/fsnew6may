
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
    const { data: revenueData, error: revenueError } = await queryBuilder()
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .select('final_amount_paid')
        .range(0, 99999); // Fetching all records for accurate revenue

    if (revenueError) {
        console.error(`Error fetching revenue for period ${startDate}-${endDate}:`, revenueError);
        return 0;
    }
    return revenueData.reduce((sum: number, sale: any) => sum + (sale.final_amount_paid || 0), 0);
}


export async function getSalesData(startDate?: Date, endDate?: Date, masterView?: boolean): Promise<SalesData | null> {
    const supabase = createClient();
    
    const periodStart = startDate || new Date(0);
    const periodEnd = endDate || new Date();
    const now = new Date();
    
    const baseQuery = () => {
        let query = supabase
            .from('profiles')
            .select('id, full_name, email, final_amount_paid, plan_purchased, created_at, discount_amount')
            .eq('is_approved', true)
            .gt('final_amount_paid', 0)
            .or('account_model.is.null,account_model.neq.passthrupay');

        if (masterView) {
            query = query.eq('is_hidden', true);
        } else {
            query = query.or('is_hidden.is.false,is_hidden.is.null');
        }
        return query;
    };

    // Main data query for the selected period - Fetching all available records
    const { data: sales, error } = await baseQuery()
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString())
        .order('created_at', { ascending: false })
        .range(0, 99999);

    if (error) {
        console.error("Error fetching main sales data:", error);
        return null;
    }

    // --- Growth Metrics Calculation ---
    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
    const startOfLastWeek = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const endOfLastWeek = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    
    const [thisWeekRevenue, lastWeekRevenue, thisMonthRevenue, lastMonthRevenue] = await Promise.all([
        fetchRevenueForPeriod(baseQuery, startOfThisWeek, now),
        fetchRevenueForPeriod(baseQuery, startOfLastWeek, endOfLastWeek),
        fetchRevenueForPeriod(baseQuery, startOfMonth(now), now),
        fetchRevenueForPeriod(baseQuery, startOfMonth(subMonths(now, 1)), endOfMonth(subMonths(now, 1)))
    ]);

    const wowRevenueGrowth = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : (thisWeekRevenue > 0 ? 100 : null);
    const momRevenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : (thisMonthRevenue > 0 ? 100 : null);

    let totalNetRevenue = 0;
    let totalDiscounts = 0;
    const salesByDay: { [key: string]: { revenue: number, sales: number } } = {};
    const planCategoryBreakdown: { [key: string]: number } = { 'Instant': 0, '1-Step': 0, '2-Step': 0 };
    const planBreakdown: { [key: string]: { revenue: number, sales: number } } = {};
    const salesByDayOfWeek: { [day: number]: number } = {};
    const salesByHour: { [hour: number]: number } = {};
    
    sales.forEach(sale => {
        if (!sale.final_amount_paid || !sale.plan_purchased) return;

        const revenue = sale.final_amount_paid;
        const discount = sale.discount_amount || 0;
        
        totalNetRevenue += revenue;
        totalDiscounts += discount;
        
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(new Date(sale.created_at).getTime() + istOffset);

        const saleDateString = format(istDate, 'yyyy-MM-dd');

        if (!salesByDay[saleDateString]) {
            salesByDay[saleDateString] = { revenue: 0, sales: 0 };
        }
        salesByDay[saleDateString].revenue += revenue;
        salesByDay[saleDateString].sales += 1;

        const hourIndex = istDate.getUTCHours();
        salesByHour[hourIndex] = (salesByHour[hourIndex] || 0) + revenue;
        
        const dayIndex = istDate.getUTCDay();
        salesByDayOfWeek[dayIndex] = (salesByDayOfWeek[dayIndex] || 0) + revenue;
        
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

    const finalData: SalesData = {
        totalNetRevenue,
        totalGrossRevenue: totalNetRevenue + totalDiscounts,
        totalDiscounts,
        totalSalesCount: sales.length,
        arpu: sales.length > 0 ? totalNetRevenue / sales.length : 0,
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
        salesByDayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => ({ day, revenue: salesByDayOfWeek[i] || 0 })),
        salesByHour: Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            revenue: salesByHour[i] || 0,
        })),
        allPlansBreakdown: Object.entries(planBreakdown)
            .map(([name, { revenue, sales }]) => ({ name, revenue, sales }))
            .sort((a, b) => b.revenue - a.revenue),
        recentSales: sales.slice(0, 25).map(s => ({ id: s.id, name: s.full_name, email: s.email, plan: s.plan_purchased || 'N/A', amount: s.final_amount_paid, date: s.created_at })),
    };

    return finalData;
}
