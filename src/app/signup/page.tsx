
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
import { Loader2, Ticket, Download, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signup, validateCoupon, validateReferralCode } from './actions';
import { ClientOnly } from '@/components/ui/client-only';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from 'use-debounce';


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
  
  const [referralCode, setReferralCode] = useState('');
  const [debouncedReferralCode] = useDebounce(referralCode, 500);
  const [referralState, setReferralState] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');


  const [paymentDetails, setPaymentDetails] = useState<{ upi_id: string; qr_code_url: string; } | null>(null);
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(true);

  const originalPrice = price ? parseFloat(price.replace(/,/g, '')) : 0;

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
     const discountValue = (originalPrice * discountPercent) / 100;
     const newFinalPrice = originalPrice - discountValue;
     setDiscountAmount(discountValue);
     setFinalPrice(newFinalPrice > 0 ? newFinalPrice : 0);
  }, [price, discountPercent, originalPrice]);

   useEffect(() => {
    if (debouncedReferralCode) {
      setReferralState('loading');
      validateReferralCode(debouncedReferralCode).then(result => {
        if (result.success) {
          setReferralState('valid');
        } else {
          setReferralState('invalid');
        }
      });
    } else {
      setReferralState('idle');
    }
  }, [debouncedReferralCode]);


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
    if (referralState === 'invalid') {
        setError('The entered referral code is not valid. Please remove it or enter a valid one.');
        return;
    }
    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('plan_purchased', plan || '');
    formData.append('plan_price', String(originalPrice));
    formData.append('coupon_code', discountPercent > 0 ? couponCode : '');
    formData.append('discount_amount', String(discountAmount));
    formData.append('final_amount_paid', String(finalPrice));
    
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
    <main className="flex min-h-screen items-start justify-center bg-background p-4 md:py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-bold mt-4 text-primary">Create an Account</h1>
            <p className="text-muted-foreground">
                 {plan && price ? `You are purchasing the ${plan} plan.` : 'Enter your details to get started.'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Ticket className="w-5 h-5 text-primary"/> Have a coupon?</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                    <Input 
                        id="coupon"
                        name="coupon_code"
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
                    <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">Plan Price:</p>
                        <p>₹{originalPrice.toFixed(2)}</p>
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

            <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardHeader>
                    <CardTitle>Registration Details</CardTitle>
                    <CardDescription>Enter your details below to create your account. After payment, enter the UPI transaction ID to submit your application for approval.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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

                    <div className="space-y-2">
                        <Label htmlFor="referral_code">Referral Code (Optional)</Label>
                        <div className="relative">
                            <Input 
                                id="referral_code" 
                                name="referral_code" 
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value)}
                                placeholder="Enter referral code" 
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {referralState === 'loading' && <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />}
                                {referralState === 'valid' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                {referralState === 'invalid' && <XCircle className="h-5 w-5 text-destructive" />}
                            </div>
                        </div>
                        {referralState === 'invalid' && <p className="text-sm text-destructive mt-1">This referral code is not valid.</p>}
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
                </CardContent>
            </Card>
        </form>

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
