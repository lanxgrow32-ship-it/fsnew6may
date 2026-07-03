import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * API for fundedstock.shop to validate a user's Wallet ID
 * GET /api/external/wallet/validate?wallet_id=12345678
 * Returns name for the "Green Mark" validation UI on the portal.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const walletId = searchParams.get('wallet_id');

    // CORS Headers for the external portal
    const headers = {
        'Access-Control-Allow-Origin': 'https://www.fundedstock.shop',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers });
    }

    if (!walletId) {
        return NextResponse.json({ error: 'Wallet ID required' }, { status: 400, headers });
    }

    try {
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('wallet_id', parseInt(walletId))
            .single();

        if (error || !profile) {
            return NextResponse.json({ valid: false, message: 'Invalid Wallet ID' }, { status: 404, headers });
        }

        return NextResponse.json({
            valid: true,
            name: profile.full_name,
            email: profile.email
        }, { headers });
    } catch (e) {
        console.error('Validation API Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers });
    }
}
