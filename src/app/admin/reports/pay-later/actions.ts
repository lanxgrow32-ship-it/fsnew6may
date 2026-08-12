
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
    topPlans: { name: string, revenue: number, sales: number }[];
    salesByDayOfWeek: { day: string, revenue: number }[];
    salesByHour: { hour: string, revenue: number }[];
    allPlansBreakdown: { name: string, revenue: number, sales: number }[];
    recentSales: { id: string, name: string | null, email: string | null, plan: string, amount: number, date: string }[];
}

/**
 * PTP Specific Intel (v12.0)
 */
export async function getPayLaterSalesData(startDate?: Date, endDate?: Date, masterView?: boolean): Promise<SalesData | null> {
    const supabase = await createClient();
    
    const periodStart = startDate || new Date(0);
    const periodEnd = endDate || new Date();
    
    // Fetch specifically from user_accounts where model is passthrupay
    let query = supabase
        .from('user_accounts')
        .select(`
            id, 
            plan_name, 
            final_amount_paid, 
            created_at, 
            profiles!inner(id, full_name, email, is_hidden)
        `)
        .eq('is_approved', true)
        .gt('final_amount_paid', 0)
        .eq('account_model', 'passthrupay');

    if (masterView) {
        query = query.eq('profiles.is_hidden', true);
    } else {
        query = query.or('is_hidden.is.false,is_hidden.is.null', { referencedTable: 'profiles' });
    }

    const { data: sales, error } = await query
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString())
        .order('created_at', { ascending: false })
        .range(0, 49999);

    if (error || !sales) {
        console.error("[PTP Engine] Error fetching ledger:", error);
        return null;
    }

    let totalNetRevenue = 0;
    const salesByDay: { [key: string]: { revenue: number, sales: number } } = {};
    const planCategoryBreakdown: { [key: string]: number } = { 'PassThenPay': 0 };
    const planBreakdown: { [key: string]: { revenue: number, sales: number } } = {};
    
    sales.forEach(sale => {
        const revenue = parseFloat(sale.final_amount_paid) || 0;
        totalNetRevenue += revenue;
        
        const dateObj = new Date(sale.created_at);
        const saleDateString = format(dateObj, 'yyyy-MM-dd');

        if (!salesByDay[saleDateString]) {
            salesByDay[saleDateString] = { revenue: 0, sales: 0 };
        }
        salesByDay[saleDateString].revenue += revenue;
        salesByDay[saleDateString].sales += 1;

        const plan = sale.plan_name || 'Unknown';
        planCategoryBreakdown['PassThenPay'] += revenue;

        if (!planBreakdown[plan]) {
            planBreakdown[plan] = { revenue: 0, sales: 0 };
        }
        planBreakdown[plan].revenue += revenue;
        planBreakdown[plan].sales += 1;
    });

    return {
        totalNetRevenue,
        totalGrossRevenue: totalNetRevenue,
        totalDiscounts: 0,
        totalSalesCount: sales.length,
        arpu: sales.length > 0 ? totalNetRevenue / sales.length : 0,
        salesByDate: Object.entries(salesByDay)
            .map(([date, { revenue, sales }]) => ({ date, revenue, sales }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        planCategoryBreakdown: Object.entries(planCategoryBreakdown).map(([name, value]) => ({ name, value })),
        topPlans: Object.entries(planBreakdown)
            .map(([name, { revenue, sales }]) => ({ name, revenue, sales }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10),
        salesByDayOfWeek: [],
        salesByHour: [],
        allPlansBreakdown: Object.entries(planBreakdown)
            .map(([name, { revenue, sales }]) => ({ name, revenue, sales }))
            .sort((a, b) => b.revenue - a.revenue),
        recentSales: sales.slice(0, 50).map(s => ({ 
            id: s.id, 
            name: s.profiles?.full_name, 
            email: s.profiles?.email, 
            plan: s.plan_name || 'N/A', 
            amount: parseFloat(s.final_amount_paid), 
            date: s.created_at 
        })),
    };
}
