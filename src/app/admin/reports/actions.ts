
'use server';

import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';

export interface SalesData {
    totalNetRevenue: number;
    totalGrossRevenue: number;
    totalDiscounts: number;
    totalSalesCount: number;
    arpu: number;
    salesByDate: { date: string, revenue: number, sales: number }[];
    planCategoryBreakdown: { name: string, value: number }[];
    marketBreakdown: { name: string, value: number }[];
    topPlans: { name: string, revenue: number, sales: number }[];
    salesByDayOfWeek: { day: string, revenue: number }[];
    salesByHour: { hour: string, revenue: number }[];
    allPlansBreakdown: { name: string, revenue: number, sales: number }[];
    recentSales: { id: string, name: string | null, email: string | null, plan: string, amount: number, date: string, market: string }[];
}

export async function getSalesData(startDate?: Date, endDate?: Date, masterView?: boolean, marketFilter?: string): Promise<SalesData | null> {
    const supabase = await createClient();
    
    const periodStart = startDate || new Date(0);
    const periodEnd = endDate || new Date();
    
    let query = supabase
        .from('profiles')
        .select('id, full_name, email, final_amount_paid, plan_purchased, created_at, discount_amount, market_type')
        .eq('is_approved', true)
        .gt('final_amount_paid', 0)
        .or('account_model.is.null,account_model.neq.passthrupay');

    if (masterView) {
        query = query.eq('is_hidden', true);
    } else {
        query = query.or('is_hidden.is.false,is_hidden.is.null');
    }

    if (marketFilter && marketFilter !== 'all') {
        query = query.eq('market_type', marketFilter);
    }

    const { data: sales, error } = await query
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString())
        .order('created_at', { ascending: false })
        .range(0, 49999);

    if (error || !sales) {
        console.error("Error fetching sales data:", error);
        return null;
    }

    let totalNetRevenue = 0;
    let totalDiscounts = 0;
    const salesByDay: { [key: string]: { revenue: number, sales: number } } = {};
    const planCategoryBreakdown: { [key: string]: number } = { 'Instant': 0, '1-Step': 0, '2-Step': 0 };
    const marketBreakdown: { [key: string]: number } = { 'Indian': 0, 'Forex': 0 };
    const planBreakdown: { [key: string]: { revenue: number, sales: number } } = {};
    const salesByDayOfWeek: { [day: number]: number } = {};
    const salesByHour: { [hour: number]: number } = {};
    
    sales.forEach(sale => {
        const revenue = sale.final_amount_paid || 0;
        const discount = sale.discount_amount || 0;
        
        totalNetRevenue += revenue;
        totalDiscounts += discount;
        
        const dateObj = new Date(sale.created_at);
        const saleDateString = format(dateObj, 'yyyy-MM-dd');

        if (!salesByDay[saleDateString]) {
            salesByDay[saleDateString] = { revenue: 0, sales: 0 };
        }
        salesByDay[saleDateString].revenue += revenue;
        salesByDay[saleDateString].sales += 1;

        const hourIndex = dateObj.getHours();
        salesByHour[hourIndex] = (salesByHour[hourIndex] || 0) + revenue;
        
        const dayIndex = dateObj.getDay();
        salesByDayOfWeek[dayIndex] = (salesByDayOfWeek[dayIndex] || 0) + revenue;
        
        const market = sale.market_type === 'forex' ? 'Forex' : 'Indian';
        marketBreakdown[market] = (marketBreakdown[market] || 0) + revenue;

        const plan = sale.plan_purchased || 'Unknown';
        const lowerPlanName = plan.toLowerCase();
        if (lowerPlanName.includes('instant')) planCategoryBreakdown['Instant'] += revenue;
        else if (lowerPlanName.includes('1-step')) planCategoryBreakdown['1-Step'] += revenue;
        else if (lowerPlanName.includes('2-step')) planCategoryBreakdown['2-Step'] += revenue;
        
        if (!planBreakdown[plan]) {
            planBreakdown[plan] = { revenue: 0, sales: 0 };
        }
        planBreakdown[plan].revenue += revenue;
        planBreakdown[plan].sales += 1;
    });

    return {
        totalNetRevenue,
        totalGrossRevenue: totalNetRevenue + totalDiscounts,
        totalDiscounts,
        totalSalesCount: sales.length,
        arpu: sales.length > 0 ? totalNetRevenue / sales.length : 0,
        salesByDate: Object.entries(salesByDay)
            .map(([date, { revenue, sales }]) => ({ date, revenue, sales }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        planCategoryBreakdown: Object.entries(planCategoryBreakdown).map(([name, value]) => ({ name, value })),
        marketBreakdown: Object.entries(marketBreakdown).map(([name, value]) => ({ name, value })),
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
        recentSales: sales.slice(0, 25).map(s => ({ 
            id: s.id, 
            name: s.full_name, 
            email: s.email, 
            plan: s.plan_purchased || 'N/A', 
            amount: s.final_amount_paid, 
            date: s.created_at,
            market: s.market_type || 'indian'
        })),
    };
}
