/**
 * Consolidated utility functions for plan classification and balance parsing.
 * Shared between Admin, Welcome, and API routes to ensure Stockmint synchronization.
 * Follows SPEC v4.0
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
    // Strip currency symbols and common noise
    const name = planName.toLowerCase().replace(/[₹$,]/g, '').trim();
    
    // 1. Check for units like K, L, Cr, Lakh
    const unitMatch = name.match(/([\d.]+)\s*(k|l|lakh|cr|crore)/);
    if (unitMatch) {
        let amount = parseFloat(unitMatch[1]);
        const unit = unitMatch[2];
        if (unit === 'k') amount *= 1000;
        else if (unit === 'l' || unit === 'lakh') amount *= 100000;
        else if (unit === 'cr' || unit === 'crore') amount *= 10000000;
        return amount;
    }
    
    // 2. Search for any plain number in the string (e.g. "100000")
    const numberMatch = name.match(/\d+/);
    if (numberMatch) {
        return parseInt(numberMatch[0]);
    }
    
    return 0;
}

/**
 * Generates a unique Stockmint Terminal Email/ID for multi-account support.
 */
export function generateStockmintUsername(baseEmail: string, credentialsProvidedCount: number): string {
    const [userPart, domainPart] = baseEmail.split('@');
    if (credentialsProvidedCount === 0) return baseEmail.toLowerCase().trim();
    return `${userPart}-ac${credentialsProvidedCount + 1}@${domainPart}`.toLowerCase().trim();
}

/**
 * Calculates the 48-hour trial expiry with Market-Aware (Weekend) logic.
 * If Friday/Sat/Sun -> Clock starts Monday 9:00 AM.
 */
export function calculateTrialExpiry(startDate: Date): Date {
    const day = startDate.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    let expiry = new Date(startDate);

    // Logic: Friday, Saturday, Sunday creations start their 48h from Monday 9AM
    if (day === 5 || day === 6 || day === 0) {
        // Find next Monday
        const daysToMonday = (day === 5) ? 3 : (day === 6) ? 2 : 1;
        expiry.setDate(startDate.getDate() + daysToMonday);
        expiry.setHours(9, 0, 0, 0); // Monday 9:00 AM
        expiry.setHours(expiry.getHours() + 48); // Add 48 hours
    } else {
        // Standard Monday-Thursday creation: Just add 48 hours
        expiry.setHours(startDate.getHours() + 48);
    }

    return expiry;
}
