
'use server';

import { randomUUID } from "crypto";

const IMB_API_URL = 'https://secure.imbpayment.com/api/v1/verification/aadhaar';
const IMB_TOKEN = process.env.IMB_PAYMENT_USER_TOKEN;

interface AadhaarState {
    error: string | null;
    success: boolean;
    refId?: string | null;
    aadhaarNumber?: string | null;
    data?: any | null;
}

export async function sendAadhaarOtp(prevState: AadhaarState, formData: FormData): Promise<AadhaarState> {
    const aadhaarNumber = formData.get('aadhaar_number') as string;

    if (!IMB_TOKEN) {
        return { error: 'API token is not configured on the server.', success: false };
    }
    if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
        return { error: 'Please enter a valid 12-digit Aadhaar number.', success: false };
    }

    const refId = `FSTK_${randomUUID()}`;

    try {
        const response = await fetch(`${IMB_API_URL}/sendotp`, {
            method: 'POST',
            headers: {
                'Token': IMB_TOKEN,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                aadhaar_number: aadhaarNumber,
                ref_id: refId,
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json() as any;

        if (result.response_code === 111 || result.response_code === 112) {
            return { error: null, success: true, refId: result.RequestId || refId, aadhaarNumber: aadhaarNumber };
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
    const refId = formData.get('ref_id') as string;
    const aadhaarNumber = formData.get('aadhaar_number') as string;

    if (!IMB_TOKEN) {
        return { error: 'API token is not configured on the server.', success: false };
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
        return { error: 'Please enter a valid 6-digit OTP.', success: false };
    }
    if (!refId) {
        return { error: 'Reference ID is missing. Please start over.', success: false };
    }

    try {
        const response = await fetch(`${IMB_API_URL}/verify`, {
            method: 'POST',
            headers: {
                'Token': IMB_TOKEN,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                otp: otp,
                ref_id: refId,
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json() as any;
        
        if (result.response_code === 111 || result.response_code === 112) {
            return { error: null, success: true, data: result.data, aadhaarNumber };
        } else {
            return { ...prevState, error: result.message || 'OTP verification failed.', success: false };
        }
    } catch (error: any) {
        console.error('Verify OTP API Error:', error);
        return { ...prevState, error: `An unexpected server error occurred: ${error.message}`, success: false };
    }
}
