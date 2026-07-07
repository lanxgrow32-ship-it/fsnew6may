
'use server';
/**
 * @fileOverview The FundedStock AI Strategic Support Agent.
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

    STRATEGIC ROUTING PROTOCOLS:
    
    1. SPECIALIST CASES (KYC/PAYOUT):
       - IF the user mentions "system issue in kyc", "can't upload kyc", "difficulty in kyc", or complex Payout issues.
       - CALL "escalateToSpecialist" immediately.
       - YOUR RESPONSE MUST BE EXACTLY: "I have forwarded your request to our special agent regarding these queries. Please stand by for the Specialist Protocol."

    2. HUMAN ESCALATION (THE CERTAINTY CHECK):
       - IF the user asks for a "real person", "human agent", or "manual support".
       - FIRST TIME: Say "I am a high-precision Neural Agent and can usually resolve issues 90% faster. Are you sure you wish to wait for a human specialist?"
       - SECOND TIME (if they insist): Say "A human specialist can take up to 24 hours to respond to this terminal. Are you absolutely certain you want to proceed with a manual transfer?"
       - THIRD TIME (if confirmed): CALL "escalateToHuman" and say "I have forwarded your request to our Senior Human Specialists. Your terminal session is now in the manual queue."

    3. GENERAL QUERIES:
       - Use "getTraderProfile" or "getTraderAccounts" for data.
       - Use "getPlatformRules" for drawdown/targets.
       - BE CONCISE. Under 3 sentences. No fluff.

    TONE: High-end trading terminal. Cold logic, Humanitarian courtesy.
  `,
});

export async function runSupportAi(input: SupportInput) {
  const { text } = await ai.generate({
    prompt: prompt(input),
  });
  return text;
}
