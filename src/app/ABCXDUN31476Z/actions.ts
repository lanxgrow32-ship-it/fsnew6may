
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Marks a lead as "Done" by setting the is_hidden flag to true.
 * This makes the user vanish from the Lead Terminal and the standard Admin Dashboard.
 */
export async function markLeadAsDone(userId: string) {
    if (!userId) return { error: 'Invalid User ID' };

    try {
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ is_hidden: true })
            .eq('id', userId);

        if (error) throw error;

        revalidatePath('/ABCXDUN31476Z');
        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (e: any) {
        console.error("[Lead Terminal] Action Failure:", e.message);
        return { error: 'Failed to process lead.' };
    }
}
