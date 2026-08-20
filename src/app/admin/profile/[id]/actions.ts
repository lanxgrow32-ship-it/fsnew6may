'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { generateStockmintUsername, getBalanceFromPlanName, getAutoClassification } from '@/lib/plan-utils';

async function uploadBreachProof(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `breach-proof-${userId}-${Date.now()}.${fileExt}`;
  const { data, error } = await supabaseAdmin.storage.from('breach-proofs').upload(fileName, file, {
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
  const breach_image = formData.get('breach_image') as File;
  const account_classification = formData.get('account_classification') as string;

  // Fetch current state to check if classification changed
  const { data: before, error: fetchError } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();
  if (fetchError || !before) return { error: 'User profile not found.' };

  const wasClassified = before.account_classification;

  const updateData: any = {
    full_name: fullName,
    is_approved,
    kyc_status,
    is_breached,
    breach_reason,
    account_classification,
  };

  try {
      if (breach_image && breach_image.size > 0) {
        updateData.breach_image_url = await uploadBreachProof(breach_image, id);
      }
  } catch (e: any) { return { error: e.message }; }

  // 1. Update Profile
  const { error } = await supabaseAdmin.from('profiles').update(updateData).eq('id', id);
  if (error) return { error: error.message };

  // 2. SYNC WITH STOCKMINT (v2.6): Promotion / Phase Change
  if (account_classification !== wasClassified) {
      // Update local user_accounts records to match the new global classification for this user
      await supabaseAdmin.from('user_accounts').update({ 
        account_classification: account_classification 
      }).eq('user_id', id);

      const { data: accounts } = await supabaseAdmin
        .from('user_accounts')
        .select('trading_username')
        .eq('user_id', id)
        .eq('credentials_provided', true);

      const apiKey = process.env.STOCKMINT_API_KEY;
      
      if (apiKey && accounts && accounts.length > 0) {
          try {
              // Notify StockMint of the manual phase override via POST /api/users/update
              await Promise.all(accounts.map(async (acc) => {
                  if (acc.trading_username) {
                      await fetch('https://stockmint.io/api/users/update', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                          body: JSON.stringify({ 
                              email: acc.trading_username, 
                              accountClassification: account_classification 
                          }),
                      });
                  }
              }));
          } catch (e) {
              console.error('[Stockmint Promotion Sync] Connection Failure:', e);
          }
      }
  }

  revalidatePath('/admin/dashboard');
  revalidatePath(`/admin/profile/${id}`);
  revalidatePath('/welcome');
  return { error: null };
}

/**
 * Manual Override for Account Blocking (KYC Related)
 * Toggles the is_blocked status and syncs with StockMint Hub
 */
export async function toggleAccountBlock(accountId: string, block: boolean) {
    const { data: account, error: fetchError } = await supabaseAdmin
        .from('user_accounts')
        .select('*, profiles(id)')
        .eq('id', accountId)
        .single();
    
    if (fetchError || !account) return { error: 'Account not found.' };

    const apiKey = process.env.STOCKMINT_API_KEY;
    
    // 1. Update Hub Status if Credentials Exist
    if (apiKey && account.trading_username) {
        try {
            await fetch('https://stockmint.io/api/users/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                body: JSON.stringify({ 
                    email: account.trading_username, 
                    status: block ? 'blocked' : 'active',
                    reason: block ? 'MANUAL_ADMIN_BLOCK' : 'MANUAL_ADMIN_UNBLOCK'
                })
            });
        } catch (e) {
            console.error('[Hub Status Sync] Failure:', e);
            // We continue anyway to update the local DB
        }
    }

    // 2. Update Local Database
    const { error } = await supabaseAdmin
        .from('user_accounts')
        .update({ is_blocked: block })
        .eq('id', accountId);
    
    if (error) return { error: error.message };

    revalidatePath(`/admin/profile/${account.profiles.id}`);
    revalidatePath('/welcome');
    return { success: true };
}

export async function resetPassword(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const password = formData.get('password') as string;
  if (!password || password.length < 6) return { error: 'Min 6 characters required.' };
  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
  if (error) return { error: error.message };
  return { success: true, error: null };
}

export async function sendBreachRecoveryEmail(prevState: any, formData: FormData) {
  const userId = formData.get('userId') as string;
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
  if (!profile) return { error: 'User not found.' };

  const webhookUrl = process.env.MAKE_BREACH_RECOVERY_WEBHOOK_URL;
  if (!webhookUrl) return { error: 'Recovery Webhook not configured.' };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          first_name: profile.full_name, 
          email: profile.email, 
          discount_code: 'RETRY15', 
          discount_percent: 15, 
          expiry_days: 3 
      }),
    });
    return { success: 'Recovery protocol sent successfully.' };
  } catch (e: any) { return { error: e.message }; }
}

/**
 * Manual override to provision Stockmint credentials for a specific account.
 */
export async function syncAccountCredentials(accountId: string) {
    const { data: account, error: fetchError } = await supabaseAdmin
        .from('user_accounts')
        .select('*, profiles(*)')
        .eq('id', accountId)
        .single();
    
    if (fetchError || !account) return { error: 'Account request not found.' };

    const profile = account.profiles;
    const initialBalance = getBalanceFromPlanName(account.plan_name);
    const classification = account.account_classification || getAutoClassification(account.plan_name);
    const isPTP = classification === 'passthenpay';
    const apiKey = process.env.STOCKMINT_API_KEY;

    if (!apiKey) return { error: 'STOCKMINT_API_KEY is missing on server.' };

    // Multi-Account logic: Check how many ALREADY have credentials to get next unique suffix
    const { count } = await supabaseAdmin
        .from('user_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('credentials_provided', true);

    const stockmintUsername = generateStockmintUsername(profile.email, count || 0);

    try {
        const payload = { 
            fullName: profile.full_name, 
            email: stockmintUsername, 
            password: stockmintUsername,
            initialBalance, 
            accountClassification: classification, 
            accountModel: isPTP ? 'passthenpay' : 'normal'
        };

        const res = await fetch('https://stockmint.io/api/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
            body: JSON.stringify(payload),
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
        } else {
            const errorBody = await res.text();
            return { error: `Stockmint Rejected: ${res.status}. ${errorBody}` };
        }
    } catch (e: any) { 
        return { error: `Network error: ${e.message}` }; 
    }
}
