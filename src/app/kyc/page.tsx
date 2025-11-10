
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitKyc } from './actions';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

const tradingStyleOptions = [
    { id: 'swing', label: 'Swing' },
    { id: 'intraday', label: 'Intraday' },
    { id: 'options_selling', label: 'Options Selling' },
    { id: 'options_buying', label: 'Options Buying' },
    { id: 'futures', label: 'Futures' },
    { id: 'scalping', label: 'Scalping' },
]

export default function KycPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    const result = await submitKyc(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      toast({ title: 'KYC Submitted', description: 'Your documents are now under review.' });
      router.push('/welcome');
    }
  };

  return (
    <main className="flex min-h-screen items-start justify-center p-4 md:p-8 bg-muted/40">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">KYC Verification</CardTitle>
          <CardDescription>
            Please fill out the form below to complete your verification.
            All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            
            <div className="space-y-6 border-b pb-8">
                <h3 className="font-semibold text-lg">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name (as per PAN) *</Label>
                        <Input id="full_name" name="full_name" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input id="email" name="email" type="email" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mobile_number">Mobile Number *</Label>
                        <Input id="mobile_number" name="mobile_number" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="city_state">City & State *</Label>
                        <Input id="city_state" name="city_state" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pan_number">PAN Card Number *</Label>
                        <Input id="pan_number" name="pan_number" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aadhar_number">Aadhar Card Number *</Label>
                        <Input id="aadhar_number" name="aadhar_number" required />
                    </div>
                </div>
            </div>

            <div className="space-y-6 border-b pb-8">
                <h3 className="font-semibold text-lg">Document Upload</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="pan_card">Upload PAN Card *</Label>
                        <Input id="pan_card" name="pan_card" type="file" required accept="image/*" />
                        <p className="text-xs text-muted-foreground">Max 10 MB.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aadhar_card">Upload Aadhar Card *</Label>
                        <Input id="aadhar_card" name="aadhar_card" type="file" required accept="image/*"/>
                        <p className="text-xs text-muted-foreground">Max 10 MB.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="selfie">Submit Selfie With Your Aadhar Card *</Label>
                        <Input id="selfie" name="selfie" type="file" required accept="image/*"/>
                        <p className="text-xs text-muted-foreground">Max 10 MB.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6 border-b pb-8">
                <h3 className="font-semibold text-lg">Trading Background</h3>
                 <div className="space-y-4">
                    <Label>Have you traded in a Prop Firm before? *</Label>
                    <RadioGroup name="traded_before" required className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="traded_yes" />
                            <Label htmlFor="traded_yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="traded_no" />
                            <Label htmlFor="traded_no">No</Label>
                        </div>
                    </RadioGroup>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="trading_experience">Trading Experience (in brief) *</Label>
                    <Textarea id="trading_experience" name="trading_experience" required />
                </div>
                <div className="space-y-4">
                    <Label>Preferred Trading Style *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {tradingStyleOptions.map(style => (
                            <div key={style.id} className="flex items-center space-x-2">
                                <Checkbox id={style.id} name="trading_style" value={style.id} />
                                <Label htmlFor={style.id}>{style.label}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="comments">Any Comments / Special Notes</Label>
                    <Textarea id="comments" name="comments" />
                </div>
            </div>

            <div className="space-y-6 rounded-md border p-6">
                 <h3 className="font-semibold text-lg">Agreements</h3>
                 <div className="space-y-4">
                    <Label>Are You Comfortable With Daily and Overall Drawdown Rules? *</Label>
                    <RadioGroup name="drawdown_rules_accepted" required className="flex gap-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="drawdown_yes" /><Label htmlFor="drawdown_yes">Yes</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="drawdown_no" /><Label htmlFor="drawdown_no">No</Label></div>
                    </RadioGroup>
                </div>
                 <div className="space-y-4">
                    <Label>Do You Understand Risk Management Rules? *</Label>
                    <RadioGroup name="risk_rules_understood" required className="flex gap-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="risk_yes" /><Label htmlFor="risk_yes">Yes</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="risk_no" /><Label htmlFor="risk_no">No</Label></div>
                    </RadioGroup>
                </div>
                <div className="flex items-start space-x-2 pt-4">
                    <Checkbox id="terms" name="terms_accepted" value="yes" required />
                    <Label htmlFor="terms" className="text-sm">
                       I'm Accepting the All Trading Rules & Regulations & Terms & Conditions & Privacy Policy. [ All Details are mentioned In website www.fundedstock.live ] *
                    </Label>
                </div>
            </div>


            <div className="flex justify-end gap-4 pt-4">
               <Button type="button" variant="outline" asChild>
                    <Link href="/welcome">Cancel</Link>
                </Button>
                <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit for Verification
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
