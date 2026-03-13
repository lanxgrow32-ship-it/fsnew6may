// @ts-nocheck
import { createHash } from 'crypto';

/**
 * Generates an MD5 signature for LG-Pay API requests.
 * @param params - An object of non-empty parameters to be signed.
 * @param key - The merchant's secret key.
 * @returns The uppercase MD5 signature string.
 */
export function generateLgPaySignature(params: Record<string, string | number>, key: string): string {
    const paramsToSign: Record<string, string> = {};

    // 1. Filter out empty/null parameters
    for (const k in params) {
        const value = params[k];
        if (value !== '' && value !== null && value !== undefined) {
            paramsToSign[k] = String(value);
        }
    }

    // 2. Sort the keys of the filtered parameters alphabetically
    const sortedKeys = Object.keys(paramsToSign).sort();

    // 3. Manually build the string from the sorted keys to guarantee order.
    // This prevents issues where URLSearchParams might not respect key order.
    const stringA = sortedKeys
        .map(k => `${k}=${paramsToSign[k]}`)
        .join('&');

    // 4. Append the secret key
    const stringSignTemp = `${stringA}&key=${key}`;

    // 5. Generate MD5 hash and convert to uppercase
    const sign = createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();

    return sign;
}
