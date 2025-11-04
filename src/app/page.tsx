import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain } from 'lucide-react';

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-8">
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        <Mountain className="h-12 w-12 text-primary" />
        <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to PropStar</h1>
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
  );
}