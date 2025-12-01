
'use server';

import { createClient } from '@/lib/supabase/server';

export interface SalesData {
    totalRevenue: number;
    todayRevenue: number;
    instantRevenue: number;
    evaluationRevenue: number;
    instantPlanBreakdown: { [key: string]: number };
    oneStepPlanBreakdown: { [key: string]: number };
    twoStepPlanBreakdown: { [key: string]: number };
}

export async function getSalesData(startDate?: Date, endDate?: Date): Promise<SalesData | null> {
    const supabase = createClient();
    let query = supabase
        .from('profiles')
        .select('final_amount_paid, plan_purchased, created_at')
        .eq('is_approved', true);

    if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
    }

    const { data: sales, error } = await query;
    
    if (error) {
        console.error("Error fetching sales data:", error);
        return null;
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

    const initialData: SalesData = {
        totalRevenue: 0,
        todayRevenue: 0,
        instantRevenue: 0,
        evaluationRevenue: 0,
        instantPlanBreakdown: {},
        oneStepPlanBreakdown: {},
        twoStepPlanBreakdown: {},
    };

    const aggregatedData = sales.reduce((acc, sale) => {
        const revenue = sale.final_amount_paid || 0;
        acc.totalRevenue += revenue;

        if (sale.created_at >= startOfToday) {
            acc.todayRevenue += revenue;
        }

        const planName = sale.plan_purchased;
        if (!planName) return acc;
        
        const lowerPlanName = planName.toLowerCase();

        if (lowerPlanName.includes('instant')) {
            acc.instantRevenue += revenue;
            acc.instantPlanBreakdown[planName] = (acc.instantPlanBreakdown[planName] || 0) + revenue;
        } else if (lowerPlanName.includes('1-step')) {
            acc.evaluationRevenue += revenue;
            acc.oneStepPlanBreakdown[planName] = (acc.oneStepPlanBreakdown[planName] || 0) + revenue;
        } else if (lowerPlanName.includes('2-step')) {
            acc.evaluationRevenue += revenue;
            acc.twoStepPlanBreakdown[planName] = (acc.twoStepPlanBreakdown[planName] || 0) + revenue;
        }

        return acc;
    }, initialData);

    return aggregatedData;
}
