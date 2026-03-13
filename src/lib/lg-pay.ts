// @ts-nocheck
import { createHash } from 'crypto';

/**
 * Generates an MD5 signature for LG-Pay API requests.
 * @param params - An object of non-empty parameters to be signed.
 * @param key - The merchant's secret key.
 * @returns The uppercase MD5 signature string.
 */
export function generateLgPaySignature(params: Record<string, string | number>, key: string): string {
    // 1. Filter out empty parameters and sort keys alphabetically
    const sortedKeys = Object.keys(params)
        .filter(k => params[k] !== '' && params[k] !== null && params[k] !== undefined)
        .sort();

    // 2. Concatenate into a URL key-value pair string
    const stringA = sortedKeys
        .map(k => `${k}=${params[k]}`)
        .join('&');
    
    // 3. Append the secret key
    const stringSignTemp = `${stringA}&key=${key}`;

    // 4. Generate MD5 hash and convert to uppercase
    const sign = createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();

    return sign;
}
