
'use server';

import { randomUUID } from "crypto";

// NOTE: These endpoints and headers are based on the NEW documentation provided.
const IMB_API_URL = 'https://secure.imbpayment.in/api/v1/aadhaar';
const EKYCHUB_CLIENT_ID = process.env.EKYCHUB_CLIENT_ID;
const EKYCHUB_CLIENT_SECRET = process.env.EKYCHUB_CLIENT_SECRET;

interface AadhaarState {
    error: string | null;
    success: boolean;
    // Changed from refId to requestId to match the new API
    requestId?: string | null;
    aadhaarNumber?: string | null;
    data?: any | null;
}

export async function sendAadhaarOtp(prevState: AadhaarState, formData: FormData): Promise<AadhaarState> {
    const aadhaarNumber = formData.get('aadhaar_number') as string;

    if (!EKYCHUB_CLIENT_ID || !EKYCHUB_CLIENT_SECRET) {
        return { error: 'API credentials are not configured on the server.', success: false };
    }
    if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
        return { error: 'Please enter a valid 12-digit Aadhaar number.', success: false };
    }

    try {
        const response = await fetch(`${IMB_API_URL}/send-otp`, {
            method: 'POST',
            headers: {
                'x-client-id': EKYCHUB_CLIENT_ID,
                'x-client-secret': EKYCHUB_CLIENT_SECRET,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                aadhaar_number: aadhaarNumber,
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json() as any;

        if (result.status === "success" && result.data?.request_id) {
            return { 
                error: null, 
                success: true, 
                // The new API returns a 'request_id' which we need for the next step
                requestId: result.data.request_id, 
                aadhaarNumber: aadhaarNumber 
            };
        } else {
            return { error: result.message || 'Failed to send OTP. Please check the Aadhaar number.', success: false };
        }
    } catch (error: any) {
        console.error('Send OTP API Error:', error);
        return { error: `An unexpected server error occurred: ${error.message}`, success: false };
    }
}

export async function verifyAadhaarOtp(prevState: AadhaarState, formData: FormData): Promise<AadhaarState> {
    const otp = formData.get('otp') as string;
    // Changed from ref_id to request_id
    const requestId = formData.get('request_id') as string; 
    const aadhaarNumber = formData.get('aadhaar_number') as string;

     if (!EKYCHUB_CLIENT_ID || !EKYCHUB_CLIENT_SECRET) {
        return { error: 'API credentials are not configured on the server.', success: false };
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
        return { error: 'Please enter a valid 6-digit OTP.', success: false };
    }
    if (!requestId) {
        return { error: 'Request ID is missing. Please start over.', success: false };
    }

    try {
        const response = await fetch(`${IMB_API_URL}/verify-otp`, {
            method: 'POST',
            headers: {
                'x-client-id': EKYCHUB_CLIENT_ID,
                'x-client-secret': EKYCHUB_CLIENT_SECRET,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                otp: otp,
                request_id: requestId,
                aadhaar_number: aadhaarNumber
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json() as any;
        
        if (result.status === "success") {
             // The verified data is now nested inside `aadhaar_details`
            return { error: null, success: true, data: result.data?.aadhaar_details, aadhaarNumber };
        } else {
            return { ...prevState, error: result.message || 'OTP verification failed.', success: false };
        }
    } catch (error: any) {
        console.error('Verify OTP API Error:', error);
        return { ...prevState, error: `An unexpected server error occurred: ${error.message}`, success: false };
    }
}
