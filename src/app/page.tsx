
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FundedStockLogo } from '@/components/ui/logo';

export default async function HomePage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (profile?.role === 'admin') {
      redirect('/admin/dashboard');
    } else {
      redirect('/welcome');
    }
  }

  return (
    <div className="dark-theme">
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <FundedStockLogo className="h-12 w-12 text-primary" />
          <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to FundedStock 2.0</h1>
              <p className="mt-2 text-muted-foreground">Your trading account management solution.</p>
          </div>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <Button asChild size="lg">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">View Plans & Sign Up</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
