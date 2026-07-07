
/**
 * @fileOverview Intelligence tools for the AI Support Agent.
 * These tools allow the AI to fetch live data from the database.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const getTraderProfile = ai.defineTool(
  {
    name: 'getTraderProfile',
    description: 'Fetches the current wallet balance, KYC status, and personal details of the trader.',
    inputSchema: z.object({
      email: z.string().describe('The email address of the trader.'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, wallet_balance, kyc_status, is_approved, referral_balance')
      .eq('email', input.email)
      .single();
    
    if (error) return { error: 'Trader not found.' };
    return data;
  }
);

export const getTraderAccounts = ai.defineTool(
  {
    name: 'getTraderAccounts',
    description: 'Fetches all trading accounts (1-Step, 2-Step, PTP) associated with the trader and their current status.',
    inputSchema: z.object({
      email: z.string().describe('The email address of the trader.'),
    }),
    outputSchema: z.array(z.any()),
  },
  async (input) => {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', input.email)
      .single();
    
    if (!profile) return [];

    const { data, error } = await supabaseAdmin
      .from('user_accounts')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    
    return data || [];
  }
);

export const getPlatformRules = ai.defineTool(
  {
    name: 'getPlatformRules',
    description: 'Provides information about drawdown limits, profit targets, and payout rules for different models.',
    inputSchema: z.object({
      query: z.string().describe('The rule to look up (e.g., "drawdown", "payouts", "PTP rules").'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const rules = `
      1. Overall Drawdown: 10% for all standard plans. Trailing balance on Instant accounts.
      2. Daily Drawdown: 5% of opening balance for 1-Step/2-Step, 4% for PTP.
      3. Profit Targets: 1-Step (10%), 2-Step (Phase 1: 8%, Phase 2: 5%), PTP (6%).
      4. Payouts: Minimum ₹2,000. Cycle is every 14 days. 80% Profit Share.
      5. PTP (PassThenPay): Pay 199-499 upfront, achieve 6% target, then pay activation fee.
      6. KYC: Mandatory before first payout for 1-Step/2-Step/Instant. Not strictly required for initial PTP trades but required for payouts.
      7. Leverage: SEBI regulated limits only.
      8. News Trading: Restricted window of ±5 minutes around high-impact events.
    `;
    return rules;
  }
);
