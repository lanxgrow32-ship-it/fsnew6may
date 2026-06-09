'use client';

import { useState, useActionState, useEffect, useTransition, useCallback } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ClientOnly } from '@/components/ui/client-only';

export function SignupForm({ paymentSettings }: { paymentSettings: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const planParam = searchParams.get('plan') || '1L Instant Funding';
  const priceParam = parseFloat(searchParams.get('price')?.replace(/,/g, '') || '5999');

  const [step, setStep] = useState(1);
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
  
  // Exit Intent / Extra Bonus State
  const [showExitOffer, setShowExitOffer] = useState(false);
  const [extraBonusApplied, setExtraBonusApplied] = useState(false);

  const [state, formAction, isPending] = useActionState(signupAndCreateOrder, { error: null });

  // Handle gateway redirects
  useEffect(() => {
    if (state?.redirectUrl) {
        window.location.href = state.redirectUrl;
    }
  }, [state?.redirectUrl]);

  // Back Button Interception for Exit Intent
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
    <main className="min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden pb-20">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      
      <div className="container mx-auto px-4 pt-12 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="bg-black/20 border-white/10 rounded-full" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter">Registration</h1>
                        <p className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Complete your evaluation setup</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl">
                    <div>
                        <p className="text-[10px] text-primary/70 font-bold uppercase tracking-widest">Selected Plan</p>
                        <p className="text-lg font-black text-white">{planParam}</p>
                    </div>
                    <div className="h-10 w-px bg-primary/20 mx-2" />
                    <div>
                        <p className="text-[10px] text-primary/70 font-bold uppercase tracking-widest">Starting Price</p>
                        <p className="text-lg font-black text-primary">₹{priceParam.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-white/5 backdrop-blur-xl border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                        <CardHeader className="bg-white/[0.02] border-b border-white/5">
                            <CardTitle className="text-white flex items-center gap-2">
                                <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black">1</span>
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name" className="text-gray-400 font-bold text-xs uppercase">Full Name</Label>
                                    <Input id="full_name" name="full_name" required value={formData.full_name} onChange={handleInputChange} className="bg-black/20 border-white/10 text-white h-12" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mobile_number" className="text-gray-400 font-bold text-xs uppercase">Mobile Number</Label>
                                    <Input id="mobile_number" name="mobile_number" required value={formData.mobile_number} onChange={handleInputChange} className="bg-black/20 border-white/10 text-white h-12" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-400 font-bold text-xs uppercase">Email Address</Label>
                                <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} className="bg-black/20 border-white/10 text-white h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" title="password" className="text-gray-400 font-bold text-xs uppercase">Account Password</Label>
                                <Input id="password" name="password" type="password" required value={formData.password} onChange={handleInputChange} className="bg-black/20 border-white/10 text-white h-12" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 backdrop-blur-xl border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                        <CardHeader className="bg-white/[0.02] border-b border-white/5">
                            <CardTitle className="text-white flex items-center gap-2">
                                <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black">2</span>
                                Payment & Offers
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                             <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-gray-400 font-bold text-xs uppercase">Coupon Code</Label>
                                    <div className="flex gap-2">
                                        <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="PROMO50" className="bg-black/20 border-white/10 text-white h-12 uppercase" />
                                        <Button type="button" onClick={handleValidateCoupon} disabled={isCouponValidating} className="h-12 bg-white/10 hover:bg-white/20 border border-white/10 text-white">Apply</Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-400 font-bold text-xs uppercase">Referral Code (Optional)</Label>
                                    <div className="flex gap-2">
                                        <Input name="referral_code" value={formData.referral_code} onChange={handleInputChange} placeholder="USER-1234" className="bg-black/20 border-white/10 text-white h-12 uppercase" />
                                        <Button type="button" onClick={handleValidateReferral} className="h-12 bg-white/10 hover:bg-white/20 border border-white/10 text-white">Validate</Button>
                                    </div>
                                    {referralValid === true && <p className="text-xs text-green-400 font-bold mt-1">✓ Referral Code Valid</p>}
                                </div>
                            </div>

                            {paymentSettings?.active_payment_gateway === 'manual' && (
                                <div className="space-y-6 pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Wallet className="h-5 w-5 text-primary" />
                                        <h3 className="font-bold text-white">Manual Payment Details</h3>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-center gap-8 bg-black/40 rounded-2xl p-6 border border-white/5">
                                         <div className="bg-white p-2 rounded-xl shrink-0">
                                            <Image src={isPassThenPay ? paymentSettings.pay_later_qr_code_url : paymentSettings.qr_code_url} alt="UPI QR" width={160} height={160} />
                                        </div>
                                        <div className="space-y-4 w-full">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">UPI ID</Label>
                                                <div className="flex items-center justify-between gap-2 bg-black/20 p-3 rounded-lg border border-white/5">
                                                    <p className="text-sm font-mono text-white truncate">{isPassThenPay ? paymentSettings.pay_later_upi_id : paymentSettings.upi_id}</p>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-gray-400" onClick={() => copyToClipboard(isPassThenPay ? paymentSettings.pay_later_upi_id : paymentSettings.upi_id)}><Copy className="h-4 w-4"/></Button>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="utr" className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Transaction ID (UTR)</Label>
                                                <Input id="utr" name="utr" required placeholder="Enter 12-digit UTR" value={formData.utr} onChange={handleInputChange} className="bg-black/20 border-white/10 text-white h-12" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="bg-primary/5 border-primary/20 rounded-3xl overflow-hidden shadow-2xl relative">
                        {extraBonusApplied && <div className="absolute top-0 right-0 p-2"><Badge className="bg-green-600 text-[10px] font-black uppercase">Bonus Applied</Badge></div>}
                        <CardHeader className="border-b border-primary/10">
                            <CardTitle className="text-white text-lg">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Plan Price</span>
                                <span className="text-white font-bold">₹{priceParam.toLocaleString('en-IN')}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-green-400">
                                    <span className="flex items-center gap-1"><Percent className="h-3 w-3"/> Coupon Applied</span>
                                    <span className="font-bold">- ₹{discount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {extraBonusApplied && (
                                 <div className="flex justify-between text-sm text-green-400">
                                    <span className="flex items-center gap-1"><Zap className="h-3 w-3"/> Extra Bonus (10%)</span>
                                    <span className="font-bold">- ₹{(priceParam * 0.1).toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <Separator className="bg-primary/10" />
                            <div className="flex justify-between items-center">
                                <span className="text-white font-black text-lg">Total Due</span>
                                <span className="text-primary text-3xl font-black">₹{finalPrice.toLocaleString('en-IN')}</span>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-primary/10 border-t border-primary/10 p-6">
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

                                <Button type="submit" disabled={isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">
                                    {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><IndianRupee className="mr-2 h-5 w-5" /> COMPLETE PAYMENT</>}
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>

                    {state?.error && (
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 rounded-2xl">
                            <AlertTitle className="font-bold">Error</AlertTitle>
                            <AlertDescription className="text-sm font-medium">{state.error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-green-400" />
                            <h3 className="font-bold text-white text-sm">Security Assured</h3>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Your registration is secured with 256-bit encryption. All funds are held in escrow during the verification period.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Exit Intent Dialog (Zero Escape Loop) */}
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