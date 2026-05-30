'use client';
import { useState, Suspense, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Ticket, CheckCircle, XCircle, ShieldAlert, Send, Copy, Sparkles, Zap, Timer, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signupAndCreateOrder, validateCoupon, validateReferralCode } from './actions';
import { useDebounce } from 'use-debounce';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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
  const [fomoDiscountAmount, setFomoDiscountAmount] = useState(0);
  const [isFomoApplied, setIsFomoApplied] = useState(false);

  // FOMO Dialog States
  const [showFomo, setShowFomo] = useState(false);
  const [fomoSlots, setFomoSlots] = useState(7);
  const [timeLeft, setTimeLeft] = useState(899); // 14:59 in seconds

  const popStateRef = useRef<any>(null);

  const originalPrice = price ? parseFloat(price.replace(/,/g, '')) : 0;
  
  const isPayLaterPlan = plan?.toLowerCase().includes('passthenpay');
  const showCoupon = !isPayLaterPlan;

  const activeGateway = paymentSettings?.active_payment_gateway || 'lgpay';
  
  const manualPaymentDetails = isPayLaterPlan 
    ? { upi_id: paymentSettings?.pay_later_upi_id, qr_code_url: paymentSettings?.pay_later_qr_code_url }
    : { upi_id: paymentSettings?.upi_id, qr_code_url: paymentSettings?.qr_code_url };

  // BACK BUTTON INTERCEPTION LOOP
  useEffect(() => {
    // Initial trap state
    window.history.pushState({ fomoTrap: true }, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // If the user hasn't accepted the discount, keep trapping them
      if (!isFomoApplied) {
        // Re-push immediately to keep the back-button trap active
        window.history.pushState({ fomoTrap: true }, '', window.location.href);
        // Randomize scarcity every time they try to leave
        setFomoSlots(Math.floor(Math.random() * 5) + 2);
        setShowFomo(true);
      }
    };

    popStateRef.current = handlePopState;
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', popStateRef.current);
  }, [isFomoApplied]);

  // FOMO Timer logic
  useEffect(() => {
    if (!showFomo) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showFomo]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const applyFomoDiscount = () => {
    setIsFomoApplied(true);
    setShowFomo(false);
    toast({
        title: "Bonus Applied! 🎉",
        description: "Extra 10% discount added to your summary.",
    });
  };

  const handleReallyExit = () => {
    setShowFomo(false);
    // Remove the listener so we can actually navigate back
    window.removeEventListener('popstate', popStateRef.current);
    // Go back once to pricing or previous page
    router.back();
  };

  useEffect(() => {
    const couponDiscount = (originalPrice * discountPercent) / 100;
    const priceAfterCoupon = originalPrice - couponDiscount;
    const referralDiscount = isReferralDiscountApplied ? priceAfterCoupon * 0.05 : 0;
    const priceAfterReferral = priceAfterCoupon - referralDiscount;
    
    const fomoDiscount = isFomoApplied ? priceAfterReferral * 0.10 : 0;
    const newFinalPrice = priceAfterReferral - fomoDiscount;

    setCouponDiscountAmount(couponDiscount);
    setReferralDiscountAmount(referralDiscount);
    setFomoDiscountAmount(fomoDiscount);
    
    const roundedUpPrice = Math.ceil(newFinalPrice > 0 ? newFinalPrice : 0);
    setFinalPrice(roundedUpPrice);

  }, [price, discountPercent, originalPrice, isReferralDiscountApplied, isFomoApplied]);

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
    formData.append('coupon_code', discountPercent > 0 ? couponCode : (isFomoApplied ? 'VIP-EXIT-OFFER' : ''));
    const totalDiscount = couponDiscountAmount + referralDiscountAmount + fomoDiscountAmount;
    formData.append('discount_amount', String(totalDiscount));
    formData.append('final_amount_paid', String(finalPrice));
    
    const result = await signupAndCreateOrder(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.redirectUrl) {
      window.location.href = result.redirectUrl;
    }
  };

  return (
    <main className="flex min-h-screen items-start justify-center bg-background p-4 md:py-12 relative font-poppins">
      
      {/* PREMIUM ULTRA-COMPACT FOMO EXIT DIALOG - ZERO ESCAPE */}
      <Dialog open={showFomo} onOpenChange={setShowFomo}>
        <DialogContent 
          className="w-[calc(100%-2rem)] sm:max-w-[280px] bg-[#050505] border-[#ff4d4d] border-2 p-0 overflow-hidden rounded-3xl shadow-[0_0_40px_rgba(255,77,77,0.3)] backdrop-blur-2xl [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
            <div className="p-5 text-center space-y-4">
                <div className="mx-auto bg-red-500/10 rounded-full p-2 w-fit border border-red-500/20">
                    <Sparkles className="h-5 w-5 text-red-400" />
                </div>
                
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-base font-black text-white tracking-tighter uppercase text-center">WAIT! DON'T MISS THIS.</DialogTitle>
                    <DialogDescription className="text-gray-500 text-[8px] font-black uppercase tracking-[0.2em] text-center">Exclusive Bonus Detected</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <p className="text-gray-400 text-[10px] leading-relaxed px-2">
                        We've unlocked a special <span className="text-white font-bold underline decoration-red-500">Final Offer</span> just for you.
                    </p>
                    
                    <div className="bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-xl p-4 space-y-1 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
                        <div className="text-2xl font-black text-[#ffcc00] tracking-tighter drop-shadow-[0_0_10px_rgba(255,204,0,0.3)] relative z-10">EXTRA 10% OFF</div>
                        <div className="flex items-center justify-center gap-1.5 relative z-10">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                            </span>
                            <p className="text-red-400 text-[8px] font-black uppercase tracking-widest">Expires in {formatTime(timeLeft)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-white/5 rounded-full w-fit mx-auto border border-white/10 shadow-inner">
                    <Timer className="h-2.5 w-2.5 text-red-500" />
                    <p className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">
                        ONLY <span className="text-white font-black px-1.5 bg-red-500/20 rounded-sm ml-0.5">{fomoSlots} COUPONS</span> LEFT
                    </p>
                </div>

                <div className="space-y-3 pt-1">
                    <Button onClick={applyFomoDiscount} className="w-full h-10 text-[11px] font-black bg-[#ffcc00] hover:bg-[#ffdb4d] text-black rounded-xl shadow-lg transition-all transform active:scale-95 uppercase tracking-tight">
                        Apply Extra 10% Now
                    </Button>
                    <button 
                        onClick={handleReallyExit} 
                        className="text-gray-600 text-[8px] font-bold uppercase tracking-widest hover:text-gray-400 transition-colors block w-full text-center"
                    >
                        No, I will purchase later
                    </button>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-bold mt-4 text-primary">Create an Account</h1>
            <p className="text-muted-foreground text-sm font-medium">
                 {plan && price ? `You are purchasing the ${plan} plan.` : 'Enter your details to get started.'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-6">
                 {showCoupon && (
                    <Card className="bg-card/80 backdrop-blur-sm border-border rounded-2xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2"><Ticket className="w-4 h-4 text-primary"/> Have a coupon?</CardTitle>
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
                                className="bg-black/20 border-white/10"
                            />
                            <Button type="button" onClick={handleApplyCoupon} disabled={couponLoading || discountPercent > 0} className="rounded-xl">
                                {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                            </Button>
                            </div>
                            {couponError && <p className="text-xs text-destructive font-medium mt-2">{couponError}</p>}
                        </CardContent>
                    </Card>
                )}

                <Card className="bg-card/80 backdrop-blur-sm border-border relative overflow-hidden rounded-2xl">
                    {isFomoApplied && <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter z-10 animate-pulse">VIP Exit Bonus</div>}
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-muted-foreground font-medium">Plan Price:</p>
                            <p className="font-semibold">₹{originalPrice.toFixed(2)}</p>
                        </div>
                        {couponDiscountAmount > 0 && (
                            <div className="flex justify-between items-center text-xs text-green-400 font-bold">
                                <p className="text-muted-foreground font-medium uppercase tracking-tighter">Coupon "{couponCode.toUpperCase()}":</p>
                                <p>- ₹{couponDiscountAmount.toFixed(2)}</p>
                            </div>
                        )}
                        {referralDiscountAmount > 0 && (
                            <div className="flex justify-between items-center text-xs text-green-400 font-bold">
                                <p className="text-muted-foreground font-medium uppercase tracking-tighter">Referral Bonus (5%):</p>
                                <p>- ₹{referralDiscountAmount.toFixed(2)}</p>
                            </div>
                        )}
                        {fomoDiscountAmount > 0 && (
                             <div className="flex justify-between items-center text-xs text-primary font-black">
                                <p className="flex items-center gap-1 uppercase tracking-tighter"><Zap className="h-3 w-3"/> VIP Exit Discount (10%):</p>
                                <p>- ₹{fomoDiscountAmount.toFixed(2)}</p>
                            </div>
                        )}
                        <div className="flex justify-between items-center font-black text-xl border-t border-white/5 pt-4 mt-4">
                            <p className="uppercase tracking-tighter">Total Due:</p>
                            <p className={cn(isFomoApplied ? "text-primary" : "text-white")}>₹{finalPrice.toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>

                {activeGateway === 'manual' && (
                    <Card className="bg-card/90 rounded-2xl">
                            <CardHeader>
                            <CardTitle className="text-base">Step 1: Complete Payment</CardTitle>
                            <CardDescription className="text-xs">Scan the QR or use the UPI ID to pay. Then enter the transaction ID below.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {manualPaymentDetails.qr_code_url ? (
                                <div className="mx-auto w-fit p-3 bg-white rounded-2xl shadow-2xl">
                                    <Image src={manualPaymentDetails.qr_code_url} alt="UPI QR Code" width={180} height={180} className="rounded-lg" />
                                </div>
                            ) : (
                                <p className="text-sm text-center text-muted-foreground">QR Code not available.</p>
                            )}
                            {manualPaymentDetails.upi_id && (
                                <div className="text-center space-y-2">
                                    <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">UPI ID</Label>
                                    <div className="flex items-center justify-center gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                                        <p className="font-mono text-sm text-gray-300 truncate">{manualPaymentDetails.upi_id}</p>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10" onClick={() => copyToClipboard(manualPaymentDetails.upi_id)}>
                                            <Copy className="h-3.5 w-3.5"/>
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2 pt-4 border-t border-white/5">
                                <Label htmlFor="utr" className="text-xs font-bold uppercase tracking-widest text-gray-500">Transaction ID (UTR)</Label>
                                <Input id="utr" name="utr" placeholder="Enter the 12-digit transaction ID" required className="bg-black/50 border-white/10 h-12 rounded-xl" />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
            
            <Card className="bg-card/80 backdrop-blur-sm border-border rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base">{activeGateway === 'manual' ? "Step 2: Your Details" : "Your Details"}</CardTitle>
                    <CardDescription className="text-xs">Enter your registration details to create your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {error && <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-xs py-2"><AlertDescription>{error}</AlertDescription></Alert>}

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="full_name" className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Full Name</Label>
                            <Input id="full_name" name="full_name" required className="bg-black/20 border-white/10" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="mobile_number" className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Mobile Number</Label>
                            <Input id="mobile_number" name="mobile_number" type="tel" required className="bg-black/20 border-white/10" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="email" className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Email Address</Label>
                        <Input id="email" name="email" type="email" required className="bg-black/20 border-white/10" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="password" className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Login Password</Label>
                        <Input id="password" name="password" type="password" required className="bg-black/20 border-white/10" />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="referral_code" className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Referral Code (Optional)</Label>
                        <div className="relative">
                            <Input 
                                id="referral_code" 
                                name="referral_code" 
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value)}
                                placeholder="Enter code for 5% off" 
                                className="bg-black/20 border-white/10 pr-10"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {referralState === 'loading' && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
                                {referralState === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {referralState === 'invalid' && <XCircle className="h-4 w-4 text-destructive" />}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start space-x-2 pt-2">
                        <Checkbox id="terms" onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} className="mt-1" />
                        <Label htmlFor="terms" className="text-[10px] leading-relaxed font-medium text-muted-foreground">
                            I acknowledge that I have read and accepted the <Link href="https://www.fundedstock.io/terms-and-conditions" target="_blank" className="underline hover:text-primary">terms and conditions</Link> and <Link href="https://www.fundedstock.io/privacy-policy" target="_blank" className="underline hover:text-primary">privacy policy</Link>.
                        </Label>
                    </div>

                    {activeGateway === 'lgpay' && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                            <p className="text-[9px] text-amber-300 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1"><ShieldAlert className="h-3 w-3" /> Payment Notice</p>
                            <p className="text-[9px] text-amber-200/70 leading-relaxed">Please complete payment and submit UTR on the gateway page within the time limit to avoid activation delays.</p>
                        </div>
                    )}

                    <Button type="submit" className={cn("w-full h-14 text-sm font-black transition-all rounded-2xl uppercase tracking-widest", isFomoApplied ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 border-b-4 border-primary-foreground/10" : "")} disabled={isLoading || !termsAccepted}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {activeGateway === 'manual' ? (
                            <><Send className="mr-2 h-4 w-4"/> Complete Registration</>
                        ) : (
                            isFomoApplied ? `Pay Final ₹${finalPrice.toFixed(0)} Now` : 'Proceed to Payment'
                        )}
                    </Button>
                    <div className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest pt-2">
                        Already registered?{' '}
                        <Link href="/login" className="text-primary hover:underline">
                        Login to Portal
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </form>

      </div>
    </main>
  );
}
