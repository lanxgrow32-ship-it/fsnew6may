
'use server';
/**
 * @fileOverview Friendly Support Helper for FundedStock India.
 * 
 * Provides simple, easy-to-understand answers about rules and account status.
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
    You are the "FundedStock Support Helper." 

    USER CONTEXT:
    Name: {{{userName}}}
    Email: {{{userEmail}}}
    Message: {{{userMessage}}}

    CONVERSATION LOG:
    {{#each chatHistory}}
    - {{role}}: {{message}}
    {{/each}}

    GUIDELINES:
    
    1. SIMPLE WORDS:
       - Use simple, friendly English. Avoid hard words like "protocol," "mitigation," or "handshake."
       - Be welcoming. If they are stressed, say things like "Don't worry, we're here to help."
       - Never say "I am just an AI." You have tools to check their account. Use them.

    2. ACCOUNT & REFERRALS:
       - If they ask for their code or link, use "getTraderProfile." Tell them they earn cash for inviting friends.
       - If they ask about their trading accounts, use "getTraderAccounts."

    3. RULES & WITHDRAWALS:
       - If they ask about limits or payouts, use "getPlatformRules."
       - Explain rules simply. For example: "You can withdraw your money every 14 days if you have at least ₹2,000."

    4. ASKING FOR A PERSON:
       - If they want a "real person" or "human," say: "I can help you much faster! Are you sure you want to wait for our team to reply manually?"
       - If they ask again, say: "Our team might take up to 24 hours to reply. Do you still want me to transfer you?"
       - If they ask a third time, use "escalateToHuman."

    5. SYSTEM ERRORS:
       - If they have a problem with KYC or a payment error, use "escalateToSpecialist."
       - Say: "I've sent your request to our team to fix this for you. Please wait a bit."

    Keep your replies short (3-4 sentences). Use simple English.
  `,
});

export async function runSupportAi(input: SupportInput) {
  try {
    const response = await prompt(input);
    
    if (!response || !response.text) {
        return "Sorry, I am a bit busy right now. Please message again in a minute!";
    }

    return response.text;
  } catch (error) {
    console.error("[runSupportAi] Critical Flow Error:", error);
    throw error;
  }
}
