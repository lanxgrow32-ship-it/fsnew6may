'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { FundedStockLogo } from '@/components/ui/logo';
import { ClientOnly } from '@/components/ui/client-only';
import { Checkbox } from '@/components/ui/checkbox';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

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
    <div className="dark-theme">
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <ClientOnly>
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <Button asChild variant="outline" size="sm" className="border-border/50 text-foreground/80 hover:bg-accent/50 hover:text-foreground">
              <Link href="https://www.fundedstock.io/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Main Site
              </Link>
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
              <FundedStockLogo className="h-10 w-10 text-primary" />
              <h1 className="text-2xl font-bold mt-4 text-primary">Welcome Back</h1>
              <p className="text-muted-foreground">Enter your credentials to access your account.</p>
          </div>
          <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                  {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                  <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                   <div className="flex items-start space-x-2 pt-2">
                        <Checkbox id="terms" onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
                        <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
                           By logging in, you acknowledge you have read and accepted our <Link href="https://www.fundedstock.io/terms-and-conditions" target="_blank" className="underline hover:text-primary">terms and conditions</Link> and <Link href="https://www.fundedstock.io/privacy-policy" target="_blank" className="underline hover:text-primary">privacy policy</Link>.
                        </Label>
                    </div>
                  <Button type="submit" className="w-full" size="lg" disabled={isLoading || !termsAccepted}>
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
        </ClientOnly>
      </main>
    </div>
  );
}
