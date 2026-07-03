import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * API for fundedstock.shop to validate a user's Wallet ID
 * GET /api/external/wallet/validate?wallet_id=12345678
 * Returns name for the "Green Mark" validation UI on the portal.
 */

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://www.fundedstock.shop',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const walletId = searchParams.get('wallet_id');

    if (!walletId) {
        return NextResponse.json({ error: 'Wallet ID required' }, { status: 400, headers: CORS_HEADERS });
    }

    try {
        const parsedId = parseInt(walletId);
        if (isNaN(parsedId)) {
            return NextResponse.json({ valid: false, message: 'Invalid ID Format' }, { status: 400, headers: CORS_HEADERS });
        }

        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('wallet_id', parsedId)
            .single();

        if (error || !profile) {
            return NextResponse.json({ valid: false, message: 'Invalid Wallet ID' }, { status: 404, headers: CORS_HEADERS });
        }

        return NextResponse.json({
            valid: true,
            name: profile.full_name,
            email: profile.email
        }, { headers: CORS_HEADERS });
    } catch (e) {
        console.error('Validation API Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
    }
}
