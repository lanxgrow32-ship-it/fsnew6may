
/**
 * Consolidated utility functions for plan classification and balance parsing.
 * Shared between Admin, Welcome, and API routes to ensure Stockmint synchronization.
 */

export function getAutoClassification(planName: string): string {
    if (!planName) return 'evaluation';
    const name = planName.toLowerCase();
    
    if (name.includes('ptp') || name.includes('passthenpay') || name.includes('pass then pay')) {
        return 'passthenpay';
    }
    if (name.includes('instant')) return 'instant_live';
    
    if (name.includes('1-step') || name.includes('1step') || name.includes('one step') || name.includes('one-step')) {
        return 'one_step_phase_1';
    }
    
    if (name.includes('2-step') || name.includes('2step') || name.includes('two step') || name.includes('two-step')) {
        return 'two_step_phase_1';
    }
    
    return 'evaluation';
}

export function getBalanceFromPlanName(planName: string): number {
    if (!planName) return 0;
    // Strip currency symbols and trim
    const name = planName.toLowerCase().replace(/[₹$,]/g, '').trim();
    
    // 1. Check for units like K, L, Cr
    const unitMatch = name.match(/([\d.]+)\s*(k|l|lakh|cr|crore)/);
    if (unitMatch) {
        let amount = parseFloat(unitMatch[1]);
        const unit = unitMatch[2];
        if (unit === 'k') amount *= 1000;
        else if (unit === 'l' || unit === 'lakh') amount *= 100000;
        else if (unit === 'cr' || unit === 'crore') amount *= 10000000;
        return amount;
    }
    
    // 2. Search for any plain number in the string (e.g. 100000)
    const numberMatch = name.match(/\d+/);
    if (numberMatch) {
        return parseInt(numberMatch[0]);
    }
    
    return 0;
}
