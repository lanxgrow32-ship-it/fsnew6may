
'use client';
import { useState, useTransition, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle, XCircle, UserCheck, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveKycStep, createDigilockerUrl, getVerifiedDocument } from './actions';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

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

function KycFlow() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isActionPending, startTransition] = useTransition();

  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

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
    const processVerification = async () => {
        const verification_id = sessionStorage.getItem('digilocker_verification_id');
        const reference_id = sessionStorage.getItem('digilocker_reference_id');
        const doc_type = sessionStorage.getItem('digilocker_doc_type') as 'AADHAAR' | 'PAN' | null;

        if (verification_id && reference_id && doc_type) {
            startTransition(async () => {
                setVerificationError(null);
                const result = await getVerifiedDocument(verification_id, reference_id, doc_type);

                if (result.error) {
                    setVerificationError(result.error);
                } else {
                    setVerifiedData(result.data);
                    
                    const formData = new FormData();
                    formData.append('document_type', doc_type);
                    formData.append('verification_id', verification_id);
                    formData.append('api_response', JSON.stringify(result.data));

                    const saveResult = await saveKycStep(1, formData);
                    if (saveResult.error) {
                       toast({ title: 'Save Error', description: `Could not save verification data: ${saveResult.error}`, variant: 'destructive' });
                    } else if (saveResult.updatedProfile) {
                       setProfile(saveResult.updatedProfile as Profile);
                       toast({ title: `${doc_type} Verified!`, description: 'The verification was successful and data has been saved.' });
                    }
                }
                // Clean up sessionStorage and URL
                sessionStorage.removeItem('digilocker_verification_id');
                sessionStorage.removeItem('digilocker_reference_id');
                sessionStorage.removeItem('digilocker_doc_type');
                router.replace('/kyc');
            });
        }
    };
    
    processVerification();
    // The dependency array is intentionally empty to ensure this runs only once on page load after a redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleStepSave = async (formData: FormData) => {
      startTransition(async () => {
          setError(null);
          const result = await saveKycStep(currentStep, formData);
          if (result.error) {
              setError(result.error);
          } else {
              if (result.updatedProfile) {
                  setProfile(result.updatedProfile as Profile);
              }

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

  const handleVerificationClick = (docType: 'AADHAAR' | 'PAN') => {
        startTransition(async () => {
            setError(null);
            const redirectBackUrl = window.location.origin + window.location.pathname;

            const data = await createDigilockerUrl(docType, redirectBackUrl);
            
            if (data.success && data.url && data.verification_id && data.reference_id) {
                // Save context to sessionStorage before redirecting
                sessionStorage.setItem('digilocker_verification_id', data.verification_id);
                sessionStorage.setItem('digilocker_reference_id', data.reference_id);
                sessionStorage.setItem('digilocker_doc_type', docType);
                window.location.href = data.url;
            } else {
                setError(data.error || 'Failed to start verification process.');
            }
        });
    };

  const renderStep = () => {
      switch(currentStep) {
          case 1: return <Step1_Verification onSave={handleStepSave} profile={profile!} error={error} handleVerificationClick={handleVerificationClick} />;
          case 2: return <Step2_TradingBackground onSave={handleStepSave} onBack={handleBack} profile={profile!} error={error} />;
          case 3: return <Step3_Agreements onSave={handleStepSave} onBack={handleBack} profile={profile!} error={error} />;
          default: return <Step1_Verification onSave={handleStepSave} profile={profile!} error={error} handleVerificationClick={handleVerificationClick} />;
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

        {verificationError && (
             <Alert variant="destructive">
                <AlertTitle>Verification Failed</AlertTitle>
                <AlertDescription>{verificationError}</AlertDescription>
            </Alert>
        )}

        {verifiedData && (
             <Card>
                <CardHeader>
                    <CardTitle className="text-green-600">Verification Success</CardTitle>
                    <CardDescription>The following data was retrieved from Digilocker.</CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="p-4 bg-muted rounded-md text-xs overflow-auto">
                        {JSON.stringify(verifiedData, null, 2)}
                    </pre>
                    {verifiedData.photo_link && (
                        <div className="mt-4">
                            <h4 className="font-semibold mb-2">Photo:</h4>
                            <Image src={`data:image/jpeg;base64,${verifiedData.photo_link}`} alt="Verified Photo" width={100} height={100} className="rounded-md border"/>
                        </div>
                    )}
                </CardContent>
            </Card>
        )}

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


function Step1_Verification({ onSave, profile, error, handleVerificationClick }: { onSave: (formData: FormData) => void; profile: Profile; error: string | null, handleVerificationClick: (docType: 'AADHAAR' | 'PAN') => void }) {

    return (
        <form action={onSave} className="space-y-6">
            <h3 className="font-semibold text-lg">Step 1: Automated Verification</h3>
            <p className="text-sm text-muted-foreground">
                Please provide your mobile number, then verify your PAN and Aadhaar using the official Digilocker service.
            </p>
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            
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
                        <Button type="button" onClick={() => handleVerificationClick('PAN')}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
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
                       <Button type="button" onClick={() => handleVerificationClick('AADHAAR')}>
                            <UserCheck className="mr-2 h-4 w-4" />
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


export default function KycPage() {
    return (
      <main className="flex min-h-screen items-start justify-center p-4 md:p-8 bg-muted/40">
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <KycFlow />
        </Suspense>
      </main>
    );
}
