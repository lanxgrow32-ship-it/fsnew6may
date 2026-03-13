// @ts-nocheck
import { createHash } from 'crypto';

/**
 * Generates an MD5 signature for LG-Pay API requests.
 * @param params - An object of non-empty parameters to be signed.
 * @param key - The merchant's secret key.
 * @returns The uppercase MD5 signature string.
 */
export function generateLgPaySignature(params: Record<string, string | number>, key: string): string {
    // 1. Create a new object for parameters to be signed
    const paramsToSign: Record<string, string> = {};

    // 2. Sort keys alphabetically
    const sortedKeys = Object.keys(params).sort();

    // 3. Populate the new object, ensuring values are strings and non-empty
    for (const k of sortedKeys) {
        const value = params[k];
        if (value !== '' && value !== null && value !== undefined) {
            paramsToSign[k] = String(value);
        }
    }
    
    // 4. Use URLSearchParams to correctly format the string `key1=value1&key2=value2...`
    // This handles URL encoding of special characters automatically.
    const stringA = new URLSearchParams(paramsToSign).toString();
    
    // 5. Append the secret key
    const stringSignTemp = `${stringA}&key=${key}`;

    // 6. Generate MD5 hash and convert to uppercase
    const sign = createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();

    return sign;
}
