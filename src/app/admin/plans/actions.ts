
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * CRUD Actions for the Trading Plans Protocol.
 * Syncs the public pricing and internal arena.
 */

export async function upsertPlan(formData: FormData) {
    const id = formData.get('id') as string | null;
    const title = formData.get('title') as string;
    const size = formData.get('size') as string;
    const price = parseFloat(formData.get('price') as string || '0');
    const usdPrice = formData.get('usd_price') ? parseFloat(formData.get('usd_price') as string) : null;
    const category = formData.get('category') as string;
    const marketType = formData.get('market_type') as 'indian' | 'forex';
    const isPopular = formData.get('is_popular') === 'on';
    const isActive = formData.get('is_active') === 'on';
    const sortOrder = parseInt(formData.get('sort_order') as string || '0');

    if (!title || !size || !category) {
        return { error: 'Required fields: Title, Size, and Category.' };
    }

    const planData = {
        title,
        size,
        price,
        usd_price: usdPrice,
        category,
        market_type: marketType,
        is_popular: isPopular,
        is_active: isActive,
        sort_order: sortOrder
    };

    try {
        if (id) {
            const { error } = await supabaseAdmin.from('plans').update(planData).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabaseAdmin.from('plans').insert(planData);
            if (error) throw error;
        }

        revalidatePath('/pricing');
        revalidatePath('/forex-pricing');
        revalidatePath('/admin/plans');
        revalidatePath('/welcome');
        return { success: true };
    } catch (e: any) {
        console.error("[Plans Protocol] Error:", e);
        return { error: e.message };
    }
}

export async function deletePlan(id: string) {
    const { error } = await supabaseAdmin.from('plans').delete().eq('id', id);
    if (error) return { error: error.message };
    
    revalidatePath('/pricing');
    revalidatePath('/admin/plans');
    revalidatePath('/welcome');
    return { success: true };
}

export async function getAllPlans() {
    // Multi-page sweep not needed for plans usually, but keeping it broad
    const { data, error } = await supabaseAdmin
        .from('plans')
        .select('*')
        .order('sort_order', { ascending: true });
    
    if (error) return [];
    return data || [];
}
