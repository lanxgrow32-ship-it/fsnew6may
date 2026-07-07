
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
    description: 'Fetches all trading accounts associated with the trader and their current status.',
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
    description: 'Provides information about drawdown limits, profit targets, and payout rules.',
    inputSchema: z.object({
      query: z.string().describe('The rule to look up.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    return `
      1. Overall Drawdown: 10% (Fixed for Eval, Trailing for Instant).
      2. Daily Drawdown: 5% (4% for PTP).
      3. Targets: 1-Step (10%), 2-Step (8%/5%), PTP (6%).
      4. Payouts: Every 14 days, Min ₹2,000.
      5. KYC: Mandatory before first payout.
    `;
  }
);

export const escalateToSpecialist = ai.defineTool(
  {
    name: 'escalateToSpecialist',
    description: 'Forwards the conversation to a specialized KYC/Payout agent when a trader has technical issues or complex requests regarding these topics.',
    inputSchema: z.object({
      conversationId: z.string(),
      reason: z.enum(['kyc', 'payout']),
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
    description: 'Transfers the user to a standard human support agent after they have confirmed multiple times that they want to leave the AI session.',
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
