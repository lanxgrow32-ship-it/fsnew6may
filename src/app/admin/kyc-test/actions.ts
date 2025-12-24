
'use server';

import { randomUUID } from 'crypto';

// This is a server action to securely call the eKYCHub API.
// The username and token are stored securely on the server and are not exposed to the client.
export async function verifyPan(pan: string) {
  // IMPORTANT: Replace with your actual credentials from eKYCHub
  const username = process.env.EKYCHUB_USERNAME || '9216927813';
  const token = process.env.EKYCHUB_TOKEN || '651ec64f0591e55824b5434c5c4940e4';
  const orderId = randomUUID();

  if (!username || !token) {
    console.error('eKYCHub credentials are not set in environment variables.');
    return { status: 'Failure', message: 'Verification service is not configured on the server.' };
  }

  // Construct the request URL
  const url = `https://connect.ekychub.in/v3/verification/pan_verification?username=${username}&token=${token}&pan=${pan}&orderid=${orderId}`;

  try {
    const response = await fetch(url, { method: 'GET' });
    
    if (!response.ok) {
      console.error('eKYCHub API request failed with status:', response.status, response.statusText);
      const errorBody = await response.text();
      return { status: 'Failure', message: `API request failed: ${response.statusText}`, details: errorBody };
    }
    
    // The response is expected to be JSON
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error calling eKYCHub API:', error);
    if (error instanceof Error) {
        return { status: 'Failure', message: `An unexpected error occurred: ${error.message}` };
    }
    return { status: 'Failure', message: 'An unexpected error occurred during verification.' };
  }
}
