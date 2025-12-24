'use client';
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveKycStep, verifyPan } from './actions';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

const tradingStyleOptions = [
    { id: 'swing', label: 'Swing' },
    { id: 'intraday', label: 'Intraday' },
    { id: 'options_selling', label: 'Options Selling' },
    { id: 'options_buying', label: 'Options Buying' },
    { id: 'futures', label: 'Futures' },
    { id: 'scalping', label: 'Scalping' },
];

function Step1_PersonalInfo({ onSave, error }: { onSave: (formData: FormData) => void; error: string | null }) {
    const [pan, setPan] = useState('');
    const [panVerification, setPanVerification] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string | null }>({ status: 'idle', message: null });

    const handlePanVerification = async () => {
        if (!pan || pan.length !== 10) {
            setPanVerification({ status: 'error', message: 'Please enter a valid 10-character PAN.' });
            return;
        }
        setPanVerification({ status: 'loading', message: null });
        const result = await verifyPan(pan);
        if (result.status === 'Success') {
            setPanVerification({ status: 'success', message: `Verified as ${result.registered_name}` });
        } else {
            setPanVerification({ status: 'error', message: result.message || 'Verification failed.' });
        }
    };

    return (
        <form action={onSave} className="space-y-6">
            <h3 className="font-semibold text-lg">Step 1: Personal Information</h3>
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="mobile_number">Mobile Number *</Label>
                    <Input id="mobile_number" name="mobile_number" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="city_state">City & State *</Label>
                    <Input id="city_state" name="city_state" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="pan_number">PAN Card Number *</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            id="pan_number" 
                            name="pan_number" 
                            value={pan}
                            onChange={(e) => setPan(e.target.value.toUpperCase())}
                            required 
                            maxLength={10}
                            className="flex-grow"
                        />
                         <Button type="button" onClick={handlePanVerification} disabled={panVerification.status === 'loading' || panVerification.status === 'success'}>
                            {panVerification.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                        </Button>
                    </div>
                    {panVerification.status === 'success' && <p className="text-sm text-green-600 flex items-center gap-1 mt-1"><CheckCircle className="h-4 w-4"/> {panVerification.message}</p>}
                    {panVerification.status === 'error' && <p className="text-sm text-destructive flex items-center gap-1 mt-1"><XCircle className="h-4 w-4"/> {panVerification.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="aadhar_number">Aadhar Card Number *</Label>
                    <Input id="aadhar_number" name="aadhar_number" required />
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <Button type="submit" disabled={panVerification.status !== 'success'}>Save & Continue</Button>
            </div>
        </form>
    );
}


function Step2_DocumentUpload({ onSave, onBack, error }: { onSave: (formData: FormData) => void; onBack: () => void; error: string | null }) {
     return (
        <form action={onSave} className="space-y-6">
            <h3 className="font-semibold text-lg">Step 2: Document Upload</h3>
             {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="flex justify-between gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onBack}>Back</Button>
                <Button type="submit">Save & Continue</Button>
            </div>
        </form>
    );
}

function Step3_TradingBackground({ onSave, onBack, error }: { onSave: (formData: FormData) => void; onBack: () => void; error: string | null }) {
    return (
        <form action={onSave} className="space-y-6">
            <h3 className="font-semibold text-lg">Step 3: Trading Background</h3>
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="space-y-4">
                <Label>Have you traded in a Prop Firm before? *</Label>
                <RadioGroup name="traded_before" required className="flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="traded_yes" /><Label htmlFor="traded_yes">Yes</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="traded_no" /><Label htmlFor="traded_no">No</Label></div>
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
            <div className="flex justify-between gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onBack}>Back</Button>
                <Button type="submit">Save & Continue</Button>
            </div>
        </form>
    );
}

function Step4_Agreements({ onSave, onBack, error }: { onSave: (formData: FormData) => void; onBack: () => void; error: string | null }) {
    return (
        <form action={onSave} className="space-y-6">
            <h3 className="font-semibold text-lg">Step 4: Agreements</h3>
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="space-y-6 rounded-md border p-6">
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
             <div className="flex justify-between gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onBack}>Back</Button>
                <Button type="submit" size="lg">Submit for Verification</Button>
            </div>
        </form>
    );
}


export default function KycPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleStepSave = (formData: FormData) => {
    startTransition(async () => {
        setError(null);
        const result = await saveKycStep(currentStep, formData);
        if (result.error) {
            setError(result.error);
        } else {
            if (currentStep === totalSteps) {
                toast({ title: 'KYC Submitted', description: 'Your documents are now under review.' });
                router.push('/welcome');
            } else {
                setCurrentStep(prev => prev + 1);
            }
        }
    });
  };

  const handleBack = () => {
    setCurrentStep(prev => prev > 1 ? prev - 1 : 1);
  }

  const renderStep = () => {
      switch(currentStep) {
          case 1: return <Step1_PersonalInfo onSave={handleStepSave} error={error} />;
          case 2: return <Step2_DocumentUpload onSave={handleStepSave} onBack={handleBack} error={error} />;
          case 3: return <Step3_TradingBackground onSave={handleStepSave} onBack={handleBack} error={error} />;
          case 4: return <Step4_Agreements onSave={handleStepSave} onBack={handleBack} error={error} />;
          default: return <Step1_PersonalInfo onSave={handleStepSave} error={error} />;
      }
  }

  return (
    <main className="flex min-h-screen items-start justify-center p-4 md:p-8 bg-muted/40">
        <div className="w-full max-w-3xl space-y-8">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/welcome">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">KYC Verification</h1>
                    <p className="text-muted-foreground">Please fill out the form below to complete your verification.</p>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <Progress value={progress} className="w-full" />
                </CardHeader>
                <CardContent className="relative">
                    {isPending && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center z-10 rounded-md">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    )}
                    {renderStep()}
                </CardContent>
            </Card>
        </div>
    </main>
  );
}
