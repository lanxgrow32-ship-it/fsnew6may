
import { NextResponse } from 'next/server';

// This webhook is deprecated and should no longer be used.
// The new flow handles verification on redirect to /payment-success.
// This endpoint is kept to gracefully handle any lingering requests
// from the old system without causing errors.
export async function POST(req: Request) {
    try {
        // Log that the deprecated endpoint was hit, to help with debugging if needed.
        console.warn("Deprecated webhook at /api/payment-webhook was called. This should be removed from the calling service.");
        
        // Acknowledge the request with a success message but take no action.
        return NextResponse.json({ message: 'Request acknowledged. This endpoint is deprecated.' });

    } catch (error: any) {
        console.error('Error in deprecated webhook endpoint:', error);
        return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
    }
}
