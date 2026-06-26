
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

async function uploadKycImage(file: File, userId: string, type: string) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${userId}-${type}-${Date.now()}.jpeg`;
    
    const { data, error } = await supabaseAdmin.storage.from('kyc-documents').upload(fileName, buffer, {
        contentType: file.type,
    });

    if (error) throw new Error(`Failed to upload ${type} image.`);
    const { data: urlData } = supabaseAdmin.storage.from('kyc-documents').getPublicUrl(data.path);
    return urlData.publicUrl;
}

/**
 * Manual KYC Override for Agents
 */
export async function manualVerifyKyc(formData: FormData) {
  const userId = formData.get('id') as string;
  const aadhaarFile = formData.get('aadhaar_photo') as File;
  const selfieFile = formData.get('selfie_photo') as File;

  if (!userId || !aadhaarFile || !selfieFile) {
    return { error: 'Incomplete documents provided.' };
  }

  try {
    // 1. Upload both documents
    const aadhaarUrl = await uploadKycImage(aadhaarFile, userId, 'aadhaar_manual');
    const selfieUrl = await uploadKycImage(selfieFile, userId, 'selfie_manual');

    // 2. Update Profile to Verified
    const { data: profile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
            kyc_status: 'verified',
            selfie_url: aadhaarUrl,
            selfie_with_aadhaar_url: selfieUrl,
            drawdown_rules_accepted: true,
            risk_rules_understood: true,
            terms_accepted: true
        })
        .eq('id', userId)
        .select()
        .single();
    
    if (updateError || !profile) throw new Error("Database update failed.");

    // 3. Trigger Automation (StockMint Creation)
    const stockmintApiKey = process.env.STOCKMINT_API_KEY;
    const { data: account } = await supabaseAdmin.from('user_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

    if (stockmintApiKey && account) {
        try {
            // Virtual Email Logic
            const [base, domain] = profile.email.split('@');
            const stockmintUsername = `${base}@${domain}`;

            const res = await fetch('https://stockmint.io/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': stockmintApiKey },
                body: JSON.stringify({ 
                    fullName: profile.full_name,
                    email: stockmintUsername,
                    password: stockmintUsername,
                    initialBalance: 100000, // Default or parsed from plan
                    accountClassification: account.account_classification,
                    accountModel: account.account_model === 'passthrupay' ? 'passthenpay' : 'normal'
                }),
            });

            if (res.ok) {
                await supabaseAdmin.from('user_accounts').update({
                    credentials_provided: true,
                    trading_username: stockmintUsername,
                    trading_password: stockmintUsername,
                    status: 'active'
                }).eq('id', account.id);

                await supabaseAdmin.from('profiles').update({
                    credentials_provided: true,
                    trading_username: stockmintUsername,
                    trading_password: stockmintUsername
                }).eq('id', userId);
            }
        } catch (e) { console.error('Agent Manual Sync Error:', e); }
    }

    revalidatePath('/support-agent/chat');
    revalidatePath('/welcome');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
