
'use client';
import { useState, useTransition, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle, XCircle, UserCheck, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveKycStep, createDigilockerUrl, getDigilockerDocument } from './actions';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';

type Profile = {
    mobile_number: string | null;
    pan_number: string | null;
    aadhar_number: string | null;
    is_pan_verified: boolean;
    is_aadhaar_verified: boolean;
    traded_before: boolean;
    trading_experience: string | null;
    comments: string | null;
    trading_style: string[] | null;
    drawdown_rules_accepted: boolean;
    risk_rules_understood: boolean;
    terms_accepted: boolean;
};

const tradingStyleOptions = [
    { id: 'swing', label: 'Swing' },
    { id: 'intraday', label: 'Intraday' },
    { id: 'options_selling', label: 'Options Selling' },
    { id: 'options_buying', label: 'Options Buying' },
    { id: 'futures', label: 'Futures' },
    { id: 'scalping', label: 'Scalping' },
];

function Step1_Verification({ onSave, profile, error }: { onSave: (formData: FormData) => void; profile: Profile; error: string | null }) {
    const [isPending, startTransition] = useTransition();
    const [digilockerError, setDigilockerError] = useState<string | null>(null);

    const handleVerification = (docType: 'AADHAAR' | 'PAN') => {
        startTransition(async () => {
            setDigilockerError(null);
            sessionStorage.setItem('kyc_doc_type', docType);

            const redirectBackUrl = window.location.href.split('?')[0];

            try {
                const data = await createDigilockerUrl(docType, redirectBackUrl);
                if (data.success && data.url) {
                    window.location.href = data.url;
                } else {
                    setDigilockerError(data.error || 'Failed to start verification process.');
                    sessionStorage.removeItem('kyc_doc_type');
                }
            } catch (e: any) {
                setDigilockerError(`Failed to connect to the verification service: ${e.message}`);
                sessionStorage.removeItem('kyc_doc_type');
            }
        });
    };

    return (
        <form action={onSave} className="space-y-6">
            <h3 className="font-semibold text-lg">Step 1: Automated Verification</h3>
            <p className="text-sm text-muted-foreground">
                Please provide your mobile number, then verify your PAN and Aadhaar using the official Digilocker service.
            </p>
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            {digilockerError && <Alert variant="destructive"><AlertTitle>Verification Error</AlertTitle><AlertDescription>{digilockerError}</AlertDescription></Alert>}
            
            <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number *</Label>
                <Input id="mobile_number" name="mobile_number" defaultValue={profile.mobile_number || ''} required />
            </div>

            <div className="rounded-lg border p-4 space-y-4">
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <Label>PAN Verification</Label>
                        <p className="text-xs text-muted-foreground">Verify your PAN card instantly.</p>
                    </div>
                    {profile.is_pan_verified ? (
                         <div className="flex items-center gap-2 text-green-600 font-medium text-sm p-2 bg-green-50 rounded-md">
                            <CheckCircle className="h-5 w-5" />
                            PAN Verified
                        </div>
                    ) : (
                        <Button type="button" onClick={() => handleVerification('PAN')} disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                            Verify PAN via Digilocker
                        </Button>
                    )}
                </div>
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <Label>Aadhaar Verification</Label>
                        <p className="text-xs text-muted-foreground">Verify your Aadhaar card to fetch your photo and address.</p>
                    </div>
                     {profile.is_aadhaar_verified ? (
                         <div className="flex items-center gap-2 text-green-600 font-medium text-sm p-2 bg-green-50 rounded-md">
                            <CheckCircle className="h-5 w-5" />
                            Aadhaar Verified
                        </div>
                    ) : (
                       <Button type="button" onClick={() => handleVerification('AADHAAR')} disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                            Verify Aadhaar via Digilocker
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <Button type="submit" disabled={!profile.is_pan_verified || !profile.is_aadhaar_verified}>
                    Save & Continue
                </Button>
            </div>
        </form>
    );
}


function Step2_TradingBackground({ onSave, onBack, error, profile }: { onSave: (formData: FormData) => void; onBack: () => void; error: string | null, profile: Profile }) {
    return (
        <form action={onSave} className="space-y-6">
            <h3 className="font-semibold text-lg">Step 2: Trading Background</h3>
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="space-y-4">
                <Label>Have you traded in a Prop Firm before? *</Label>
                <RadioGroup name="traded_before" required defaultValue={profile.traded_before ? 'yes' : 'no'} className="flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="traded_yes" /><Label htmlFor="traded_yes">Yes</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="traded_no" /><Label htmlFor="traded_no">No</Label></div>
                </RadioGroup>
            </div>
            <div className="space-y-2">
                <Label htmlFor="trading_experience">Trading Experience (in brief) *</Label>
                <Textarea id="trading_experience" name="trading_experience" defaultValue={profile.trading_experience || ''} required />
            </div>
            <div className="space-y-4">
                <Label>Preferred Trading Style *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {tradingStyleOptions.map(style => (
                        <div key={style.id} className="flex items-center space-x-2">
                            <Checkbox id={style.id} name="trading_style" value={style.id} defaultChecked={profile.trading_style?.includes(style.id)} />
                            <Label htmlFor={style.id}>{style.label}</Label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="comments">Any Comments / Special Notes</Label>
                <Textarea id="comments" name="comments" defaultValue={profile.comments || ''} />
            </div>
            <div className="flex justify-between gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onBack}>Back</Button>
                <Button type="submit">Save & Continue</Button>
            </div>
        </form>
    );
}

function Step3_Agreements({ onSave, onBack, error, profile }: { onSave: (formData: FormData) => void; onBack: () => void; error: string | null, profile: Profile }) {
    return (
        <form action={onSave} className="space-y-6">
            <h3 className="font-semibold text-lg">Step 3: Agreements</h3>
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="space-y-6 rounded-md border p-6">
                <div className="space-y-4">
                   <Label>Are You Comfortable With Daily and Overall Drawdown Rules? *</Label>
                   <RadioGroup name="drawdown_rules_accepted" required defaultValue={profile.drawdown_rules_accepted ? 'yes' : 'no'} className="flex gap-4">
                       <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="drawdown_yes" /><Label htmlFor="drawdown_yes">Yes</Label></div>
                       <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="drawdown_no" /><Label htmlFor="drawdown_no">No</Label></div>
                   </RadioGroup>
               </div>
                <div className="space-y-4">
                   <Label>Do You Understand Risk Management Rules? *</Label>
                   <RadioGroup name="risk_rules_understood" required defaultValue={profile.risk_rules_understood ? 'yes' : 'no'} className="flex gap-4">
                       <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="risk_yes" /><Label htmlFor="risk_yes">Yes</Label></div>
                       <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="risk_no" /><Label htmlFor="risk_no">No</Label></div>
                   </RadioGroup>
               </div>
               <div className="flex items-start space-x-2 pt-4">
                   <Checkbox id="terms" name="terms_accepted" value="yes" defaultChecked={profile.terms_accepted} required />
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

function KycFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isActionPending, startTransition] = useTransition();

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  // Effect to fetch initial profile data
  useEffect(() => {
    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error) {
            toast({ title: 'Error', description: 'Could not fetch your profile data.', variant: 'destructive'});
        } else {
            setProfile(data as Profile);
        }
        setIsPageLoading(false);
    };
    fetchProfile();
  }, [supabase, router, toast]);

  // Effect to handle Digilocker redirect
  useEffect(() => {
    if (isPageLoading) return; // Don't run on initial load

    const verification_id = searchParams.get('verification_id');
    const reference_id = searchParams.get('reference_id');
    const document_type = sessionStorage.getItem('kyc_doc_type') as 'AADHAAR' | 'PAN' | null;

    if (verification_id && reference_id && document_type) {
        startTransition(async () => {
            setError(null);
            
            try {
                const data = await getDigilockerDocument(verification_id, reference_id, document_type);
                if (data.status === 'Success') {
                    const formData = new FormData();
                    formData.append('document_type', document_type);
                    formData.append('verification_id', verification_id);
                    formData.append('api_response', JSON.stringify(data));

                    await handleStepSave(formData);
                    toast({ title: `${document_type} Verified!`, description: "The verification was successful." });
                } else {
                    setError(data.message || `Failed to retrieve ${document_type} data.`);
                }
            } catch (e: any) {
                setError(`Failed to connect to the verification service: ${e.message}`);
            }
            
            sessionStorage.removeItem('kyc_doc_type');
            router.replace('/kyc');
        });
    }
  }, [searchParams, router, isPageLoading]);


  const handleStepSave = async (formData: FormData) => {
    return new Promise<void>((resolve, reject) => {
        startTransition(async () => {
            setError(null);
            const result = await saveKycStep(currentStep, formData);
            if (result.error) {
                setError(result.error);
                reject();
            } else {
                // Manually update profile state to reflect changes before moving to next step
                if (result.updatedProfile) {
                    setProfile(result.updatedProfile as Profile);
                }

                if (currentStep === totalSteps) {
                    toast({ title: 'KYC Submitted', description: 'Your documents are now under review.' });
                    router.push('/welcome');
                } else {
                    setCurrentStep(prev => prev + 1);
                }
                resolve();
            }
        });
    });
  };

  const handleBack = () => {
    setCurrentStep(prev => prev > 1 ? prev - 1 : 1);
  }

  const renderStep = () => {
      switch(currentStep) {
          case 1: return <Step1_Verification onSave={handleStepSave} profile={profile!} error={error} />;
          case 2: return <Step2_TradingBackground onSave={handleStepSave} onBack={handleBack} profile={profile!} error={error} />;
          case 3: return <Step3_Agreements onSave={handleStepSave} onBack={handleBack} profile={profile!} error={error} />;
          default: return <Step1_Verification onSave={handleStepSave} profile={profile!} error={error} />;
      }
  }

  if (isPageLoading || !profile) {
      return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
  }

  return (
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
                {isActionPending && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center z-10 rounded-md">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
                {renderStep()}
            </CardContent>
        </Card>
    </div>
  );
}


export default function KycPage() {
    return (
      <main className="flex min-h-screen items-start justify-center p-4 md:p-8 bg-muted/40">
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <KycFlow />
        </Suspense>
      </main>
    );
}
