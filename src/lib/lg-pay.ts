
// @ts-nocheck
import { createHash } from 'crypto';

/**
 * Generates an MD5 signature for LG-Pay API requests.
 * This function now strictly adheres to the documentation by sorting all non-empty
 * parameters and then appending the key at the end before hashing.
 * @param params - An object of parameters to be signed.
 * @param key - The merchant's secret key.
 * @returns The uppercase MD5 signature string.
 */
export function generateLgPaySignature(params: Record<string, any>, key: string): string {
    const data: Record<string, string> = {};

    // 1. Filter out empty, null, or undefined parameters as per the documentation's "non-empty" rule.
    // The secret key is NOT included in this step.
    for (const k in params) {
        if (params[k] !== '' && params[k] !== null && params[k] !== undefined) {
            data[k] = String(params[k]);
        }
    }

    // 2. Sort the keys of the filtered parameters alphabetically (ASCII order).
    const sortedKeys = Object.keys(data).sort();

    // 3. Create the string to sign by joining the key-value pairs.
    const stringA = sortedKeys.map(k => `${k}=${data[k]}`).join('&');

    // 4. Append the secret key to the end of the string, as per the documentation's example.
    const stringToSign = `${stringA}&key=${key}`;
    
    // 5. Create the MD5 hash and convert it to uppercase.
    const md5Hash = createHash('md5').update(stringToSign).digest('hex').toUpperCase();

    return md5Hash;
}
