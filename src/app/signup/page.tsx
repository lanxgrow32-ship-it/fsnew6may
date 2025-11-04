'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signup } from './actions';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = searchParams.get('plan');
  const price = searchParams.get('price');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('plan_purchased', plan || '');
    
    const result = await signup(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      toast({ title: 'Sign Up Submitted', description: 'Your registration is pending admin approval.' });
      router.push('/login');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            {plan && price ? `You are purchasing the ${plan} plan for ₹${price}.` : 'Enter your details to get started.'}
            <br />
            Please pay ₹{price} via UPI and enter the transaction ID below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-md border bg-muted p-4 text-center">
            <p className="font-semibold">UPI ID: your-upi-id@okhdfcbank</p>
            <p className="text-sm text-muted-foreground">Scan QR or use UPI ID</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction_id">UPI Transaction ID</Label>
              <Input id="transaction_id" name="transaction_id" required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for Approval
            </Button>
             <div className="text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline">
                  Login
                </Link>
              </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}


export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
}
