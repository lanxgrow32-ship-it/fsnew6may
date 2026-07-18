
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/welcome';

  if (code) {
    const supabase = await createClient();
    
    // EXPLICIT HANDSHAKE: Exchange the temporary code for a persistent session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
        // If not a password reset flow, check for new user welcome trigger
        if (next !== '/reset-password') {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('created_at, full_name')
                .eq('id', data.user.id)
                .single();
            
            const isNewUser = profile && (new Date().getTime() - new Date(profile.created_at).getTime() < 30000);
            
            if (isNewUser) {
                const welcomeWebhook = process.env.MAKE_WELCOME_WEBHOOK_URL;
                if (welcomeWebhook) {
                    fetch(welcomeWebhook, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: data.user.email,
                            full_name: profile.full_name || data.user.email?.split('@')[0]
                        })
                    }).catch(e => console.error('Welcome Webhook Failed:', e));
                }
            }
        }
    }
  }

  // Redirect to requested next path or default /welcome
  // We use a clean absolute URL to ensure the session cookies are correctly recognized by the browser
  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
