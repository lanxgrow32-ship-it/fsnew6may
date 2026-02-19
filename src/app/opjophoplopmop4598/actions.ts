
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateActiveGateway(gateway: 'primary' | 'secondary') {
    if (gateway !== 'primary' && gateway !== 'secondary') {
        return { error: 'Invalid gateway specified.' };
    }

    const { error } = await supabaseAdmin
        .from('payment_details')
        .update({ active_payment_url: gateway })
        .eq('id', 1);

    if (error) {
        console.error('Error updating active gateway:', error);
        return { error: 'Failed to update the active payment gateway.' };
    }

    revalidatePath('/opjophoplopmop4598');
    // Also revalidate the signup page in case it needs to fetch settings
    revalidatePath('/signup'); 
    
    return { success: `Successfully set ${gateway.charAt(0).toUpperCase() + gateway.slice(1)} gateway as active.` };
}
