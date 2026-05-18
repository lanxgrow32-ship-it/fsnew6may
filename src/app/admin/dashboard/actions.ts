'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

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

// Helper function to parse plan name into account balance
function getBalanceFromPlanName(planName: string): number {
    if (!planName) return 0;

    const name = planName.toLowerCase();
    // Match numbers and units like K, L, Cr
    const match = name.match(/([\d,.]+)\s*(k|l|lakh|cr|crore)/);
    
    if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2];

        if (unit === 'k') {
            amount *= 1000;
        } else if (unit === 'l' || unit === 'lakh') {
            amount *= 100000;
        } else if (unit === 'cr' || unit === 'crore') {
            amount *= 10000000;
        }
        return amount;
    }
    
    // Fallback for names like "25000" without a unit
    const plainNumberMatch = name.match(/^[\d,.]+/);
    if (plainNumberMatch) {
        return parseFloat(plainNumberMatch[0].replace(/[,_]/g, ''));
    }

    return 0;
}


export async function createAdmin(prevState: any, formData: FormData) {
  const fullName = formData.get('full_name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!fullName || !email || !password) {
    return { error: 'All fields are required.', success: false };
  }
  
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.', success: false };
  }

  const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Bypass email verification for admins
    user_metadata: {
      full_name: fullName,
      role: 'admin',
    },
  });

  if (error) {
    console.error('Error creating admin user:', error);
    return { error: `Failed to create admin: ${error.message}`, success: false };
  }

  // The database trigger 'handle_new_user' should create the profile automatically.
  // We just need to revalidate the path to show the new user in the table.
  revalidatePath('/admin/dashboard');
  
  return { success: true, error: null };
}

export async function deleteUser(userId: string) {
    if (!userId) {
        return { error: 'User ID is required.' };
    }
    
    // The user's profile in the `profiles` table should be deleted automatically 
    // by the database trigger if a cascading delete is set up on the foreign key.
    // If not, you would need to delete it manually first.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
        console.error('Error deleting user:', error);
        return { error: `Failed to delete user: ${error.message}` };
    }
    
    revalidatePath('/admin/dashboard');
    return { success: true };
}

export async function deleteMultipleUsers(userIds: string[]) {
  if (!userIds || userIds.length === 0) {
    return { error: 'No user IDs provided.' };
  }

  // The admin API's deleteUser method takes a single ID, so we iterate.
  // We run them in parallel for performance.
  const deletePromises = userIds.map(id => supabaseAdmin.auth.admin.deleteUser(id));
  
  const results = await Promise.allSettled(deletePromises);

  const errors = results.filter(r => r.status === 'rejected');

  if (errors.length > 0) {
      console.error(`Error deleting ${errors.length} users:`, errors);
      // Reporting the first error is usually sufficient for the UI.
      const firstError = (errors[0] as PromiseRejectedResult).reason;
      return { error: `Failed to delete ${errors.length} user(s). First error: ${firstError.message}` };
  }

  revalidatePath('/admin/dashboard');
  return { success: true };
}


export async function clearPaymentData(userId: string) {
    if (!userId) {
        return { error: 'User ID is required to clear payment data.' };
    }

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({
            plan_purchased: null,
            transaction_id: null,
            is_approved: false,
            plan_price: 0,
            coupon_code: null,
            discount_amount: 0,
            final_amount_paid: 0,
        })
        .eq('id', userId);

    if (error) {
        console.error('Error clearing payment data:', error);
        return { error: `Failed to clear payment data: ${error.message}` };
    }
    
    // Also clear from user_accounts
    await supabaseAdmin.from('user_accounts').delete().eq('user_id', userId);

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/reports'); // Revalidate reports page as well
    revalidatePath(`/admin/profile/${userId}`);
    return { success: true };
}


export async function approveUserPayment(userId: string) {
    if (!userId) {
        return { error: 'User ID is required.' };
    }

    const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (fetchError || !profile) {
        return { error: 'User profile not found.' };
    }

    if (profile.is_approved) {
        return { success: true, message: 'User is already approved.' };
    }

    const isPassThenPayUser = profile.account_model === 'passthrupay';
    const isKycVerified = profile.kyc_status === 'verified';
    let kycShouldBeVerified = false;

    // --- Update is_approved status ---
    const { error: approvalError } = await supabaseAdmin
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);
    
    if (approvalError) {
        return { error: `Failed to approve payment: ${approvalError.message}` };
    }
    
    // --- Update the account record in user_accounts to unblock the Hub view ---
    const { data: firstAccount } = await supabaseAdmin
        .from('user_accounts')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

    if (firstAccount) {
        await supabaseAdmin.from('user_accounts')
            .update({ 
                is_approved: true,
                status: isKycVerified || isPassThenPayUser ? 'active' : 'pending'
            })
            .eq('id', firstAccount.id);
    }

    // --- Trigger post-approval automations ---

    // 1. Send "Payment Confirmed" email to all users
    const paymentWebhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (paymentWebhookUrl) {
        try {
            const account_size_text = getAccountSizeText(profile.plan_purchased);
            const payload = {
                user_name: profile.full_name,
                email: profile.email,
                order_sn: profile.order_sn || profile.transaction_id || 'N/A',
                plan_purchased: profile.plan_purchased,
                account_size: account_size_text,
                final_amount_paid: profile.final_amount_paid,
                payment_method: 'Online / Manual',
                datetime: format(new Date(profile.created_at), 'dd-MM-yyyy HH:mm:ss'),
            };
            fetch(paymentWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }).catch(e => console.error("Payment webhook failed:", e));
        } catch (webhookError: any) {
            console.error("Failed to construct/send payment webhook:", webhookError.message);
        }
    }

    // 2. Decide if KYC needs attention
    if (isPassThenPayUser) {
        // Auto-verify KYC and trigger account creation immediately
        kycShouldBeVerified = true;
        await supabaseAdmin.from('profiles').update({ kyc_status: 'verified' }).eq('id', userId);
    } else {
        // For NORMAL users, send a KYC reminder.
        const kycWebhookUrl = process.env.MAKE_KYC_WEBHOOK_URL;
        if (kycWebhookUrl) {
            try {
                const kycPayload = { user_name: profile.full_name, email: profile.email };
                fetch(kycWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(kycPayload),
                }).catch(e => console.error("KYC reminder webhook failed:", e));
            } catch (webhookError: any) {
                console.error("Failed to construct/send KYC reminder webhook:", webhookError.message);
            }
        }
    }
    
    // 3. Handle Trading Account Creation if KYC is now considered verified
    if (kycShouldBeVerified) {
        const stockmintApiKey = process.env.STOCKMINT_API_KEY;
        const initialBalance = getBalanceFromPlanName(profile.plan_purchased || '');
        
        if (stockmintApiKey && initialBalance > 0) {
            try {
                const stockmintPayload: any = { 
                    fullName: profile.full_name,
                    email: profile.email,
                    password: profile.email,
                    initialBalance: initialBalance,
                };
                if (isPassThenPayUser) {
                    stockmintPayload.accountModel = 'passthenpay';
                }

                const response = await fetch('https://stockmint.io/api/users/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                    body: JSON.stringify(stockmintPayload),
                });
                if (!response.ok) {
                    console.error(`StockMint creation failed: ${await response.text()}`);
                }
            } catch (apiError) {
                console.error('StockMint API call failed:', apiError);
            }
            
            await supabaseAdmin.from('profiles').update({
                credentials_provided: true,
                trading_username: profile.email,
                trading_password: profile.email
            }).eq('id', userId);

            // Also update the correct account in user_accounts table
            if (firstAccount) {
                await supabaseAdmin.from('user_accounts').update({
                    credentials_provided: true,
                    trading_username: profile.email,
                    trading_password: profile.email,
                    status: 'active'
                }).eq('id', firstAccount.id);
            }
        }

        const kycApprovedWebhookUrl = process.env.MAKE_KYC_APPROVED_WEBHOOK_URL;
        if (kycApprovedWebhookUrl) {
            const account_size_text = getAccountSizeText(profile.plan_purchased || '');
            const kycApprovedPayload = {
                user_name: profile.full_name,
                email: profile.email,
                trading_username: profile.email,
                trading_password: profile.email,
                plan_name: profile.plan_purchased,
                account_size: account_size_text,
                activation_date: format(new Date(), 'dd MMMM yyyy'),
            };
            fetch(kycApprovedWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kycApprovedPayload),
            }).catch(e => console.error("KYC Approved webhook failed:", e));
        }
    }

    // 4. Referral Commission Logic
    if (profile.referred_by && profile.final_amount_paid && profile.final_amount_paid > 0) {
        const { data: settings } = await supabaseAdmin.from('payment_details').select('referral_commission_percentage').eq('id', 1).single();
        if (settings) {
            const commissionAmount = (profile.final_amount_paid * settings.referral_commission_percentage) / 100;
            const { error: rpcError } = await supabaseAdmin.rpc('add_to_balance', { user_id: profile.referred_by, amount_to_add: commissionAmount });
            if (!rpcError) {
                await supabaseAdmin.from('referrals').insert({
                    referrer_id: profile.referred_by,
                    referred_id: userId,
                    commission_amount: commissionAmount,
                    is_commission_paid: true,
                });
            }
        }
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/pay-later');
    revalidatePath(`/admin/profile/${userId}`);
    revalidatePath('/welcome');
    return { success: true };
}
