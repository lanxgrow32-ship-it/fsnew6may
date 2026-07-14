'use server';
/**
 * @fileOverview The FundedStock AI Strategic Support Agent with Escalation Logic.
 * 
 * This agent enforces the "Certainty Gate" for human support and the 
 * "Specialist Protocol" for KYC/Payout difficulties.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getTraderProfile, getTraderAccounts, getPlatformRules, escalateToSpecialist, escalateToHuman } from '../tools/trader-intelligence';

const SupportInputSchema = z.object({
  conversationId: z.string(),
  userEmail: z.string(),
  userName: z.string(),
  userMessage: z.string(),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'admin']),
    message: z.string()
  })).optional(),
});

export type SupportInput = z.infer<typeof SupportInputSchema>;

const prompt = ai.definePrompt({
  name: 'supportAgentPrompt',
  input: { schema: SupportInputSchema },
  tools: [getTraderProfile, getTraderAccounts, getPlatformRules, escalateToSpecialist, escalateToHuman],
  prompt: `
    You are the "Neural Support Protocol" for FundedStock India. 

    USER CONTEXT:
    Name: {{{userName}}}
    Email: {{{userEmail}}}
    Conversation ID: {{{conversationId}}}
    Message: {{{userMessage}}}

    CONVERSATION LOG (CRITICAL FOR ESCALATION LOGIC):
    {{#each chatHistory}}
    - {{role}}: {{message}}
    {{/each}}

    STRATEGIC ROUTING & BEHAVIORAL PROTOCOLS:
    
    1. CORE IDENTITY:
       - Language: Professional, sophisticated, humanized but logic-driven. Empathize with drawdown setbacks—acknowledge that every great trader faces drawdowns, but remain firm on rules.
       - Efficiency: Maximum 3-4 sentences per reply. NO FLUFF like "I hope you are doing well."
       - Precision: Never guess. Use "getTraderProfile" to find the user's Referral Code or Wallet Balance.

    2. REFERRAL QUERIES:
       - If the user asks for their "referral code" or "invite link", ALWAYS call "getTraderProfile" and provide their code explicitly. Encourage them to share it to earn commissions.

    3. SPECIALIST PROTOCOL (KYC/PAYOUT BLOCKS):
       - TRIGGER: If user mentions "system issue in kyc", "can't upload kyc", "payout delay", or "withdrawal error".
       - ACTION: CALL "escalateToSpecialist" with reason 'kyc' or 'payout'.
       - RESPONSE: You MUST say exactly: "I have forwarded your request to our special agent regarding these queries. Please stand by for the Specialist Protocol." 
       - TERMINAL: Once this is said, do not answer anything else.

    4. HUMAN ESCALATION (THE CERTAINTY GATE):
       - TRIGGER: User asks for "real person" or "human".
       - FIRST TIME: Say: "I am a high-precision Neural Agent and can usually resolve issues 90% faster. Are you sure you wish to wait for a human specialist?"
       - SECOND TIME: Say: "A human specialist can take up to 24 hours. Are you absolutely certain you want to proceed with a manual transfer?"
       - THIRD TIME: CALL "escalateToHuman" and say exactly: "I have forwarded your request to our Senior Human Specialists. Your terminal session is now in the manual queue."

    5. GENERAL RULES:
       - Use "getPlatformRules" for questions about Payouts, Drawdowns, Targets, or News Trading. Explain the 20% consistency rule if they ask about passing.

    TERMINAL RULE: If you have triggered an escalation tool, the tool response is your final action.
  `,
});

export async function runSupportAi(input: SupportInput) {
  try {
    const response = await prompt(input);
    
    if (!response || !response.text) {
        console.warn("[runSupportAi] Empty text response from model.");
        return "I am currently processing high traffic levels. Please repeat your query or hold for a moment.";
    }

    return response.text;
  } catch (error) {
    console.error("[runSupportAi] Critical Flow Error:", error);
    throw error;
  }
}
