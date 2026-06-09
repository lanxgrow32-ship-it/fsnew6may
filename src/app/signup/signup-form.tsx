'use client';

import { useState, useActionState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle2, Wallet, Copy, Percent, Zap, IndianRupee, Timer, ShieldCheck } from 'lucide-react';
import { signupAndCreateOrder, validateCoupon, validateReferralCode } from './actions';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ClientOnly } from '@/components/ui/client-only';

export function SignupForm({ paymentSettings }: { paymentSettings: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const planParam = searchParams.get('plan') || '1L Instant Funding';
  const priceParam = parseFloat(searchParams.get('price')?.replace(/,/g, '') || '5999');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    password: '',
    referral_code: '',
    utr: '',
  });

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isCouponValidating, setIsCouponValidating] = useState(false);
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  
  const [showExitOffer, setShowExitOffer] = useState(false);
  const [extraBonusApplied, setExtraBonusApplied] = useState(false);

  const [state, formAction, isPending] = useActionState(signupAndCreateOrder, { error: null });

  useEffect(() => {
    if (state?.redirectUrl) {
        window.location.href = state.redirectUrl;
    }
  }, [state?.redirectUrl]);

  const handleExitIntent = useCallback(() => {
    if (!extraBonusApplied) {
      setShowExitOffer(true);
      window.history.pushState(null, '', window.location.href);
    } else {
      window.history.back();
    }
  }, [extraBonusApplied]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = handleExitIntent;
    return () => { window.onpopstate = null; };
  }, [handleExitIntent]);

  const applyExtraBonus = () => {
    setExtraBonusApplied(true);
    setShowExitOffer(false);
  };

  const finalPrice = Math.max(0, priceParam - discount - (extraBonusApplied ? (priceParam * 0.1) : 0));
  const isPassThenPay = planParam.toLowerCase().includes('passthenpay');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    setIsCouponValidating(true);
    const res = await validateCoupon(couponCode);
    if (res.discount) {
        const amount = (priceParam * res.discount) / 100;
        setDiscount(amount);
    } else {
        setDiscount(0);
    }
    setIsCouponValidating(false);
  };

  const handleValidateReferral = async () => {
      if (!formData.referral_code) return;
      const res = await validateReferralCode(formData.referral_code);
      setReferralValid(!!res.success);
  }

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Simplified Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight whitespace-nowrap">Complete Registration</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 1. Payment Details Section (QR First) */}
                    {paymentSettings?.active_payment_gateway === 'manual' && (
                        <Card className="border-primary/20">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">1. Payment Details</CardTitle>
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{planParam}</Badge>
                                </div>
                                <CardDescription>Scan QR and enter UTR to initiate setup.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col sm:flex-row items-center gap-6 bg-muted/30 rounded-lg p-4 border">
                                    <div className="bg-white p-2 rounded-md shrink-0 shadow-sm">
                                        <Image src={isPassThenPay ? paymentSettings.pay_later_qr_code_url : paymentSettings.qr_code_url} alt="UPI QR" width={140} height={140} />
                                    </div>
                                    <div className="space-y-4 w-full">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Payable Amount</Label>
                                            <p className="text-xl font-bold text-primary">₹{finalPrice.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">UPI ID</Label>
                                            <div className="flex items-center justify-between gap-2 bg-background p-2 rounded border">
                                                <p className="text-xs font-mono truncate">{isPassThenPay ? paymentSettings.pay_later_upi_id : paymentSettings.upi_id}</p>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(isPassThenPay ? paymentSettings.pay_later_upi_id : paymentSettings.upi_id)}><Copy className="h-3 w-3"/></Button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="utr" className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Transaction ID (UTR)</Label>
                                            <Input id="utr" name="utr" required placeholder="Enter 12-digit UTR" value={formData.utr} onChange={handleInputChange} className="h-10" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 2. Personal Information Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">2. Personal Information</CardTitle>
                            <CardDescription>Enter the details for your trading account.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input id="full_name" name="full_name" required value={formData.full_name} onChange={handleInputChange} placeholder="John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mobile_number">Mobile Number</Label>
                                    <Input id="mobile_number" name="mobile_number" required value={formData.mobile_number} onChange={handleInputChange} placeholder="10-digit number" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} placeholder="name@example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Account Password</Label>
                                <Input id="password" name="password" type="password" required value={formData.password} onChange={handleInputChange} placeholder="Min. 6 characters" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Offers & Coupons */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">3. Offers & Coupons</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Coupon Code</Label>
                                    <div className="flex gap-2">
                                        <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="SAVE10" className="uppercase" />
                                        <Button type="button" variant="outline" onClick={handleValidateCoupon} disabled={isCouponValidating}>Apply</Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Referral Code (Optional)</Label>
                                    <div className="flex gap-2">
                                        <Input name="referral_code" value={formData.referral_code} onChange={handleInputChange} placeholder="USER-1234" className="uppercase" />
                                        <Button type="button" variant="outline" onClick={handleValidateReferral}>Validate</Button>
                                    </div>
                                    {referralValid === true && <p className="text-[10px] text-green-500 font-bold mt-1">✓ Referral Valid</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Order Summary & Completion */}
                    <Card className="border-primary/20 bg-primary/[0.02] lg:sticky lg:top-24">
                        <CardHeader>
                            <CardTitle className="text-base">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Plan: {planParam}</span>
                                <span className="font-bold">₹{priceParam.toLocaleString('en-IN')}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span className="flex items-center gap-1"><Percent className="h-3 w-3"/> Coupon Applied</span>
                                    <span className="font-bold">- ₹{discount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {extraBonusApplied && (
                                 <div className="flex justify-between text-sm text-green-600">
                                    <span className="flex items-center gap-1"><Zap className="h-3 w-3"/> Extra Bonus (10%)</span>
                                    <span className="font-bold">- ₹{(priceParam * 0.1).toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between items-center pt-2">
                                <span className="font-bold">Total Due</span>
                                <span className="text-2xl font-bold text-primary">₹{finalPrice.toLocaleString('en-IN')}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <form action={formAction} className="w-full">
                                <input type="hidden" name="full_name" value={formData.full_name} />
                                <input type="hidden" name="email" value={formData.email} />
                                <input type="hidden" name="mobile_number" value={formData.mobile_number} />
                                <input type="hidden" name="password" value={formData.password} />
                                <input type="hidden" name="plan_purchased" value={planParam} />
                                <input type="hidden" name="referral_code" value={formData.referral_code} />
                                <input type="hidden" name="utr" value={formData.utr} />
                                <input type="hidden" name="plan_price" value={priceParam} />
                                <input type="hidden" name="coupon_code" value={couponCode} />
                                <input type="hidden" name="discount_amount" value={discount} />
                                <input type="hidden" name="final_amount_paid" value={finalPrice} />

                                <Button type="submit" disabled={isPending} className="w-full font-bold h-12 shadow-lg shadow-primary/20">
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><IndianRupee className="mr-2 h-4 w-4" /> Complete Registration</>}
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>

                    {state?.error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{state.error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="rounded-lg border p-4 bg-muted/10 space-y-3">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-green-500" />
                            <h3 className="font-bold text-sm">Security Assured</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Your registration is secured with 256-bit encryption. All transactions are verified manually to ensure system integrity.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <Dialog open={showExitOffer} onOpenChange={setShowExitOffer}>
        <DialogContent className="max-w-[280px] w-[calc(100%-2rem)] p-0 bg-[#0a0a0c] border-[#ff3333] shadow-[0_0_40px_rgba(239,68,68,0.4)] rounded-2xl overflow-hidden focus:outline-none [&>button]:hidden">
            <DialogHeader className="p-4 pb-2 text-center">
                <div className="mx-auto bg-[#ff3333]/10 w-fit p-2 rounded-full mb-3">
                    <Zap className="h-6 w-6 text-[#ff3333]" />
                </div>
                <DialogTitle className="text-lg font-black text-white tracking-tight">WAIT! SPECIAL GIFT.</DialogTitle>
                <DialogDescription className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Don't leave empty handed</DialogDescription>
            </DialogHeader>
            <div className="p-4 space-y-4">
                <div className="text-center py-1 border-y border-white/5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Exclusive Bonus</p>
                    <p className="text-2xl font-black text-primary animate-pulse mt-1">EXTRA 10% OFF</p>
                </div>
                
                <div className="bg-[#ff3333]/5 border border-[#ff3333]/20 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[#ff3333] animate-ping" />
                        <span className="text-[10px] font-black text-[#ff3333] uppercase">Only 3 Coupons Left</span>
                    </div>
                    <Timer className="h-3.5 w-3.5 text-[#ff3333]" />
                </div>

                <div className="space-y-2">
                    <Button onClick={applyExtraBonus} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-11 rounded-xl shadow-lg shadow-primary/20 text-xs">
                        CLAIM 10% BONUS NOW
                    </Button>
                    <button 
                        onClick={() => window.history.back()} 
                        className="w-full text-[10px] text-gray-600 font-bold uppercase hover:text-gray-400 transition-colors py-1"
                    >
                        No thanks, I'll pay full price later
                    </button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}