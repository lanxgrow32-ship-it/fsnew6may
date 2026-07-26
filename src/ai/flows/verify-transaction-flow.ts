'use server';
/**
 * @fileOverview Blockchain verification engine for USDT (TRC-20) payments.
 * 
 * Performs critical security checks to ensure non-custodial payment integrity.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const USDT_CONTRACT_TRC20 = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

const VerifyTransactionInputSchema = z.object({
  txId: z.string().describe('The TRON transaction hash (TxID) provided by the user.'),
  claimedAmount: z.number().describe('The amount of USDT the user claims to have sent.'),
  companyWallet: z.string().describe('The target company wallet address to verify the recipient against.'),
});

export type VerifyTransactionInput = z.infer<typeof VerifyTransactionInputSchema>;

const VerifyTransactionOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  actualAmount: z.number().optional(),
  timestamp: z.string().optional(),
});

export type VerifyTransactionOutput = z.infer<typeof VerifyTransactionOutputSchema>;

/**
 * Server-side Genkit flow for real-time blockchain auditing.
 */
export const verifyTransactionFlow = ai.defineFlow(
  {
    name: 'verifyTransactionFlow',
    inputSchema: VerifyTransactionInputSchema,
    outputSchema: VerifyTransactionOutputSchema,
  },
  async (input) => {
    try {
      // 1. Fetch real-time data from Tronscan API
      const response = await fetch(`https://apilist.tronscan.org/api/transaction-info?hash=${input.txId}`);
      
      if (!response.ok) {
        return { success: false, error: 'Blockchain node unreachable. Please try again in a few minutes.' };
      }

      const txData = await response.json();

      // Check if transaction exists
      if (!txData || !txData.hash) {
        return { success: false, error: 'Transaction hash not found on the TRON network.' };
      }

      // 2. Confirmation Check (Security: Prevent pending/failed fraud)
      if (!txData.confirmed) {
        return { success: false, error: 'Transaction is still pending confirmation. Please wait 60 seconds.' };
      }

      if (txData.contractRet !== 'SUCCESS') {
        return { success: false, error: 'The blockchain reported this transaction as failed.' };
      }

      // 3. Contract & Multi-Transfer Extraction
      const transfers = txData.trc20TransferInfo || [];
      const usdtTransfer = transfers.find((t: any) => t.contract_address === USDT_CONTRACT_TRC20);

      if (!usdtTransfer) {
        return { success: false, error: 'No USDT (TRC-20) transfer detected in this transaction.' };
      }

      // 4. Recipient Validation (Case-insensitive match)
      if (usdtTransfer.to_address.toLowerCase() !== input.companyWallet.toLowerCase()) {
        return { success: false, error: 'Recipient mismatch. This transaction was not sent to our company wallet.' };
      }

      // 5. Amount Matching (Token Logic: Handle 6-decimal precision)
      const rawAmount = parseFloat(usdtTransfer.amount_str || usdtTransfer.amount || '0');
      const actualUsdt = rawAmount / 1_000_000; // USDT is 6 decimals on TRON

      // Allow 1% variance for exchange fees or rounding
      if (actualUsdt < input.claimedAmount * 0.99) {
        return { success: false, error: `Amount mismatch. Sent ${actualUsdt} USDT, but required ${input.claimedAmount} USDT.` };
      }

      return { 
        success: true, 
        actualAmount: actualUsdt, 
        timestamp: new Date(txData.timestamp).toISOString() 
      };

    } catch (error: any) {
      console.error("[verifyTransactionFlow] Logic Error:", error);
      return { success: false, error: 'An internal verification engine error occurred.' };
    }
  }
);
