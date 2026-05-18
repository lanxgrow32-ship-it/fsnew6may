'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';

// Helper function to get account size text from plan name
function getAccountSizeText(planName: string): string {
    if (!planName) return 'N/A';
    const lowerPlanName = planName.toLowerCase();

    if (lowerPlanName.includes('1l') || lowerPlanName.includes('1,00,000')) return '1,00,000';
    if (lowerPlanName.includes('2l') || lowerPlanName.includes('2,00,000')) return '2,00,000';
    if (lowerPlanName.includes('5l') || lowerPlanName.includes('5,00,000')) return '5,00,000';
    if (lowerPlanName.includes('10l') || lowerPlanName.includes('10,00,000')) return '10,00,000';
    if (lowerPlanName.includes('25l') || lowerPlanName.includes('25,00,000')) return '25,00,000';
    if (lowerPlanName.includes('50l') || lowerPlanName.includes('50,00_000')) return '50,00,000';
    
    const plainNumberMatch = lowerPlanName.match(/^[\d,._]+/);
    if (plainNumberMatch) {
        return parseFloat(plainNumberMatch[0].replace(/[,_]/g, '')).toLocaleString('en-IN', {useGrouping: false});
    }

    return 'N/A';
}

// Helper to determine initial balance
function getBalanceFromPlanName(planName: string): number {
    if (!planName) return 0;
    const name = planName.toLowerCase();
    const match = name.match(/([\d,.]+)\s*(k|l|lakh|cr|crore)/);
    if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2];
        if (unit === 'k') amount *= 1000;
        else if (unit === 'l' || unit === 'lakh') amount *= 100000;
        else if (unit === 'cr' || unit === 'crore') amount *= 10000000;
        return amount;
    }
    const plainNumberMatch = name.match(/^[\d,.]+/);
    if (plainNumberMatch) return parseFloat(plainNumberMatch[0].replace(/[,_]/g, ''));
    return 0;
}

export async function purchaseNewAccount(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not authenticated' };

    const planName = formData.get('plan_name') as string;
    const utr = formData.get('utr') as string;
    const finalPrice = parseFloat(formData.get('final_price') as string);

    if (!planName || !utr || isNaN(finalPrice)) {
        return { error: 'All fields are required.' };
    }

    const { error } = await supabase
        .from('user_accounts')
        .insert({
            user_id: user.id,
            plan_name: planName,
            transaction_id: utr,
            final_amount_paid: finalPrice,
            status: 'pending',
            is_approved: false,
            account_model: planName.toLowerCase().includes('passthenpay') ? 'passthrupay' : 'normal',
        });

    if (error) return { error: error.message };

    revalidatePath('/welcome');
    return { success: true };
}

// Competition Credentials Logic preserved and adjusted for versioned accounts
async function createStockMintAccount(fullName: string, email: string, initialBalance: number, isPTP: boolean = false) {
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;
    if (!stockmintApiKey || initialBalance <= 0) {
        return { success: false, error: 'API Error' };
    }

    try {
        const payload: any = { fullName, email, password: email, initialBalance };
        if (isPTP) payload.accountModel = 'passthenpay';

        const response = await fetch('https://stockmint.io/api/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
            body: JSON.stringify(payload),
        });
        return { success: response.ok };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function generateCompetitionCredentials() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: session } = await supabaseAdmin
        .from('payment_sessions')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    if (!session) return { error: 'No completed payment' };

    const periodIdentifier = session.plan_type === 'monthly' ? format(new Date(), 'yyyy-MM') : format(new Date(), 'yyyy-II');

    const { data: existing } = await supabaseAdmin.from('competition_entries').select('id').eq('user_id', user.id).eq('week_identifier', periodIdentifier).limit(1).single();
    if (existing) return { success: true };

    const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', user.id).single();
    const { count } = await supabaseAdmin.from('competition_entries').select('id', { count: 'exact' }).eq('user_id', user.id);
    
    const version = (count || 0) + 1;
    const stockmintUsername = `${user.email.split('@')[0]}-p${version}@${user.email.split('@')[1]}`;
    const initialBalance = session.plan_type === 'weekly' ? 100000 : 500000;

    const res = await createStockMintAccount(profile!.full_name!, stockmintUsername, initialBalance);
    if (!res.success) return { error: 'StockMint Error' };

    await supabaseAdmin.from('competition_entries').insert({ user_id: user.id, week_identifier: periodIdentifier, stockmint_username: stockmintUsername, stockmint_password: stockmintUsername, account_balance: initialBalance });

    revalidatePath('/welcome');
    return { success: true };
}

export async function submitUtr(prevState: any, formData: FormData) {
  // Legacy UTR submission for the main profile (kept for fallback)
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not logged in' };
  const utr = formData.get('utr') as string;
  if (!utr || utr.length < 12) return { error: 'Invalid UTR' };

  await supabase.from('profiles').update({ transaction_id: utr }).eq('id', user.id);
  revalidatePath('/welcome');
  return { success: true };
}
