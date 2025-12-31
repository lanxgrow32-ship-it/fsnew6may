
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

// Dynamically import node-fetch
const fetch = (...args: any[]) => import('node-fetch').then(({default: fetch}) => (fetch as any)(...args));

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const ekycUsername = process.env.EKYCHUB_USERNAME;
const ekycToken = process.env.EKYCHUB_TOKEN;


app.use(cors()); // Allow all origins for now
app.use(express.json());

/**
 * Endpoint to create a Digilocker redirect URL.
 * It takes the document type (AADHAAR or PAN) and the frontend's URL
 * to construct the correct redirect URL back to the frontend application.
 */
app.post('/api/create-digilocker-url', async (req, res) => {
  const { documentType, redirectBackUrl } = req.body;

  if (!documentType || (documentType !== 'AADHAAR' && documentType !== 'PAN')) {
    return res.status(400).json({ error: 'Invalid or missing documentType.' });
  }

  if (!redirectBackUrl) {
    return res.status(400).json({ error: 'Missing redirectBackUrl.' });
  }

  if (!ekycUsername || !ekycToken) {
    console.error("eKYCHub credentials are not set in environment variables.");
    return res.status(500).json({ error: 'Verification service is not configured.' });
  }

  const orderId = randomUUID();
  
  const endpoint = documentType === 'AADHAAR' 
    ? 'create_url_aadhaar' 
    : 'create_url_pan';
  
  // The redirect_url is now dynamically passed from the frontend
  const url = `https://connect.ekychub.in/v3/digilocker/${endpoint}?username=${ekycUsername}&token=${ekycToken}&redirect_url=${encodeURIComponent(redirectBackUrl)}&orderid=${orderId}`;
  
  try {
    const apiResponse = await fetch(url);
    const data = await apiResponse.json();

    if (apiResponse.ok && data.status === 'Success') {
      res.status(200).json(data);
    } else {
      console.error("eKYCHub Error:", data);
      res.status(apiResponse.status).json({ error: data.message || `Verification service returned a server error (Status: ${apiResponse.status})` });
    }
  } catch (error) {
    console.error('Error creating Digilocker URL:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * Endpoint to fetch the document from Digilocker after the user is redirected back.
 */
app.post('/api/get-document', async (req, res) => {
    const { verification_id, reference_id, document_type } = req.body;

    if (!verification_id || !reference_id || !document_type) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    if (!ekycUsername || !ekycToken) {
        console.error("eKYCHub credentials are not set in environment variables.");
        return res.status(500).json({ error: 'Verification service is not configured.' });
    }

    const orderId = randomUUID();
    const url = `https://connect.ekychub.in/v3/digilocker/get_document?username=${ekycUsername}&token=${ekycToken}&verification_id=${verification_id}&reference_id=${reference_id}&orderid=${orderId}&document_type=${document_type}`;

    try {
        const apiResponse = await fetch(url);
        const data = await apiResponse.json();

        if(apiResponse.ok) {
            res.status(200).json(data);
        } else {
            console.error("eKYCHub Error:", data);
            res.status(apiResponse.status).json({ error: data.message || 'Failed to retrieve document data.' });
        }
    } catch (error) {
        console.error('Error fetching Digilocker document:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.listen(port, () => {
  console.log(`Microservice listening on port ${port}`);
});
