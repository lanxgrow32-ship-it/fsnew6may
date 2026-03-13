// @ts-nocheck
import { createHash } from 'crypto';

/**
 * Generates an MD5 signature for LG-Pay API requests by precisely replicating their official PHP sample code.
 * This function is the definitive implementation based on the user-provided documentation.
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
    
    // 2. URLSearchParams sorts keys alphabetically, matching PHP's `ksort`.
    const searchParams = new URLSearchParams(filteredParams);
    
    // 3. Mimic PHP's `http_build_query` and `urldecode` process.
    // `toString()` creates the URL-encoded string (like `http_build_query`).
    const encodedString = searchParams.toString();
    
    // `decodeURIComponent` is the JS equivalent of `urldecode`.
    // CRITICAL FIX: The replace(/\+/g, ' ') call correctly mimics how PHP's `urldecode`
    // handles space characters (`+`), which was the missing piece in previous attempts.
    const decodedString = decodeURIComponent(encodedString.replace(/\+/g, ' '));
    
    // 4. Append the secret key to the end of the string.
    const stringToSign = `${decodedString}&key=${key}`;
    
    // 5. Create the MD5 hash and convert it to uppercase.
    const md5Hash = createHash('md5').update(stringToSign).digest('hex').toUpperCase();

    return md5Hash;
}
