
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/welcome';

  if (code) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code);

    if (user) {
        // If not a password reset flow, check for new user welcome trigger
        if (next !== '/reset-password') {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('created_at, full_name')
                .eq('id', user.id)
                .single();
            
            const isNewUser = profile && (new Date().getTime() - new Date(profile.created_at).getTime() < 15000);
            
            if (isNewUser) {
                const welcomeWebhook = process.env.MAKE_WELCOME_WEBHOOK_URL;
                if (welcomeWebhook) {
                    fetch(welcomeWebhook, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: user.email,
                            full_name: profile.full_name || user.email?.split('@')[0]
                        })
                    }).catch(e => console.error('Welcome Webhook Failed:', e));
                }
            }
        }
    }
  }

  // Redirect to requested next path or default /welcome
  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
