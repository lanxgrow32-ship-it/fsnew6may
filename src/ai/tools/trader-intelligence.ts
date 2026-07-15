/**
 * @fileOverview Intelligence tools for the AI Support Agent.
 * These tools allow the AI to fetch live data and perform strategic routing.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const getTraderProfile = ai.defineTool(
  {
    name: 'getTraderProfile',
    description: 'Fetches the current wallet balance, referral code, KYC status, and personal details of the trader.',
    inputSchema: z.object({
      email: z.string().describe('The email address of the trader.'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, wallet_balance, referral_code, kyc_status, is_approved, referral_balance')
      .eq('email', input.email)
      .single();
    
    if (error) return { error: 'Trader not found in the protocol database.' };
    return data;
  }
);

export const getTraderAccounts = ai.defineTool(
  {
    name: 'getTraderAccounts',
    description: 'Fetches all trading accounts (Evaluation, Instant, PTP) associated with the trader and their status.',
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
    description: 'Provides exact specifications for drawdown limits, profit targets, payout cycles, and news trading restrictions.',
    inputSchema: z.object({
      query: z.string().describe('The rule to look up.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    return `
      FUNDEDSTOCK OFFICIAL PROTOCOLS:
      1. Drawdown: Overall 10% (Fixed for Eval/PTP, Trailing for Instant). Daily 5%. Max 2% loss per individual trade.
      2. Profit Targets: 1-Step (10%), 2-Step (8% Phase 1, 5% Phase 2), PassThenPay (6%).
      3. Payouts: Eligible every 14 days. Minimum withdrawal ₹2,000. 80% Profit Split.
      4. News Trading: Restricted ±5 minutes around high-impact economic events (Union Budget, RBI, etc).
      5. Consistency: 20% consistency rule applies to 1-Step and 2-Step evaluations to ensure professional discipline.
      6. KYC: Mandatory identity verification required before first reward disbursement.
      7. Fee Refund: Full evaluation fee is refunded on the 3rd successful payout.
    `;
  }
);

export const escalateToSpecialist = ai.defineTool(
  {
    name: 'escalateToSpecialist',
    description: 'Forwards the conversation to technical specialists when a trader has severe system issues or complex payout blocks.',
    inputSchema: z.object({
      conversationId: z.string(),
      reason: z.enum(['kyc', 'payout', 'technical']),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    await supabaseAdmin
      .from('support_conversations')
      .update({ 
        assigned_role: 'specialist',
        escalation_reason: input.reason,
        status: 'open'
      })
      .eq('id', input.conversationId);
    return { success: true, target: 'Specialist Protocol' };
  }
);

export const escalateToHuman = ai.defineTool(
  {
    name: 'escalateToHuman',
    description: 'Transfers the user to a standard human support agent after the "Certainty Gate" confirms they wish to leave the AI session.',
    inputSchema: z.object({
      conversationId: z.string(),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    await supabaseAdmin
      .from('support_conversations')
      .update({ 
        assigned_role: 'human',
        escalation_reason: 'human_request',
        status: 'open'
      })
      .eq('id', input.conversationId);
    return { success: true, target: 'Senior Human Agent' };
  }
);
