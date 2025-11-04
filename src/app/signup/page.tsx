'use client';
import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signup, validateCoupon } from './actions';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = searchParams.get('plan');
  const price = searchParams.get('price');

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(price ? parseFloat(price.replace(/,/g, '')) : 0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
     const originalPrice = price ? parseFloat(price.replace(/,/g, '')) : 0;
     const newFinalPrice = originalPrice - discount;
     setFinalPrice(newFinalPrice > 0 ? newFinalPrice : 0);
  }, [price, discount]);


  const handleApplyCoupon = async () => {
    if (!couponCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setCouponLoading(true);
    setCouponError(null);
    const result = await validateCoupon(couponCode);
    if (result.error) {
      setCouponError(result.error);
      setDiscount(0);
    } else if (result.discount) {
      setDiscount(result.discount);
      toast({ title: 'Coupon Applied!', description: `You received a discount of ₹${result.discount}.`});
    }
    setCouponLoading(false);
  };

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
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            {plan && price ? `You are purchasing the ${plan} plan.` : 'Enter your details to get started.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <p>Plan Price:</p>
                <p>₹{price}</p>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center mb-2 text-green-500">
                  <p>Coupon Discount:</p>
                  <p>- ₹{discount}</p>
                </div>
              )}
              <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                <p>Final Price to Pay:</p>
                <p>₹{finalPrice.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="mb-4 rounded-md border bg-muted p-4 text-center">
            <p className="font-semibold">UPI ID: your-upi-id@okhdfcbank</p>
            <p className="text-sm text-muted-foreground">Scan QR or use UPI ID and pay ₹{finalPrice.toFixed(2)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="space-y-2">
                <Label htmlFor="coupon">Have a coupon?</Label>
                <div className="flex gap-2">
                  <Input 
                    id="coupon" 
                    placeholder="Enter coupon code" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={discount > 0}
                  />
                  <Button type="button" onClick={handleApplyCoupon} disabled={couponLoading || discount > 0}>
                    {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
                {couponError && <p className="text-sm text-destructive">{couponError}</p>}
            </div>

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
