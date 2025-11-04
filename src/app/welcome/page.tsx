import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function WelcomePage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan_purchased, trading_username, trading_password, credentials_provided')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    return <p>Could not load your profile. Please contact support.</p>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Welcome, {profile.full_name || 'User'}!</CardTitle>
          <CardDescription>Here are your trading account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-muted-foreground">Plan Purchased</p>
            <p className="text-lg font-semibold">{profile.plan_purchased || 'Not specified'}</p>
          </div>
          {profile.credentials_provided ? (
            <>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground">Trading Username</p>
                <p className="text-lg font-semibold">{profile.trading_username}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground">Trading Password</p>
                <p className="text-lg font-semibold">{profile.trading_password}</p>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-yellow-400/50 bg-yellow-900/20 p-4 text-center">
              <p className="font-semibold text-yellow-300">Your trading credentials are being set up.</p>
              <p className="text-sm text-yellow-400/80">Your admin will provide them to you shortly.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
