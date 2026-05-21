
import { createHash } from 'crypto';

/**
 * Generates an MD5 signature for WatchPay API requests.
 * Following the rule: sort alphabetically -> join with & -> append &key=API_KEY -> MD5
 */
export function generateWatchPaySignature(params: Record<string, any>, apiKey: string): string {
    const filteredParams: Record<string, string> = {};

    // 1. Prepare params and remove empty values
    for (const k in params) {
        if (params[k] !== '' && params[k] !== null && params[k] !== undefined) {
            filteredParams[k] = String(params[k]);
        }
    }
    
    // 2. Sort the keys alphabetically.
    const sortedKeys = Object.keys(filteredParams).sort();
    
    // 3. Build string: amount=1000.00&callback_url=...&merchant_id=...&merchant_order_no=...
    const signStr = sortedKeys
        .map(k => `${k}=${filteredParams[k]}`)
        .join('&');
    
    // 4. Append API key
    const stringToSign = `${signStr}&key=${apiKey}`;
    
    // 5. MD5 hash
    return createHash('md5').update(stringToSign).digest('hex');
}
