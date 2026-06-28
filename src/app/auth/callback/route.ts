import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code);

    // Detect if this is a brand new Google user to trigger welcome email
    if (user) {
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('created_at, full_name')
            .eq('id', user.id)
            .single();
        
        // If the profile was created in the last 10 seconds, it's a new signup
        const isNewUser = profile && (new Date().getTime() - new Date(profile.created_at).getTime() < 10000);
        
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
                }).catch(e => console.error('Google Welcome Webhook Failed:', e));
            }
        }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/welcome`);
}
