
'use client';
import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Ticket, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signup, validateCoupon } from './actions';
import { ClientOnly } from '@/components/ui/client-only';
import { Skeleton } from '@/components/ui/skeleton';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = searchParams.get('plan');
  const price = searchParams.get('price');

  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [finalPrice, setFinalPrice] = useState(price ? parseFloat(price.replace(/,/g, '')) : 0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [paymentDetails, setPaymentDetails] = useState<{ upi_id: string; qr_code_url: string; } | null>(null);
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      setPaymentDetailsLoading(true);
      const { data, error } = await supabase
        .from('payment_details')
        .select('upi_id, qr_code_url')
        .eq('id', 1)
        .single();
      
      if (data) {
        setPaymentDetails(data);
      }
      setPaymentDetailsLoading(false);
    };
    fetchPaymentDetails();
  }, [supabase]);


  useEffect(() => {
     const originalPrice = price ? parseFloat(price.replace(/,/g, '')) : 0;
     const discountValue = (originalPrice * discountPercent) / 100;
     const newFinalPrice = originalPrice - discountValue;
     setDiscountAmount(discountValue);
     setFinalPrice(newFinalPrice > 0 ? newFinalPrice : 0);
  }, [price, discountPercent]);

    const handleDownload = async () => {
        if (!paymentDetails?.qr_code_url) return;

        try {
            const response = await fetch(paymentDetails.qr_code_url);
            if (!response.ok) throw new Error('Network response was not ok.');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'payment-qr-code.png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            toast({
                title: "Download Failed",
                description: "Could not download the QR code. Please try again or take a screenshot.",
                variant: "destructive",
            });
        }
    };

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
      setDiscountPercent(0);
    } else if (result.discount) {
      setDiscountPercent(result.discount);
      toast({ title: 'Coupon Applied!', description: `You received a ${result.discount}% discount.`});
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

  const PaymentDetailsSkeleton = () => (
    <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardHeader>
            <CardTitle className="text-lg">Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-40 w-40 mx-auto" />
        </CardContent>
    </Card>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-bold mt-4">Create an Account</h1>
            <p className="text-muted-foreground">
                 {plan && price ? `You are purchasing the ${plan} plan.` : 'Enter your details to get started.'}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8 gap-4">
            <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardHeader>
                    <CardTitle>Registration Details</CardTitle>
                </CardHeader>
                <CardContent>
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
                        <Input id="transaction_id" name="transaction_id" required placeholder="Enter the ID from your payment app" />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit for Approval
                    </Button>
                    <div className="text-center text-sm text-muted-foreground pt-2">
                        Already have an account?{' '}
                        <Link href="/login" className="font-semibold text-primary hover:underline">
                        Login
                        </Link>
                    </div>
                </form>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader>
                        <CardTitle className="text-lg">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-muted-foreground">Plan Price:</p>
                            <p>₹{price}</p>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between items-center text-sm text-green-600">
                            <p className="text-muted-foreground">Coupon Discount ({discountPercent}%):</p>
                            <p>- ₹{discountAmount.toFixed(2)}</p>
                            </div>
                        )}
                        <div className="flex justify-between items-center font-bold text-lg border-t pt-4 mt-4">
                            <p>Final Price to Pay:</p>
                            <p>₹{finalPrice.toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>
                 {paymentDetailsLoading ? <PaymentDetailsSkeleton /> : (
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                      <CardHeader>
                          <CardTitle className="text-lg">Payment Details</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center space-y-4">
                           <p className="font-semibold text-xl">UPI ID: {paymentDetails?.upi_id || 'Not available'}</p>
                           <p className="text-sm text-muted-foreground">Scan the QR code or use the UPI ID above and pay <span className="font-bold">₹{finalPrice.toFixed(2)}</span></p>
                           {paymentDetails?.qr_code_url && (
                             <div className="flex flex-col items-center gap-2">
                               <Image src={paymentDetails.qr_code_url} alt="Scan to pay" width={160} height={160} className="rounded-md" />
                                <Button variant="ghost" size="sm" onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download QR
                                </Button>
                             </div>
                           )}
                      </CardContent>
                  </Card>
                 )}

                 <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Ticket className="w-5 h-5 text-primary"/> Have a coupon?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                        <Input 
                            id="coupon" 
                            placeholder="Enter coupon code" 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            disabled={discountPercent > 0}
                        />
                        <Button type="button" onClick={handleApplyCoupon} disabled={couponLoading || discountPercent > 0}>
                            {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                        </Button>
                        </div>
                        {couponError && <p className="text-sm text-destructive mt-2">{couponError}</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </main>
  );
}


export default function SignupPage() {
  return (
    <div className="dark-theme">
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}>
          <ClientOnly>
              <SignupForm />
          </ClientOnly>
      </Suspense>
    </div>
  )
}
