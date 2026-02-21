
'use server';

import { createClient } from '@/lib/supabase/server';
import { startOfDay, endOfDay } from 'date-fns';

export interface SalesData {
    totalRevenue: number;
    todayRevenue: number;
    instantRevenue: number;
    oneStepRevenue: number;
    twoStepRevenue: number;
    instantPlanBreakdown: { [key: string]: number };
    oneStepPlanBreakdown: { [key: string]: number };
    twoStepPlanBreakdown: { [key: string]: number };
    salesByDate: { date: string, revenue: number }[];
    totalSalesCount: number;
}

export async function getSalesData(startDate?: Date, endDate?: Date, masterView?: boolean): Promise<SalesData | null> {
    const supabase = createClient();
    let query = supabase
        .from('profiles')
        .select('final_amount_paid, plan_purchased, created_at')
        .eq('is_approved', true);

    if (masterView) {
        query = query.eq('is_hidden', true);
    } else {
        query = query.or('is_hidden.is.false,is_hidden.is.null');
    }

    if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
        const inclusiveEndDate = new Date(endDate);
        inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
        query = query.lt('created_at', inclusiveEndDate.toISOString());
    }

    const { data: sales, error } = await query;
    
    if (error) {
        console.error("Error fetching sales data:", error);
        return null;
    }

    const today = new Date();
    const startOfTodayString = startOfDay(today).toISOString();
    const endOfTodayString = endOfDay(today).toISOString();

    const initialData: SalesData = {
        totalRevenue: 0,
        todayRevenue: 0,
        instantRevenue: 0,
        oneStepRevenue: 0,
        twoStepRevenue: 0,
        instantPlanBreakdown: {},
        oneStepPlanBreakdown: {},
        twoStepPlanBreakdown: {},
        salesByDate: [],
        totalSalesCount: 0,
    };

    if (!sales) {
        return initialData;
    }
    
    const salesByDay: { [key: string]: number } = {};

    const aggregatedData = sales.reduce((acc, sale) => {
        if (!sale.final_amount_paid || !sale.plan_purchased) {
            return acc;
        }

        const revenue = sale.final_amount_paid;
        acc.totalRevenue += revenue;

        // Check for today's revenue
        if (sale.created_at >= startOfTodayString && sale.created_at <= endOfTodayString) {
            acc.todayRevenue += revenue;
        }
        
        // Aggregate sales by date for the line chart
        const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
        salesByDay[saleDate] = (salesByDay[saleDate] || 0) + revenue;

        const planName = sale.plan_purchased;
        const lowerPlanName = planName.toLowerCase();

        if (lowerPlanName.includes('instant')) {
            acc.instantRevenue += revenue;
            acc.instantPlanBreakdown[planName] = (acc.instantPlanBreakdown[planName] || 0) + revenue;
        } else if (lowerPlanName.includes('1-step')) {
            acc.oneStepRevenue += revenue;
            acc.oneStepPlanBreakdown[planName] = (acc.oneStepPlanBreakdown[planName] || 0) + revenue;
        } else if (lowerPlanName.includes('2-step')) {
            acc.twoStepRevenue += revenue;
            acc.twoStepPlanBreakdown[planName] = (acc.twoStepPlanBreakdown[planName] || 0) + revenue;
        }

        return acc;
    }, initialData);

    aggregatedData.salesByDate = Object.entries(salesByDay)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    aggregatedData.totalSalesCount = sales.length;

    return aggregatedData;
}
