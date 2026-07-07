'use server';

import { runSupportAi } from '@/ai/flows/support-agent-flow';

/**
 * Diagnostic action to test the AI Support Flow in isolation.
 * This bypasses the database and triggers the model directly.
 */
export async function testAiSupport(message: string) {
    if (!message) return { error: 'No message provided.' };

    try {
        console.log(`[Neural Test] Probing model with message: ${message}`);
        
        const response = await runSupportAi({
            conversationId: 'TEST_SESSION_999',
            userEmail: 'trader.test@fundedstock.io',
            userName: 'Diagnostic User',
            userMessage: message,
            chatHistory: [] // Start fresh for diagnostic
        });

        if (!response) {
            return { error: 'Model returned null or empty response.' };
        }

        return { success: true, response };
    } catch (error: any) {
        console.error('[Neural Test] Critical Failure:', error);
        return { 
            error: error.message || 'Unknown technical failure.',
            details: JSON.stringify(error, null, 2)
        };
    }
}
