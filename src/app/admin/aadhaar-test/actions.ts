
'use server';

// NOTE: This is the OLD documentation that was causing issues.
// const IMB_API_URL_WRONG_1 = 'https://secure.imbpayment.com/api/v1/verification/aadhaar';
// const IMB_API_TOKEN = process.env.IMB_PAYMENT_USER_TOKEN;

// NOTE: This is the CORRECT documentation provided by the user.
const IMB_API_URL = 'https://secure.imbpayment.in/api/v1/aadhaar';
const EKYCHUB_CLIENT_ID = process.env.EKYCHUB_CLIENT_ID;
const EKYCHUB_CLIENT_SECRET = process.env.EKYCHUB_CLIENT_SECRET;


interface AadhaarState {
    error: string | null;
    success: boolean;
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
        
        const result = await response.json();

        if (response.ok && result.status === 'success' && result.data?.request_id) {
            return {
                error: null,
                success: true,
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
    if (!aadhaarNumber) {
        return { ...prevState, error: 'Aadhaar number is missing. Please start over.', success: false };
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
                request_id: requestId,
                otp: otp,
                aadhaar_number: aadhaarNumber,
            }),
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            return { error: null, success: true, data: result.data, aadhaarNumber };
        } else {
            return { ...prevState, error: result.message || 'OTP verification failed.', success: false };
        }
    } catch (error: any) {
        console.error('Verify OTP API Error:', error);
        return { ...prevState, error: `An unexpected server error occurred: ${error.message}`, success: false };
    }
}
