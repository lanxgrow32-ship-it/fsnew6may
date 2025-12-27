
'use server';

import { randomUUID } from 'crypto';

// This is a server action to securely call the eKYCHub API.
// The username and token are stored securely on the server and are not exposed to the client.

// NEW Credentials provided by user
const ekycUsername = process.env.EKYCHUB_USERNAME || '7304893134';
const ekycToken = process.env.EKYCHUB_TOKEN || '14bf70203d692e9e695f9df588c57210';

/**
 * Step 1: Create the Digilocker Redirect URL.
 * This function is called when the admin clicks a "Verify" button.
 * It returns a URL that the admin will be redirected to.
 */
export async function createDigilockerUrl(documentType: 'AADHAAR' | 'PAN', redirectBackUrl: string) {
  const orderId = randomUUID();

  if (!ekycUsername || !ekycToken) {
    console.error('eKYCHub credentials are not set in environment variables.');
    return { error: 'Verification service is not configured on the server.' };
  }

  const endpoint = documentType === 'AADHAAR' 
    ? 'create_url_aadhaar' 
    : 'create_url_pan';
  
  const url = `https://connect.ekychub.in/v3/digilocker/${endpoint}?username=${ekycUsername}&token=${ekycToken}&redirect_url=${encodeURIComponent(redirectBackUrl)}&orderid=${orderId}`;

  try {
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();

    if (data.status === 'Success') {
      return { success: true, url: data.url };
    } else {
      return { error: data.message || 'Failed to create Digilocker URL.' };
    }
  } catch (error) {
    console.error('Error calling createDigilockerUrl:', error);
    return { error: 'An unexpected error occurred.' };
  }
}


/**
 * Step 2: Get the document data from Digilocker.
 * This function is called when the user is redirected back from Digilocker.
 * It uses the verification_id and reference_id from the URL to fetch the data.
 */
export async function getDigilockerDocument(verification_id: string, reference_id: string, document_type: 'AADHAAR' | 'PAN') {
  const orderId = randomUUID();
  
  if (!ekycUsername || !ekycToken) {
    console.error('eKYCHub credentials are not set in environment variables.');
    return { error: 'Verification service is not configured on the server.' };
  }

  const url = `https://connect.ekychub.in/v3/digilocker/get_document?username=${ekycUsername}&token=${ekycToken}&verification_id=${verification_id}&reference_id=${reference_id}&orderid=${orderId}&document_type=${document_type}`;

  try {
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling getDigilockerDocument:', error);
    if (error instanceof Error) {
        return { status: 'Failure', message: `An unexpected error occurred: ${error.message}` };
    }
    return { status: 'Failure', message: 'An unexpected error occurred during verification.' };
  }
}
