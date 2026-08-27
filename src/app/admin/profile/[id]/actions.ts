
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateStockmintUsername, getBalanceFromPlanName, getAutoClassification } from '@/lib/plan-utils';
import jwt from 'jsonwebtoken';

async function uploadBreachProof(file: File, userId: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileExt = file.name.split('.').pop();
  const fileName = `breach-proof-${userId}-${Date.now()}.${fileExt}`;
  const { data, error } = await supabaseAdmin.storage.from('breach-proofs').upload(fileName, buffer, {
      cacheControl: '3600',
      upsert: false,
  });

  if (error) {
    console.error('Error uploading breach proof:', error);
    throw new Error('Failed to upload breach proof image.');
  }

  const { data: urlData } = supabaseAdmin.storage.from('breach-proofs').getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function updateProfile(formData: FormData) {
  const id = formData.get('id') as string;
  const fullName = formData.get('full_name') as string;
  const is_approved = formData.get('is_approved') === 'on';
  const kyc_status = formData.get('kyc_status') as string;
  const is_breached = formData.get('is_breached') === 'on';
  const breach_reason = formData.get('breach_reason') as string;
  const account_classification = formData.get('account_classification') as string;

  const { data: before } = await supabaseAdmin.from('profiles').select('account_classification').eq('id', id).single();
  const wasClassified = before?.account_classification;

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

  // SYNC WITH HUB: Promotion/Phase Change
  if (account_classification !== wasClassified) {
      await supabaseAdmin.from('user_accounts').update({ account_classification }).eq('user_id', id);
      const { data: accounts } = await supabaseAdmin.from('user_accounts').select('trading_username').eq('user_id', id).eq('credentials_provided', true);
      const apiKey = process.env.STOCKMINT_API_KEY;
      
      if (apiKey && accounts) {
          await Promise.all(accounts.map(acc => {
              if (acc.trading_username) {
                  return fetch('https://stockmint.io/api/users/update', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                      body: JSON.stringify({ email: acc.trading_username, accountClassification: account_classification }),
                  });
              }
          })).catch(console.error);
      }
  }

  revalidatePath('/admin/dashboard');
  revalidatePath(`/admin/profile/${id}`);
  revalidatePath('/welcome');
  return { error: null };
}

/**
 * MASTER COMMAND: Purge Account from StockMint Hub
 */
export async function purgeHubAccount(accountId: string) {
    const { data: account, error: fetchError } = await supabaseAdmin
        .from('user_accounts')
        .select('*, profiles(id)')
        .eq('id', accountId)
        .single();
    
    if (fetchError || !account) return { error: 'Account not found.' };
    if (!account.trading_username) return { error: 'No Hub username found for this account.' };

    const apiKey = process.env.STOCKMINT_API_KEY;
    if (!apiKey) return { error: 'STOCKMINT_API_KEY missing.' };

    try {
        const res = await fetch('https://stockmint.io/api/users/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
            body: JSON.stringify({ email: account.trading_username }),
        });

        if (res.ok) {
            await supabaseAdmin.from('user_accounts').update({ 
                status: 'deleted',
                trading_username: 'PURGED_ON_HUB',
                trading_password: 'PURGED'
            }).eq('id', accountId);
            
            revalidatePath(`/admin/profile/${account.profiles.id}`);
            return { success: true };
        } else {
            const err = await res.text();
            return { error: `Hub Rejection: ${err}` };
        }
    } catch (e: any) {
        return { error: `Network Failure: ${e.message}` };
    }
}

export async function toggleAccountBlock(accountId: string, block: boolean) {
    const { data: account } = await supabaseAdmin.from('user_accounts').select('*, profiles(id)').eq('id', accountId).single();
    if (!account) return { error: 'Account not found.' };

    const apiKey = process.env.STOCKMINT_API_KEY;
    if (apiKey && account.trading_username) {
        await fetch('https://stockmint.io/api/users/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
            body: JSON.stringify({ email: account.trading_username, status: block ? 'blocked' : 'active' })
        }).catch(console.error);
    }

    const { error = null } = await supabaseAdmin.from('user_accounts').update({ is_blocked: block }).eq('id', accountId);
    if (error) return { error: error.message };

    revalidatePath(`/admin/profile/${account.profiles.id}`);
    revalidatePath('/welcome');
    return { success: true };
}

export async function resetPassword(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const password = formData.get('password') as string;
  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
  if (error) return { error: error.message };
  return { success: true, error: null };
}

export async function syncAccountCredentials(accountId: string) {
    const { data: account } = await supabaseAdmin.from('user_accounts').select('*, profiles(*)').eq('id', accountId).single();
    if (!account) return { error: 'Not found.' };

    const profile = account.profiles;
    const initialBalance = getBalanceFromPlanName(account.plan_name);
    const classification = account.account_classification || getAutoClassification(account.plan_name);
    const apiKey = process.env.STOCKMINT_API_KEY;

    if (!apiKey) return { error: 'API Key missing.' };

    const { count } = await supabaseAdmin.from('user_accounts').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).eq('credentials_provided', true);
    const stockmintUsername = generateStockmintUsername(profile.email, count || 0);

    try {
        const res = await fetch('https://stockmint.io/api/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
            body: JSON.stringify({ 
                fullName: profile.full_name, 
                email: stockmintUsername, 
                password: stockmintUsername,
                initialBalance, 
                accountClassification: classification, 
                accountModel: classification === 'passthenpay' ? 'passthenpay' : 'normal'
            }),
        });

        if (res.ok) {
            await supabaseAdmin.from('user_accounts').update({
                credentials_provided: true, 
                trading_username: stockmintUsername, 
                trading_password: stockmintUsername, 
                status: 'active'
            }).eq('id', accountId);
            revalidatePath(`/admin/profile/${profile.id}`);
            return { success: true };
        }
        return { error: 'Hub API Rejection' };
    } catch (e: any) { return { error: e.message }; }
}

/**
 * Generates a secure SSO teleport URL for the StockMint Admin Bridge.
 * Payloads matches StockMint developer specification precisely.
 */
export async function getHubSsoUrl(tradingUsername: string) {
    const secret = process.env.FS_ADMIN_BRIDGE_SECRET;
    if (!secret) {
        return { error: 'Admin Bridge Security Secret is not configured in .env' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized: Admin session required.' };
    }

    try {
        // Updated payload according to StockMint developer spec
        // iat is automatically added by jwt.sign()
        const token = jwt.sign(
            { 
                admin_email: user.email,
                target_trading_username: tradingUsername 
            },
            secret,
            { expiresIn: '60s' }
        );
        
        // Redirection Protocol: Points exactly to the path provided by the Hub developer.
        const ssoUrl = `https://www.stockmint.io/admin/sso-bypass?token=${token}`;
        
        return { url: ssoUrl };
    } catch (e: any) {
        console.error("[SSO Bridge] Signing Failure:", e);
        return { error: 'Failed to generate secure access token.' };
    }
}
