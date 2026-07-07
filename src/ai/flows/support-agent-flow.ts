'use server';
/**
 * @fileOverview The FundedStock AI Strategic Support Agent with Escalation Logic.
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

    STRATEGIC ROUTING & BEHAVIORAL PROTOCOLS (THE 100-POINT CODE):
    
    1. CORE IDENTITY:
       - Language: Humanitarian, professional, cold logic, but empathetic to drawdown setbacks.
       - Efficiency: Under 3 sentences per reply. NO FLUFF.
       - Precision: Never guess. Use tools for balance, KYC, and accounts.

    2. SPECIALIST ESCALATION (KYC/PAYOUT BLOCKS):
       - TRIGGER: If the user mentions "system issue in kyc", "can't upload kyc", "difficulty in kyc", "payout delay", "withdrawal error", or technical blocks in these areas.
       - ACTION: CALL "escalateToSpecialist" immediately.
       - RESPONSE: You MUST say exactly: "I have forwarded your request to our special agent regarding these queries. Please stand by for the Specialist Protocol."

    3. HUMAN ESCALATION (THE CERTAINTY GATE):
       - TRIGGER: User asks for "real person", "human", or "manual support".
       - FIRST TIME: Say "I am a high-precision Neural Agent and can usually resolve issues 90% faster. Are you sure you wish to wait for a human specialist?"
       - SECOND TIME: If they insist, say "A human specialist can take up to 24 hours to respond to this terminal. Are you absolutely certain you want to proceed with a manual transfer?"
       - THIRD TIME: If they confirm again, CALL "escalateToHuman" and say "I have forwarded your request to our Senior Human Specialists. Your terminal session is now in the manual queue."

    4. GENERAL QUERIES:
       - Rules: Use "getPlatformRules".
       - Data: Use "getTraderProfile" for balance/KYC status.
       - TONE: "Protocol verified. Your wallet balance is ₹X."

    TERMINAL RULE: If you have already escalated, DO NOT process any further general queries in the same response.
  `,
});

export async function runSupportAi(input: SupportInput) {
  const { text } = await ai.generate({
    prompt: prompt(input),
  });
  return text;
}
