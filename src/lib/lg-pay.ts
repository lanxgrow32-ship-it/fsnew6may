
import { createHash } from 'crypto';

/**
 * Generates an MD5 signature for LG-Pay API requests by precisely replicating their official PHP sample code.
 * This function is the definitive implementation based on the user-provided documentation and PHP sample.
 * @param params - An object of parameters to be signed.
 * @param key - The merchant's secret key.
 * @returns The uppercase MD5 signature string.
 */
export function generateLgPaySignature(params: Record<string, any>, key: string): string {
    const filteredParams: Record<string, string> = {};

    // 1. Filter out empty, null, or undefined parameters as per documentation.
    for (const k in params) {
        if (params[k] !== '' && params[k] !== null && params[k] !== undefined) {
            filteredParams[k] = String(params[k]);
        }
    }
    
    // 2. Sort the keys alphabetically.
    const sortedKeys = Object.keys(filteredParams).sort();
    
    // 3. Build the query string by joining key-value pairs.
    // This step correctly replicates the behavior of PHP's `http_build_query` followed by `urldecode`.
    const searchString = sortedKeys
        .map(k => `${k}=${filteredParams[k]}`)
        .join('&');
    
    // 4. Append the secret key to the end of the string.
    const stringToSign = `${searchString}&key=${key}`;
    
    // 5. Create the MD5 hash and convert it to uppercase.
    const md5Hash = createHash('md5').update(stringToSign).digest('hex').toUpperCase();

    return md5Hash;
}
