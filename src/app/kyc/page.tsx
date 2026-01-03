
'use client';
import { useState, useTransition, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle, ShieldCheck, Camera, Check, RefreshCw, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveKycStep, verifyPan } from './actions';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type Profile = {
    pan_number: string | null;
    is_pan_verified: boolean;
    selfie_url: string | null; // Will now store Aadhaar image
    is_aadhaar_verified: boolean; // Will represent if Aadhaar image is submitted
    traded_before: boolean;
    trading_experience: string | null;
    comments: string | null;
    trading_style: string[] | null;
    drawdown_rules_accepted: boolean;
    risk_rules_understood: boolean;
    terms_accepted: boolean;
    full_name: string | null;
};

const tradingStyleOptions = [
    { id: 'swing', label: 'Swing' },
    { id: 'intraday', label: 'Intraday' },
    { id: 'options_selling', label: 'Options Selling' },
    { id: 'options_buying', label: 'Options Buying' },
    { id: 'futures', label: 'Futures' },
    { id: 'scalping', label: 'Scalping' },
];

function AadhaarUploader({ onFileSelect, existingImageUrl, isPanVerified }: { onFileSelect: (file: File) => void; existingImageUrl: string | null; isPanVerified: boolean; }) {
    const [preview, setPreview] = useState<string | null>(existingImageUrl);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <div className="space-y-4">
            <Alert variant="destructive">
                <AlertTitle className="font-bold">High-Quality Warning!</AlertTitle>
                <AlertDescription>
                    Even after your KYC is verified, if the Aadhaar image is wrongly provided, you will **not** receive your funded account. Ensure the photo is clear and legible.
                </AlertDescription>
            </Alert>
            <div className="relative w-full max-w-md mx-auto bg-muted rounded-md overflow-hidden border-2 border-dashed border-muted-foreground/50 p-4 text-center h-48 flex flex-col justify-center items-center">
                 {!preview ? (
                     <>
                        <Upload className="h-10 w-10 text-muted-foreground mb-2"/>
                        <Label htmlFor="aadhaar-upload" className="font-semibold text-primary cursor-pointer">
                            Click to upload
                            <span className="text-muted-foreground font-normal"> or drag and drop</span>
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, JPEG up to 10MB</p>
                        <Input id="aadhaar-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" disabled={!isPanVerified} />
                     </>
                 ) : (
                    <div className="relative w-full h-full">
                        <Image src={preview} alt="Aadhaar preview" layout="fill" className="object-contain rounded-md" />
                    </div>
                 )}
            </div>
             {preview && (
                 <div className="flex justify-center">
                    <Button type="button" variant="outline" onClick={() => { setPreview(null); onFileSelect(null as any); (document.getElementById('aadhaar-upload') as HTMLInputElement).value = ''; }}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Change Photo
                    </Button>
                </div>
            )}
        </div>
    );
}

function KycFlow() {
  const router = useRouter();
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
                  toast({ title: 'KYC Verified!', description: 'Your KYC process is complete.' });
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
          case 1: return <Step1_DocumentVerification 
                            onSave={handleStepSave}
                            profile={profile!} 
                            error={error} 
                            startTransition={startTransition}
                            onVerificationSuccess={(updatedProfile) => {
                                setProfile(updatedProfile);
                            }}
                          />;
          case 2: return <Step2_TradingBackground onSave={handleStepSave} onBack={handleBack} profile={profile!} error={error} />;
          case 3: return <Step3_Agreements onSave={handleStepSave} onBack={handleBack} profile={profile!} error={error} />;
          default: return <p>Invalid Step</p>;
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


function Step1_DocumentVerification({ onSave, profile, error, startTransition, onVerificationSuccess }: { onSave: (formData: FormData) => void; profile: Profile; error: string | null; startTransition: any, onVerificationSuccess: (p: Profile) => void; }) {
    const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
    const [panInput, setPanInput] = useState('');
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [verifiedName, setVerifiedName] = useState<string | null>(profile.full_name);

    const { toast } = useToast();

    const isPanVerified = profile.is_pan_verified;
    
    const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const handlePanVerification = () => {
        startTransition(async () => {
            setVerificationError(null);
            const result = await verifyPan(panInput);
            if (result.error) {
                setVerificationError(result.error);
                setVerifiedName(null);
            } else if (result.success && result.updatedProfile) {
                toast({ title: 'PAN Verified Successfully!', description: `Name: ${result.updatedProfile.full_name}`});
                setVerifiedName(result.updatedProfile.full_name);
                onVerificationSuccess(result.updatedProfile as Profile);
            }
        });
    }
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (aadhaarFile) {
            const formData = new FormData();
            const base64Image = await fileToDataUri(aadhaarFile);
            formData.append('aadhaar_photo', base64Image);
            onSave(formData);
        }
    };

    return (
        <div className="space-y-8">
            <h3 className="font-semibold text-lg">Step 1: Document Verification</h3>
            <p className="text-sm text-muted-foreground">
                First, verify your PAN. Then, upload a clear photo of your Aadhaar card.
            </p>
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />PAN Verification
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isPanVerified ? (
                         <div className="flex items-center gap-2 text-green-600 font-medium text-sm p-3 bg-green-50 rounded-md">
                            <CheckCircle className="h-5 w-5" />
                            <div>
                                <p>PAN Verified: {verifiedName || profile.full_name}</p>
                                <p className="font-mono text-xs">{profile.pan_number}</p>
                            </div>
                        </div>
                     ) : (
                        <div>
                            <div className="flex items-center gap-2">
                                <Input 
                                    id="pan_number" 
                                    name="pan_number"
                                    placeholder="Enter your PAN number"
                                    value={panInput}
                                    onChange={(e) => setPanInput(e.target.value.toUpperCase())}
                                    maxLength={10}
                                    className="uppercase"
                                />
                                <Button type="button" onClick={handlePanVerification}>Verify PAN</Button>
                            </div>
                            {verificationError && <p className="text-sm text-destructive mt-2">{verificationError}</p>}
                        </div>
                     )}
                </CardContent>
            </Card>

            {/* Aadhaar Verification */}
             <form onSubmit={handleSubmit}>
                <Card className={cn(!isPanVerified && "bg-muted/50 opacity-60 pointer-events-none")}>
                    <CardHeader>
                         <CardTitle className="text-base flex items-center gap-2">
                            <Camera className="w-5 h-5 text-primary" />Aadhaar Card Photo Upload
                        </CardTitle>
                        {!isPanVerified && <CardDescription>Please complete PAN verification above to enable this step.</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <AadhaarUploader 
                            onFileSelect={(file) => setAadhaarFile(file)}
                            existingImageUrl={profile.selfie_url}
                            isPanVerified={profile.is_pan_verified}
                        />
                    </CardContent>
                     <CardFooter className="flex justify-end gap-4 pt-4">
                        <Button type="submit" disabled={!aadhaarFile || !profile.is_pan_verified}>Save & Continue</Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
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
                <Button type="submit" size="lg">Submit and Verify</Button>
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
