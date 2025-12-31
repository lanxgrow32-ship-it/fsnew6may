
'use server';

import { randomUUID } from 'crypto';

// This is a server action to securely call the eKYCHub API.
// The username and token are stored securely on the server and are not exposed to the client.

const ekycUsername = process.env.EKYCHUB_USERNAME;
const ekycToken = process.env.EKYCHUB_TOKEN;

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
  
  const baseUrl = `https://connect.ekychub.in/v3/digilocker/${endpoint}`;
  const params = new URLSearchParams({
      username: ekycUsername,
      token: ekycToken,
      redirect_url: redirectBackUrl,
      orderid: orderId,
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, { 
      method: 'GET',
      headers: {
        'User-Agent': 'FundedStock-NextJS-App/1.0'
      }
    });
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const errorBody = await response.text();
        console.error('eKYCHub API did not return JSON. Status:', response.status, 'Body:', errorBody);
        return { error: `Verification service returned an invalid response (not JSON). Check server logs for details. Status: ${response.status}` };
    }

    const data = await response.json();

    if (data.status === 'Success' && data.url) {
      return { success: true, url: data.url };
    } else {
      console.error('eKYCHub API Error (JSON Response):', data);
      return { error: data.message || `Failed to create Digilocker URL from API. Status: ${response.status}` };
    }
  } catch (error) {
    console.error('Error calling createDigilockerUrl:', error);
    if (error instanceof Error) {
        return { error: `An unexpected error occurred: ${error.message}` };
    }
    return { error: 'An unexpected error occurred while contacting the verification service.' };
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

  const baseUrl = `https://connect.ekychub.in/v3/digilocker/get_document`;
  const params = new URLSearchParams({
      username: ekycUsername,
      token: ekycToken,
      verification_id: verification_id,
      reference_id: reference_id,
      orderid: orderId,
      document_type: document_type,
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, { 
      method: 'GET',
      headers: {
        'User-Agent': 'FundedStock-NextJS-App/1.0'
      }
    });

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
