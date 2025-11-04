'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Mountain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    if (session) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profileError || !profile) {
        setError('Could not retrieve user role. Please contact support.');
        setIsLoading(false);
        return;
      }
      
      toast({ title: 'Login Successful', description: 'Redirecting to your dashboard...' });

      if (profile.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/welcome');
      }
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
       <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center text-center">
            <Mountain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold mt-4">Welcome Back</h1>
            <p className="text-muted-foreground">Enter your credentials to access your account.</p>
        </div>
        <Card>
            <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
                {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
                </Button>
            </form>
            </CardContent>
            <CardDescription className="p-6 pt-0 text-center text-sm">
                Don't have an account?{' '}
                <Link href="/pricing" className="font-semibold text-primary hover:underline">
                    Sign Up
                </Link>
            </CardDescription>
        </Card>
      </div>
    </main>
  );
}