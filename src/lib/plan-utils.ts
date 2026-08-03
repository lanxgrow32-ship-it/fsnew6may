
/**
 * Consolidated utility functions for plan classification and balance parsing.
 * Shared between Admin, Welcome, and API routes to ensure Stockmint synchronization.
 * Follows SPEC v4.1 (Forex Aware)
 * UPDATED v11.0: Instant Pro Category & 15L Support
 */

export function getMarketType(planName: string): 'indian' | 'forex' {
    if (!planName) return 'indian';
    const name = planName.toLowerCase();
    if (name.includes('forex') || name.includes('$')) return 'forex';
    return 'indian';
}

export function getAutoClassification(planName: string): string {
    if (!planName) return 'evaluation';
    const name = planName.toLowerCase();
    
    // 1. INSTANT PRO PROTOCOL (v11.0)
    if (name.includes('pro')) {
        return 'instant_pro';
    }

    if (name.includes('ptp') || name.includes('passthenpay') || name.includes('pass then pay')) {
        return 'passthenpay';
    }
    
    // Forex plans are strictly 2-Step for now as per SPEC
    if (name.includes('forex')) {
        return 'two_step_phase_1';
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
    
    // Handle USD Forex plans (e.g. "$100k Forex")
    if (planName.includes('$')) {
        const usdMatch = planName.match(/\$(\d+)\s*(k|m)?/i);
        if (usdMatch) {
            let amount = parseFloat(usdMatch[1]);
            const unit = usdMatch[2]?.toLowerCase();
            if (unit === 'k') amount *= 1000;
            if (unit === 'm') amount *= 1000000;
            return amount;
        }
    }

    // Strip currency symbols and common noise for INR plans
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

export function generateStockmintUsername(baseEmail: string, credentialsProvidedCount: number): string {
    const [userPart, domainPart] = baseEmail.split('@');
    if (credentialsProvidedCount === 0) return baseEmail.toLowerCase().trim();
    return `${userPart}-ac${credentialsProvidedCount + 1}@${domainPart}`.toLowerCase().trim();
}

export function calculateTrialExpiry(startDate: Date): Date {
    const day = startDate.getDay();
    let expiry = new Date(startDate);
    if (day === 5 || day === 6 || day === 0) {
        const daysToMonday = (day === 5) ? 3 : (day === 6) ? 2 : 1;
        expiry.setDate(startDate.getDate() + daysToMonday);
        expiry.setHours(9, 0, 0, 0);
        expiry.setHours(expiry.getHours() + 48);
    } else {
        expiry.setHours(startDate.getHours() + 48);
    }
    return expiry;
}
