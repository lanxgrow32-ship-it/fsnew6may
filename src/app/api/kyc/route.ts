
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
            const url = `https://connect.ekychub.in/v3/digilocker/${endpoint}?username=${ekycUsername}&token=${ekycToken}&redirect_url=${encodeURIComponent(redirectBackUrl)}&orderid=${orderId}`;

            const apiResponse = await fetch(url);
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
            const url = `https://connect.ekychub.in/v3/digilocker/get_document?username=${ekycUsername}&token=${ekycToken}&verification_id=${verification_id}&reference_id=${reference_id}&orderid=${orderId}&document_type=${document_type}`;
            
            const apiResponse = await fetch(url);
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
