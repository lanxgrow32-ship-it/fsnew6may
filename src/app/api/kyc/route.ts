
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const ekycUsername = process.env.EKYCHUB_USERNAME;
const ekycToken = process.env.EKYCHUB_TOKEN;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { documentType, redirectBackUrl, action } = body;

        if (action === 'create_url') {
            if (!documentType || (documentType !== 'AADHAAR' && documentType !== 'PAN')) {
                return NextResponse.json({ error: 'Invalid or missing documentType.' }, { status: 400 });
            }
            if (!redirectBackUrl) {
                return NextResponse.json({ error: 'Missing redirectBackUrl.' }, { status: 400 });
            }

            if (!ekycUsername || !ekycToken) {
                console.error("eKYCHub credentials are not set in environment variables.");
                return NextResponse.json({ error: 'Verification service is not configured.' }, { status: 500 });
            }

            const orderId = randomUUID();
            const endpoint = documentType === 'AADHAAR' ? 'create_url_aadhaar' : 'create_url_pan';
            
            // Correctly build the URL using URL and URLSearchParams
            const baseUrl = `https://connect.ekychub.in/v3/digilocker/${endpoint}`;
            const params = new URLSearchParams({
                username: ekycUsername,
                token: ekycToken,
                redirect_url: redirectBackUrl,
                orderid: orderId,
            });
            
            const url = `${baseUrl}?${params.toString()}`;

            const apiResponse = await fetch(url, { method: 'GET' });

            // Before parsing, check if the content-type is JSON
            const contentType = apiResponse.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const errorBody = await apiResponse.text();
                console.error('eKYCHub API did not return JSON. Status:', apiResponse.status, 'Body:', errorBody);
                return NextResponse.json({ error: `Verification service returned an invalid response (not JSON). Check server logs for details. Status: ${apiResponse.status}` }, { status: 500 });
            }
            
            const data = await apiResponse.json();

            if (apiResponse.ok && data.status === 'Success') {
                return NextResponse.json(data, { status: 200 });
            } else {
                console.error("eKYCHub Error:", data);
                return NextResponse.json({ error: data.message || `Verification service returned a server error (Status: ${apiResponse.status})` }, { status: apiResponse.status });
            }
        } else if (action === 'get_document') {
            const { verification_id, reference_id, document_type } = body;
            if (!verification_id || !reference_id || !document_type) {
                return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
            }

            if (!ekycUsername || !ekycToken) {
                console.error("eKYCHub credentials are not set in environment variables.");
                return NextResponse.json({ error: 'Verification service is not configured.' }, { status: 500 });
            }
            
            const orderId = randomUUID();
            const baseUrl = `https://connect.ekychub.in/v3/digilocker/get_document`;
            const params = new URLSearchParams({
                username: ekycUsername,
                token: ekycToken,
                verification_id,
                reference_id,
                orderid: orderId,
                document_type,
            });
            const url = `${baseUrl}?${params.toString()}`;
            
            const apiResponse = await fetch(url, { method: 'GET' });

            const contentType = apiResponse.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                 const errorBody = await apiResponse.text();
                console.error('eKYCHub API did not return JSON. Status:', apiResponse.status, 'Body:', errorBody);
                return NextResponse.json({ error: 'Failed to retrieve document data. The service returned a non-JSON response.' }, { status: 500 });
            }

            const data = await apiResponse.json();

            if (apiResponse.ok) {
                return NextResponse.json(data, { status: 200 });
            } else {
                console.error("eKYCHub Error:", data);
                return NextResponse.json({ error: data.message || 'Failed to retrieve document data.' }, { status: apiResponse.status });
            }
        } else {
            return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }
}
