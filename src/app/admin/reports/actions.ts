
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

/**
 * Global Sales Intelligence (v12.0)
 * Aggregates data from user_accounts to support multi-account revenue tracking.
 */
export async function getSalesData(startDate?: Date, endDate?: Date, masterView?: boolean, marketFilter?: string): Promise<SalesData | null> {
    const supabase = await createClient();
    
    const periodStart = startDate || new Date(0);
    const periodEnd = endDate || new Date();
    
    let allSales: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        // PROTOCOL v12.1: Query user_accounts instead of profiles to catch ALL purchases
        let query = supabase
            .from('user_accounts')
            .select(`
                id, 
                plan_name, 
                final_amount_paid, 
                created_at, 
                market_type,
                account_classification,
                profiles!inner(id, full_name, email, is_hidden)
            `)
            .eq('is_approved', true)
            .gt('final_amount_paid', 0);

        // Visibility Filters
        if (masterView) {
            query = query.eq('profiles.is_hidden', true);
        } else {
            query = query.or('is_hidden.is.false,is_hidden.is.null', { referencedTable: 'profiles' });
        }

        // Market Filters
        if (marketFilter === 'indian') {
            query = query.or('market_type.eq.indian,market_type.is.null');
        } else if (marketFilter === 'forex') {
            query = query.eq('market_type', 'forex');
        }

        const { data, error } = await query
            .gte('created_at', periodStart.toISOString())
            .lte('created_at', periodEnd.toISOString())
            .order('created_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("[Sales Engine] Data Fetch Error:", error);
            hasMore = false;
        } else if (data) {
            allSales = [...allSales, ...data];
            if (data.length < pageSize) hasMore = false;
            else page++;
        } else {
            hasMore = false;
        }
    }

    if (allSales.length === 0) return null;

    let totalNetRevenue = 0;
    const salesByDay: { [key: string]: { revenue: number, sales: number } } = {};
    const planCategoryBreakdown: { [key: string]: number } = { 'Instant': 0, '1-Step': 0, '2-Step': 0, 'PTP': 0, 'Pro': 0 };
    const marketBreakdown: { [key: string]: number } = { 'Indian': 0, 'Forex': 0 };
    const planBreakdown: { [key: string]: { revenue: number, sales: number } } = {};
    const salesByDayOfWeek: { [day: number]: number } = {};
    const salesByHour: { [hour: number]: number } = {};
    
    allSales.forEach(sale => {
        const revenue = parseFloat(sale.final_amount_paid) || 0;
        
        totalNetRevenue += revenue;
        
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

        const plan = sale.plan_name || 'Unknown';
        const lowerPlanName = plan.toLowerCase();
        
        // Categorization logic
        if (lowerPlanName.includes('pro')) planCategoryBreakdown['Pro'] += revenue;
        else if (lowerPlanName.includes('instant')) planCategoryBreakdown['Instant'] += revenue;
        else if (lowerPlanName.includes('1-step')) planCategoryBreakdown['1-Step'] += revenue;
        else if (lowerPlanName.includes('2-step')) planCategoryBreakdown['2-Step'] += revenue;
        else if (lowerPlanName.includes('ptp') || lowerPlanName.includes('passthenpay')) planCategoryBreakdown['PTP'] += revenue;
        
        if (!planBreakdown[plan]) {
            planBreakdown[plan] = { revenue: 0, sales: 0 };
        }
        planBreakdown[plan].revenue += revenue;
        planBreakdown[plan].sales += 1;
    });

    return {
        totalNetRevenue,
        totalGrossRevenue: totalNetRevenue, // Simplified as discounts are calculated at source
        totalDiscounts: 0,
        totalSalesCount: allSales.length,
        arpu: allSales.length > 0 ? totalNetRevenue / allSales.length : 0,
        salesByDate: Object.entries(salesByDay)
            .map(([date, { revenue, sales }]) => ({ date, revenue, sales }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        planCategoryBreakdown: Object.entries(planCategoryBreakdown).map(([name, value]) => ({ name, value })),
        marketBreakdown: Object.entries(marketBreakdown).map(([name, value]) => ({ name, value })),
        topPlans: Object.entries(planBreakdown)
            .map(([name, { revenue, sales }]) => ({ name, revenue, sales }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10),
        salesByDayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => ({ day, revenue: salesByDayOfWeek[i] || 0 })),
        salesByHour: Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            revenue: salesByHour[i] || 0,
        })),
        allPlansBreakdown: Object.entries(planBreakdown)
            .map(([name, { revenue, sales }]) => ({ name, revenue, sales }))
            .sort((a, b) => b.revenue - a.revenue),
        recentSales: allSales.slice(0, 50).map(s => ({ 
            id: s.id, 
            name: s.profiles?.full_name, 
            email: s.profiles?.email, 
            plan: s.plan_name || 'N/A', 
            amount: parseFloat(s.final_amount_paid), 
            date: s.created_at,
            market: s.market_type || 'indian'
        })),
    };
}
