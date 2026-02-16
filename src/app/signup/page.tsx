
'use client';
import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Ticket, CheckCircle, XCircle, IndianRupee, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signupAndCreateOrder, validateCoupon, validateReferralCode } from './actions';
import { ClientOnly } from '@/components/ui/client-only';
import { useDebounce } from 'use-debounce';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'crypto'>('upi');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const plan = searchParams.get('plan');
  const price = searchParams.get('price');

  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  
  const [referralCode, setReferralCode] = useState('');
  const [debouncedReferralCode] = useDebounce(referralCode, 500);
  const [referralState, setReferralState] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [isReferralDiscountApplied, setIsReferralDiscountApplied] = useState(false);
  
  const [finalPrice, setFinalPrice] = useState(price ? parseFloat(price.replace(/,/g, '')) : 0);
  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0);
  const [referralDiscountAmount, setReferralDiscountAmount] = useState(0);
  const [cryptoDiscountAmount, setCryptoDiscountAmount] = useState(0);
  const [usdtAmount, setUsdtAmount] = useState(0);

  const originalPrice = price ? parseFloat(price.replace(/,/g, '')) : 0;
  const isTrialPlan = plan === '25K Try First Plan';

  useEffect(() => {
    const supabase = createClient();
    async function fetchPaymentDetails() {
      const { data, error } = await supabase.from('payment_details').select('*').eq('id', 1).single();
      if (data) {
        setPaymentDetails(data);
        if (!data.is_upi_enabled && data.is_crypto_enabled) {
          setPaymentMethod('crypto');
        }
      }
    }
    fetchPaymentDetails();
  }, []);

  useEffect(() => {
    const couponDiscount = (originalPrice * discountPercent) / 100;
    const priceAfterCoupon = originalPrice - couponDiscount;
    const referralDiscount = isReferralDiscountApplied ? priceAfterCoupon * 0.05 : 0;
    const priceAfterReferral = priceAfterCoupon - referralDiscount;
    const cryptoDiscount = paymentMethod === 'crypto' ? priceAfterReferral * 0.05 : 0;
    const newFinalPrice = priceAfterReferral - cryptoDiscount;

    setCouponDiscountAmount(couponDiscount);
    setReferralDiscountAmount(referralDiscount);
    setCryptoDiscountAmount(cryptoDiscount);
    setFinalPrice(newFinalPrice > 0 ? newFinalPrice : 0);
    
    if (paymentMethod === 'crypto' && paymentDetails?.usdt_to_inr_rate > 0) {
      setUsdtAmount(newFinalPrice / paymentDetails.usdt_to_inr_rate);
    }

  }, [price, discountPercent, originalPrice, isReferralDiscountApplied, paymentMethod, paymentDetails]);

   useEffect(() => {
    if (debouncedReferralCode) {
      setReferralState('loading');
      validateReferralCode(debouncedReferralCode).then(result => {
        if (result.success) {
          setReferralState('valid');
          setIsReferralDiscountApplied(true);
          toast({ title: 'Referral code applied!', description: 'You received an additional 5% discount.'});
        } else {
          setReferralState('invalid');
          setIsReferralDiscountApplied(false);
        }
      });
    } else {
      setReferralState('idle');
      setIsReferralDiscountApplied(false);
    }
  }, [debouncedReferralCode, toast]);

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
     if (paymentMethod === 'crypto') {
        const hash = (e.currentTarget.elements.namedItem('crypto_transaction_hash') as HTMLInputElement).value;
        if (!hash) {
            setError('Please enter the transaction hash after making the payment.');
            return;
        }
    }

    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    formData.append('plan_purchased', plan || '');
    formData.append('plan_price', String(originalPrice));
    formData.append('coupon_code', discountPercent > 0 ? couponCode : '');
    const totalDiscount = couponDiscountAmount + referralDiscountAmount + cryptoDiscountAmount;
    formData.append('discount_amount', String(totalDiscount));
    formData.append('final_amount_paid', String(finalPrice));
    formData.append('payment_method', paymentMethod);
    
    const result = await signupAndCreateOrder(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result.success) {
        if(paymentMethod === 'upi' && result.payment_url) {
            window.location.href = result.payment_url;
        } else {
            // For crypto, redirect to a success/pending page
            router.push(`/payment-success?order_id=${result.orderId}&method=crypto`);
        }
    } else {
        setError('Could not get payment URL. Please try again.');
        setIsLoading(false);
    }
  };

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
            
            {/* Payment Method Selection */}
            <Card>
                 <CardHeader>
                    <CardTitle>Choose Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                     <div className="grid grid-cols-2 gap-4">
                        <Button type="button" variant={paymentMethod === 'upi' ? 'default' : 'outline'} onClick={() => setPaymentMethod('upi')} disabled={!paymentDetails?.is_upi_enabled} className="h-16 flex-col gap-1">
                            <IndianRupee />
                            <span>UPI / Cards</span>
                        </Button>
                        <Button type="button" variant={paymentMethod === 'crypto' ? 'default' : 'outline'} onClick={() => setPaymentMethod('crypto')} disabled={!paymentDetails?.is_crypto_enabled} className="h-16 flex-col gap-1">
                             <div className="relative w-full flex justify-center items-center">
                                <Wallet />
                                <Badge variant="destructive" className="absolute -top-3 -right-2 text-xs">5% OFF</Badge>
                             </div>
                            <span>Crypto (USDT)</span>
                        </Button>
                    </div>
                     {paymentDetails && !paymentDetails.is_upi_enabled && (
                        <Alert variant="default" className="mt-4 text-center">
                            <AlertDescription>
                                UPI payments are currently unavailable. To pay via UPI, please{' '}
                                <Button asChild variant="link" className="p-1 h-auto">
                                    <a href="https://wa.me/9184213004817" target="_blank" rel="noopener noreferrer">
                                        contact us on WhatsApp
                                    </a>
                                </Button>
                                .
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {!isTrialPlan && (
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Ticket className="w-5 h-5 text-primary"/> Have a coupon?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                        <Input 
                            id="coupon"
                            name="coupon"
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
                    {couponDiscountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm text-green-600">
                            <p className="text-muted-foreground">Coupon "{couponCode}":</p>
                            <p>- ₹{couponDiscountAmount.toFixed(2)}</p>
                        </div>
                    )}
                    {referralDiscountAmount > 0 && (
                         <div className="flex justify-between items-center text-sm text-green-600">
                            <p className="text-muted-foreground">Referral Discount (5%):</p>
                            <p>- ₹{referralDiscountAmount.toFixed(2)}</p>
                        </div>
                    )}
                    {cryptoDiscountAmount > 0 && (
                         <div className="flex justify-between items-center text-sm text-green-600">
                            <p className="text-muted-foreground">Crypto Discount (5%):</p>
                            <p>- ₹{cryptoDiscountAmount.toFixed(2)}</p>
                        </div>
                    )}
                    <div className="flex justify-between items-center font-bold text-lg border-t pt-4 mt-4">
                        <p>Final Price to Pay:</p>
                        <p>₹{finalPrice.toFixed(2)}</p>
                    </div>
                     {paymentMethod === 'crypto' && (
                        <div className="text-center font-bold text-primary text-xl p-2 bg-primary/10 rounded-md">
                           ~ {usdtAmount.toFixed(2)} USDT
                        </div>
                    )}
                </CardContent>
            </Card>

            {paymentMethod === 'crypto' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Crypto Payment Instructions</CardTitle>
                        <CardDescription>Send exactly <span className="font-bold">{usdtAmount.toFixed(2)} USDT</span> to the address below. Only use the TRC20 network.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {paymentDetails?.crypto_qr_code_url && (
                             <div className="flex justify-center">
                                 <Image src={paymentDetails.crypto_qr_code_url} alt="Crypto QR Code" width={200} height={200} className="rounded-md border p-2 bg-white" />
                             </div>
                         )}
                        <div className="space-y-2">
                             <Label>USDT Wallet Address (TRC20)</Label>
                            <Input readOnly value={paymentDetails?.crypto_wallet_address || 'Loading...'}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="crypto_transaction_hash">Transaction Hash / ID</Label>
                            <Input id="crypto_transaction_hash" name="crypto_transaction_hash" placeholder="Enter the transaction hash here after payment" required/>
                             <p className="text-xs text-muted-foreground">This is required to verify your manual payment.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardHeader>
                    <CardTitle>Registration Details</CardTitle>
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
                        <Label htmlFor="mobile_number">Mobile Number</Label>
                        <Input id="mobile_number" name="mobile_number" type="tel" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="referral_code">Referral Code (Optional)</Label>
                        <p className="text-xs text-muted-foreground">Use a referral code to get an additional 5% discount!</p>
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

                    <div className="flex items-start space-x-2">
                        <Checkbox id="terms" onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
                        <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
                            When you register and create an account you acknowledge that you have read and accepted our <Link href="https://www.fundedstock.io/terms-and-conditions" target="_blank" className="underline hover:text-primary">terms and conditions</Link> and <Link href="https://www.fundedstock.io/privacy-policy" target="_blank" className="underline hover:text-primary">privacy policy</Link>.
                        </Label>
                    </div>


                    <Button type="submit" className="w-full" size="lg" disabled={isLoading || !termsAccepted}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (paymentMethod === 'upi' ? 'Proceed to Payment' : 'Submit & Verify Payment')}
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
