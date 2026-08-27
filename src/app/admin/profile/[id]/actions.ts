
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const STOCKMINT_BASE_URL = 'https://www.stockmint.io';

/**
 * Common fetch utility for the StockMint Stateless Data Bridge.
 * Enforces the x-api-key security protocol.
 */
async function callStockmint(endpoint: string, method: string, body?: any) {
    const apiKey = process.env.STOCKMINT_API_KEY;
    if (!apiKey) return { error: 'STOCKMINT_API_KEY is missing in server configuration.' };

    try {
        console.log(`[Hub Handshake] Initializing ${method} request to ${endpoint}`);
        
        const response = await fetch(`${STOCKMINT_BASE_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: body ? JSON.stringify(body) : undefined,
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Hub Handshake] Engine Rejected Request: ${response.status} - ${errorText}`);
            return { error: `Engine Error (${response.status}): ${errorText || 'Unknown rejection'}` };
        }

        const json = await response.json();
        console.log(`[Hub Handshake] Success. Received payload for endpoint: ${endpoint}`);
        return json;
    } catch (e: any) {
        console.error(`[Hub Handshake] Critical Connectivity Failure at ${endpoint}:`, e.message);
        return { error: `Connectivity Failure: ${e.message}` };
    }
}

/**
 * Retrieves the absolute state of a trader from the engine.
 */
export async function getMasterSync(email: string) {
    if (!email || email === 'PURGED_ON_HUB') return { error: 'Invalid identifier.' };
    return await callStockmint(`/api/users/master-sync?email=${email}`, 'GET');
}

/**
 * Re-initializes an account (failsafe reset).
 */
export async function resetAccount(email: string, balance: number) {
    return await callStockmint('/api/users/reset', 'POST', {
        email,
        newBalance: balance,
        newHighWaterMark: balance
    });
}

/**
 * Calibrates balance/HWM without deleting trade history.
 */
export async function calibrateAccount(email: string, balance: number, hwm: number) {
    return await callStockmint('/api/users/calibrate', 'POST', {
        email,
        balance,
        hwm
    });
}

/**
 * Shifts user between classification tiers (Eval, Phase 2, Live).
 */
export async function updateClassification(email: string, classification: string) {
    return await callStockmint('/api/users/update', 'POST', {
        email,
        accountClassification: classification
    });
}

/**
 * Deactivates access and flushes market exposure.
 */
export async function updateTerminalStatus(email: string, status: 'active' | 'blocked', reason: string) {
    return await callStockmint('/api/users/update-status', 'POST', {
        email,
        status,
        reason
    });
}

export async function updateProfile(formData: FormData) {
  const id = formData.get('id') as string;
  const fullName = formData.get('full_name') as string;
  const is_approved = formData.get('is_approved') === 'on';
  const kyc_status = formData.get('kyc_status') as string;
  const is_breached = formData.get('is_breached') === 'on';
  const breach_reason = formData.get('breach_reason') as string;
  const account_classification = formData.get('account_classification') as string;

  const updateData: any = {
    full_name: fullName,
    is_approved,
    kyc_status,
    is_breached,
    breach_reason,
    account_classification,
  };

  const { error } = await supabaseAdmin.from('profiles').update(updateData).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/dashboard');
  revalidatePath(`/admin/profile/${id}`);
  return { error: null };
}

export async function resetPassword(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const password = formData.get('password') as string;
  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
  if (error) return { error: error.message };
  return { success: true, error: null };
}
