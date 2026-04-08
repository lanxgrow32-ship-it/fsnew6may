
'use client';
import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Ticket, CheckCircle, XCircle, ShieldAlert, Send, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signupAndCreateOrder, validateCoupon, validateReferralCode } from './actions';
import { useDebounce } from 'use-debounce';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';

export function SignupForm({ paymentSettings }: { paymentSettings: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

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

  const originalPrice = price ? parseFloat(price.replace(/,/g, '')) : 0;
  
  const isPayLaterPlan = plan?.toLowerCase().includes('passthenpay');
  const showCoupon = !isPayLaterPlan;

  const activeGateway = paymentSettings?.active_payment_gateway || 'lgpay';
  
  const manualPaymentDetails = isPayLaterPlan 
    ? { upi_id: paymentSettings?.pay_later_upi_id, qr_code_url: paymentSettings?.pay_later_qr_code_url }
    : { upi_id: paymentSettings?.upi_id, qr_code_url: paymentSettings?.qr_code_url };


  useEffect(() => {
    const couponDiscount = (originalPrice * discountPercent) / 100;
    const priceAfterCoupon = originalPrice - couponDiscount;
    const referralDiscount = isReferralDiscountApplied ? priceAfterCoupon * 0.05 : 0;
    const newFinalPrice = priceAfterCoupon - referralDiscount;

    setCouponDiscountAmount(couponDiscount);
    setReferralDiscountAmount(referralDiscount);
    
    const roundedUpPrice = Math.ceil(newFinalPrice > 0 ? newFinalPrice : 0);
    setFinalPrice(roundedUpPrice);

  }, [price, discountPercent, originalPrice, isReferralDiscountApplied]);

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
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "UPI ID copied to clipboard" });
  }

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
    const totalDiscount = couponDiscountAmount + referralDiscountAmount;
    formData.append('discount_amount', String(totalDiscount));
    formData.append('final_amount_paid', String(finalPrice));
    
    const result = await signupAndCreateOrder(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.redirectUrl) {
      window.location.href = result.redirectUrl;
    } else {
      // This handles the manual flow redirect, which is done on the server.
      // A successful manual flow doesn't return a URL, so we just wait for the page to change.
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
             <div className="space-y-6">
                 {showCoupon && (
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
                        <div className="flex justify-between items-center font-bold text-lg border-t pt-4 mt-4">
                            <p>Final Price to Pay:</p>
                            <p>₹{finalPrice.toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>

                {activeGateway === 'manual' && (
                    <Card className="bg-card/90">
                            <CardHeader>
                            <CardTitle>Step 1: Complete Payment</CardTitle>
                            <CardDescription>Scan the QR or use the UPI ID to pay. Then enter the transaction ID below.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {manualPaymentDetails.qr_code_url ? (
                                <div className="mx-auto w-fit p-2 bg-white rounded-md">
                                    <Image src={manualPaymentDetails.qr_code_url} alt="UPI QR Code" width={180} height={180} />
                                </div>
                            ) : (
                                <p className="text-sm text-center text-muted-foreground">QR Code not available.</p>
                            )}
                            {manualPaymentDetails.upi_id && (
                                <div>
                                    <Label className="text-muted-foreground">Or pay to this UPI ID:</Label>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <p className="font-mono text-lg truncate">{manualPaymentDetails.upi_id}</p>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => copyToClipboard(manualPaymentDetails.upi_id)}>
                                            <Copy className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2 pt-4">
                                <Label htmlFor="utr">Enter UTR / Transaction ID</Label>
                                <Input id="utr" name="utr" placeholder="Enter the 12-digit transaction ID" required />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
            
            <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardHeader>
                    <CardTitle>{activeGateway === 'manual' ? "Step 2: Your Details" : "Your Details"}</CardTitle>
                    <CardDescription>Enter your registration details to create your account.</CardDescription>
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

                    {activeGateway === 'lgpay' && (
                        <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/50 text-amber-200">
                            <ShieldAlert className="h-4 w-4 !text-amber-400" />
                            <AlertTitle className="text-amber-300 font-bold">Important Payment Instructions</AlertTitle>
                            <AlertDescription className="text-amber-300/80 space-y-2 mt-2">
                               <p>• Please complete the payment on the gateway page within the given time limit.</p>
                               <p>• After payment, you have to submit the UTR in the time limit also. After that, your payment will be successful.</p>
                            </AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" className="w-full" size="lg" disabled={isLoading || !termsAccepted}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {activeGateway === 'manual' ? <><Send className="mr-2 h-4 w-4"/> Submit & Create Account</> : 'Proceed to Payment'}
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
