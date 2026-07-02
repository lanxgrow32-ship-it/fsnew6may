
'use client';
import { useState, useTransition, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle, ShieldCheck, Camera, Check, RefreshCw, Upload, Menu, Search, Settings, Bell, User, FileCheck, MessageSquare, LogOut, ShieldAlert, ShoppingCart, Video, Info, Copy, X } from 'lucide-react';
import { saveKycStep, verifyPan } from './actions';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { signOut } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

type Profile = {
    id: string;
    pan_number: string | null;
    is_pan_verified: boolean;
    selfie_url: string | null; 
    selfie_with_aadhaar_url: string | null; 
    video_kyc_url: string | null;
    is_aadhaar_verified: boolean; 
    traded_before: boolean;
    trading_experience: string | null;
    comments: string | null;
    trading_style: string[] | null;
    drawdown_rules_accepted: boolean;
    risk_rules_understood: boolean;
    terms_accepted: boolean;
    full_name: string | null;
    email: string | null;
    address: string | null;
    kyc_status: string;
};

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
    <div className={cn('bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg', className)}>
        {children}
    </div>
);

const Logo = () => (
    <div className="bg-slate-900 h-10 w-10 flex items-center justify-center rounded-lg text-2xl font-bold border border-white/10 shadow-inner shadow-black/50">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 7L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 7L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    </div>
);

function UserNav({ profile }: { profile: any}) {
    const router = useRouter();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={`https://avatar.vercel.sh/${profile?.email}.png`} alt={profile?.full_name || 'User'} />
                        <AvatarFallback>{profile?.full_name?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/kyc')}>
                        <FileCheck className="mr-2 h-4 w-4" />
                        <span>KYC</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                 <form action={signOut}>
                    <DropdownMenuItem asChild>
                         <button type="submit" className="w-full">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </button>
                    </DropdownMenuItem>
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

const navItems = [
    { href: "/welcome", label: "Account Overview" },
    { href: "/guide", label: "Trading Guide" },
    { href: "/referrals", label: "Referrals" },
    { href: "/welcome?tab=support", label: "Live Chat" },
    { href: "/mentor", label: "AI Mentor" },
    { href: "/welcome?tab=marketplace", label: "Get Funded" },
];

const DashboardHeader = ({profile, activePage}: {profile:any, activePage: string}) => (
  <header className="flex items-center justify-between mb-8 z-20 relative">
    <div className="flex items-center gap-8">
        <Logo />
        <nav className="hidden md:flex items-center gap-1 bg-black/20 backdrop-blur-sm border border-white/10 p-1 rounded-full shadow-lg">
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "px-4 py-1.5 text-sm transition-colors",
                        activePage === item.label
                        ? "font-medium bg-white/10 rounded-full text-white shadow-md"
                        : "text-gray-400 hover:text-white"
                    )}
                >
                    {item.label}
                </Link>
            ))}
      </nav>
    </div>
    <div className="flex items-center gap-2">
      <UserNav profile={profile} />
      <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 md:hidden transition-colors">
        <Menu className="h-5 w-5 text-gray-300" />
      </button>
    </div>
  </header>
);

const tradingStyleOptions = [
    { id: 'swing', label: 'Swing' },
    { id: 'intraday', label: 'Intraday' },
    { id: 'options_selling', label: 'Options Selling' },
    { id: 'options_buying', label: 'Options Buying' },
    { id: 'futures', label: 'Futures' },
    { id: 'scalping', label: 'Scalping' },
];

function AadhaarUploader({ onFileSelect, existingImageUrl, isPanVerified, title, description }: { onFileSelect: (base64: string | null) => void; existingImageUrl: string | null; isPanVerified: boolean; title: string; description: string; }) {
    const [preview, setPreview] = useState<string | null>(existingImageUrl);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPreview(base64String);
                onFileSelect(base64String);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const resetUpload = () => {
        setPreview(null);
        onFileSelect(null);
        const input = document.getElementById('aadhaar-upload') as HTMLInputElement;
        if (input) input.value = '';
    }

    return (
        <div className="space-y-4">
             <GlassCard className={cn(!isPanVerified && "bg-slate-800/50 opacity-60 pointer-events-none")}>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                        <Camera className="w-5 h-5 text-purple-400" />{title}
                    </CardTitle>
                    <CardDescription className="text-gray-400">{description}</CardDescription>
                    {!isPanVerified && <CardDescription className="text-amber-400">Please complete PAN verification above to enable this step.</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="destructive">
                        <AlertTitle className="font-bold">High-Quality Warning!</AlertTitle>
                        <AlertDescription>
                            Even after your KYC is verified, if the image is wrongly provided, you will **not** receive your funded account. Ensure the photo is clear and legible.
                        </AlertDescription>
                    </Alert>
                    <div className="relative w-full max-w-md mx-auto bg-black/20 rounded-md overflow-hidden border-2 border-dashed border-white/20 p-4 text-center h-48 flex flex-col justify-center items-center">
                        {!preview ? (
                            <>
                                <Upload className="h-10 w-10 text-gray-400 mb-2"/>
                                <Label htmlFor="aadhaar-upload" className="font-semibold text-purple-400 cursor-pointer">
                                    Click to upload
                                    <span className="text-gray-400 font-normal"> or drag and drop</span>
                                </Label>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 10MB</p>
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
                            <Button type="button" variant="outline" onClick={resetUpload} className="bg-black/20 border-white/10 hover:bg-white/10">
                                <RefreshCw className="mr-2 h-4 w-4" /> Change Photo
                            </Button>
                        </div>
                    )}
                 </CardContent>
            </GlassCard>
        </div>
    );
}

function KycFlow({initialProfile}: {initialProfile: Profile}) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [error, setError] = useState<string | null>(null);
  const [isActionPending, startTransition] = useTransition();

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const handleStepSave = async (formData: FormData) => {
      startTransition(async () => {
          try {
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
          } catch (e: any) {
              console.error("KYC Save Error:", e);
              setError("A network error occurred. The file might be too large. Please try again with a shorter video or smaller images.");
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
                            profile={profile} 
                            error={error} 
                            startTransition={startTransition}
                            onVerificationSuccess={(updatedProfile) => {
                                setProfile(updatedProfile);
                            }}
                          />;
          case 2: return <Step2_SelfieWithAadhaar onSave={handleStepSave} onBack={handleBack} profile={profile} error={error} />;
          case 3: return <Step3_VideoKyc onSave={handleStepSave} onBack={handleBack} profile={profile} error={error} />;
          case 4: return <Step4_TradingBackground onSave={handleStepSave} onBack={handleBack} profile={profile} error={error} />;
          case 5: return <Step5_Agreements onSave={handleStepSave} onBack={handleBack} profile={profile} error={error} />;
          default: return <p>Invalid Step</p>;
      }
  }
  
  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8 bg-black/20 border-white/10 hover:bg-white/10" asChild>
                <Link href="/welcome">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold text-white">KYC Verification</h1>
                <p className="text-gray-400">Complete your verification to access full trading credentials.</p>
            </div>
        </div>

        <GlassCard>
            <CardHeader className="border-b-0">
                <Progress value={progress} className="w-full" />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">
                    <span>Docs</span>
                    <span>Selfie</span>
                    <span>Video</span>
                    <span>Trading</span>
                    <span>Done</span>
                </div>
            </CardHeader>
            <CardContent className="relative p-6">
                {isActionPending && (
                    <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-50 rounded-md">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
                {renderStep()}
            </CardContent>
        </GlassCard>
    </div>
  );
}


function Step1_DocumentVerification({ onSave, profile, error, startTransition, onVerificationSuccess }: { onSave: (formData: FormData) => void; profile: Profile; error: string | null; startTransition: any, onVerificationSuccess: (p: Profile) => void; }) {
    const [aadhaarBase64, setAadhaarBase64] = useState<string | null>(null);
    const [panInput, setPanInput] = useState('');
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [verifiedName, setVerifiedName] = useState<string | null>(profile.full_name);

    const { toast } = useToast();

    const isPanVerified = profile.is_pan_verified;
    
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
        if (aadhaarBase64) {
            const formData = new FormData();
            formData.append('aadhaar_photo', aadhaarBase64);
            onSave(formData);
        }
    };

    return (
        <div className="space-y-8">
            <h3 className="font-semibold text-lg text-white">Step 1 of 5: Document Verification</h3>
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            
            <GlassCard>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                        <ShieldCheck className="w-5 h-5 text-purple-400" />PAN Verification
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isPanVerified ? (
                         <div className="flex items-center gap-2 text-green-400 font-medium text-sm p-3 bg-green-500/10 rounded-md border border-green-500/20">
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
                                    className="uppercase bg-black/20 border-white/10"
                                />
                                <Button type="button" onClick={handlePanVerification} className="bg-purple-600 text-white hover:bg-purple-700">Verify PAN</Button>
                            </div>
                            {verificationError && <p className="text-sm text-red-400 mt-2">{verificationError}</p>}
                        </div>
                     )}
                </CardContent>
            </GlassCard>

             <form onSubmit={handleSubmit}>
                <AadhaarUploader 
                    onFileSelect={setAadhaarBase64}
                    existingImageUrl={profile.selfie_url}
                    isPanVerified={profile.is_pan_verified}
                    title="Aadhaar Card Photo Upload"
                    description="Upload a clear photo of your Aadhaar card."
                />
                <CardFooter className="flex justify-end gap-4 pt-6 px-0 pb-0">
                    <Button type="submit" disabled={!aadhaarBase64 || !profile.is_pan_verified} className="bg-purple-600 text-white hover:bg-purple-700">Save & Continue</Button>
                </CardFooter>
            </form>
        </div>
    );
}

function Step2_SelfieWithAadhaar({ onSave, onBack, error, profile }: { onSave: (formData: FormData) => void; onBack: () => void; error: string | null, profile: Profile }) {
    const [selfieWithAadhaarBase64, setSelfieWithAadhaarBase64] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (selfieWithAadhaarBase64) {
            const formData = new FormData();
            formData.append('selfie_with_aadhaar_photo', selfieWithAadhaarBase64);
            onSave(formData);
        }
    };
    
    return (
        <div className="space-y-8">
            <h3 className="font-semibold text-lg text-white">Step 2 of 5: Selfie Verification</h3>
             {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

             <form onSubmit={handleSubmit}>
                <AadhaarUploader 
                    onFileSelect={setSelfieWithAadhaarBase64}
                    existingImageUrl={profile.selfie_with_aadhaar_url}
                    isPanVerified={true} // Always enabled on this step
                    title="Selfie with Aadhaar Card"
                    description="Upload a clear selfie of yourself holding your Aadhaar card next to your face."
                />
                <CardFooter className="flex justify-between gap-4 pt-6 px-0 pb-0">
                    <Button type="button" variant="outline" onClick={onBack} className="bg-black/20 border-white/10 hover:bg-white/10">Back</Button>
                    <Button type="submit" disabled={!selfieWithAadhaarBase64} className="bg-purple-600 text-white hover:bg-purple-700">Save & Continue</Button>
                </CardFooter>
            </form>
        </div>
    );
}

function Step3_VideoKyc({ onSave, onBack, error, profile }: { onSave: (formData: FormData) => void; onBack: () => void; error: string | null, profile: Profile }) {
    const [isRecording, setIsRecording] = useState(false);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const { toast } = useToast();

    const script = `My name is ${profile.full_name || '[Name]'}. I confirm that I am completing this Video KYC for my FundedStock account using my own identity. I agree to the Terms & Conditions, KYC Policy, and Risk Disclosure. I authorize FundedStock to verify and store my KYC details, including my video, digital signature, IP address, and device information for security, compliance, and fraud prevention.`;

    useEffect(() => {
        if (videoRef.current && stream && !previewUrl) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(err => {
                console.error("Manual Play Error:", err);
            });
        }
    }, [stream, previewUrl]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
                audio: true 
            });
            setStream(mediaStream);
        } catch (err) {
            console.error("Camera Error:", err);
            toast({ title: "Permissions Denied", description: "Please allow camera and microphone access to proceed.", variant: "destructive" });
        }
    };

    const startRecording = () => {
        if (!stream) return;
        
        chunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') 
            ? 'video/webm;codecs=vp8,opus' 
            : 'video/mp4';
            
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            setVideoBlob(blob);
            setPreviewUrl(URL.createObjectURL(blob));
        };

        recorder.start(1000); 
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            // Hard Stop: Terminate all tracks to power down camera and close session
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                    console.log("KYC Track Terminated:", track.label);
                });
            }
            setStream(null);
        }
    };

    const handleSave = () => {
        if (videoBlob) {
            const reader = new FileReader();
            reader.readAsDataURL(videoBlob);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                const formData = new FormData();
                formData.append('video_kyc', base64data);
                onSave(formData);
            };
        }
    };

    const retake = () => {
        setVideoBlob(null);
        setPreviewUrl(null);
        // Resetting stream for a new start
        setStream(null);
    };

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    return (
        <div className="space-y-6">
            <h3 className="font-semibold text-lg text-white">Step 3 of 5: Video Teleprompter</h3>
            
            {!stream && !previewUrl ? (
                <div className="text-center py-20 space-y-6 animate-in fade-in">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 shadow-[0_0_50px_rgba(139,44,245,0.1)]">
                        <Video className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xl font-bold text-white">Live Identity Verification</h4>
                        <p className="text-gray-400 text-sm max-w-xs mx-auto">Please allow camera access. You will read a mandatory script while recording.</p>
                    </div>
                    <Button onClick={startCamera} size="lg" className="rounded-full px-10 h-14 font-black shadow-xl shadow-primary/20 uppercase tracking-widest">Enable Protocol</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative aspect-video rounded-3xl bg-black overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
                        {previewUrl ? (
                            <video src={previewUrl} controls className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    muted 
                                    playsInline 
                                    className="w-full h-full object-cover" 
                                />
                                <div className="absolute top-4 left-4 right-4 bg-slate-950/70 backdrop-blur-sm border border-white/10 p-5 rounded-2xl animate-in slide-in-from-top-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Read aloud clearly:</p>
                                    </div>
                                    <p className="text-xs md:text-sm font-bold text-white leading-relaxed">
                                        {script}
                                    </p>
                                </div>
                                {isRecording && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest animate-pulse">
                                        <div className="w-2 h-2 rounded-full bg-white" /> Recording
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex justify-center gap-4">
                        {!previewUrl ? (
                            !isRecording ? (
                                <Button onClick={startRecording} size="lg" className="rounded-full h-16 px-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-red-900/40">Start Recording</Button>
                            ) : (
                                <Button onClick={stopRecording} size="lg" className="rounded-full h-16 px-12 bg-white text-black font-black uppercase tracking-[0.2em] shadow-2xl">Stop Session</Button>
                            )
                        ) : (
                            <Button variant="outline" onClick={retake} className="rounded-full h-12 px-8 border-white/10 bg-black/20 hover:bg-white/5 font-bold uppercase tracking-widest text-xs">
                                <RefreshCw className="mr-2 h-4 w-4" /> Retake Video
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <CardFooter className="flex justify-between gap-4 pt-6 px-0 pb-0">
                <Button type="button" variant="outline" onClick={onBack} className="bg-black/20 border-white/10 hover:bg-white/10">Back</Button>
                <Button onClick={handleSave} disabled={!videoBlob} className="bg-purple-600 text-white hover:bg-purple-700 font-bold px-10 h-12 shadow-xl shadow-purple-900/20">Save & Continue</Button>
            </CardFooter>
        </div>
    );
}


function Step4_TradingBackground({ onSave, onBack, error, profile }: { onSave: (formData: FormData) => void; onBack: () => void; error: string | null, profile: Profile }) {
    return (
        <form action={onSave} className="space-y-6">
            <h3 className="font-semibold text-lg text-white">Step 4 of 5: Trading Background</h3>
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="space-y-4">
                <Label className="text-gray-300">Have you traded in a Prop Firm before? *</Label>
                <RadioGroup name="traded_before" required defaultValue={profile.traded_before ? 'yes' : 'no'} className="flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="traded_yes" /><Label htmlFor="traded_yes">Yes</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="traded_no" /><Label htmlFor="traded_no">No</Label></div>
                </RadioGroup>
            </div>
            <div className="space-y-2">
                <Label htmlFor="trading_experience" className="text-gray-300">Trading Experience (in brief) *</Label>
                <Textarea id="trading_experience" name="trading_experience" defaultValue={profile.trading_experience || ''} required className="bg-black/20 border-white/10" />
            </div>
            <div className="space-y-4">
                <Label className="text-gray-300">Preferred Trading Style *</Label>
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
                <Label htmlFor="comments" className="text-gray-300">Any Comments / Special Notes</Label>
                <Textarea id="comments" name="comments" defaultValue={profile.comments || ''} className="bg-black/20 border-white/10" />
            </div>
            <div className="flex justify-between gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onBack} className="bg-black/20 border-white/10 hover:bg-white/10">Back</Button>
                <Button type="submit" className="bg-purple-600 text-white hover:bg-purple-700">Save & Continue</Button>
            </div>
        </form>
    );
}

function Step5_Agreements({ onSave, onBack, error, profile }: { onSave: (formData: FormData) => void; onBack: () => void; error: string | null, profile: Profile }) {
    return (
        <form action={onSave} className="space-y-6">
            <h3 className="font-semibold text-lg text-white">Step 5 of 5: Agreements</h3>
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="space-y-6 rounded-md border border-white/10 p-6 bg-black/20">
                <div className="space-y-4">
                   <Label className="text-gray-300">Are You Comfortable With Daily and Overall Drawdown Rules? *</Label>
                   <RadioGroup name="drawdown_rules_accepted" required defaultValue={profile.drawdown_rules_accepted ? 'yes' : 'no'} className="flex gap-4">
                       <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="drawdown_yes" /><Label htmlFor="drawdown_yes">Yes</Label></div>
                       <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="drawdown_no" /><Label htmlFor="drawdown_no">No</Label></div>
                   </RadioGroup>
               </div>
                <div className="space-y-4">
                   <Label className="text-gray-300">Do You Understand Risk Management Rules? *</Label>
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
                <Button type="button" variant="outline" onClick={onBack} className="bg-black/20 border-white/10 hover:bg-white/10">Back</Button>
                <Button type="submit" size="lg" className="bg-purple-600 text-white hover:bg-purple-700">Submit and Verify</Button>
            </div>
        </form>
    );
}

function PurchaseGate() {
    return (
        <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-in fade-in zoom-in-95">
            <div className="h-24 w-24 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto shadow-2xl border border-amber-500/20 shadow-amber-500/10">
                <ShieldAlert className="h-12 w-12" />
            </div>
            <div className="space-y-3">
                <h2 className="text-3xl font-bold text-white tracking-tight">Active Plan Required</h2>
                <p className="text-gray-400 text-lg font-medium max-w-md mx-auto">
                    To maintain protocol integrity, KYC verification is only available to active traders.
                </p>
                <p className="text-gray-500 text-sm max-w-sm mx-auto pt-2">
                    Please purchase an Instant Funding, 1-Step, or 2-Step evaluation to unlock your identity verification module.
                </p>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="rounded-2xl px-10 h-14 font-bold text-base shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    <Link href="/welcome?tab=marketplace">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Explore Funding Plans
                    </Link>
                </Button>
                <Button variant="ghost" asChild className="text-gray-400 hover:text-white font-bold h-14">
                    <Link href="/welcome">Return to Dashboard</Link>
                </Button>
            </div>
        </div>
    );
}


export default function KycPage() {
    const supabase = createClient();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [hasAccount, setHasAccount] = useState<boolean | null>(null);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch profile and check for any existing accounts/registrations
            const [pRes, accountsRes, compRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('user_accounts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
                supabase.from('competition_registrations').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
            ]);

            if (pRes.data) {
                setProfile(pRes.data as Profile);
            }
            
            const totalActivity = (accountsRes.count || 0) + (compRes.count || 0);
            setHasAccount(totalActivity > 0);
            setIsPageLoading(false);
        };
        fetchProfile();
    }, [supabase, router]);

    return (
        <div className="dark min-h-screen bg-slate-950 text-gray-200 font-poppins relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-25%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600 rounded-full filter blur-3xl opacity-20 " />
                <div className="absolute bottom-[-25%] right-[-15%] w-[40vw] h-[40vw] bg-pink-600 rounded-full filter blur-3xl opacity-10" />
            </div>
            <main className="relative z-10 p-4 sm:p-6 lg:p-8">
                <DashboardHeader profile={profile} activePage="KYC" />
                <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                    {isPageLoading || !profile ? (
                        <div className="flex items-center justify-center h-96">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {hasAccount ? (
                                <KycFlow initialProfile={profile} />
                            ) : (
                                <PurchaseGate />
                            )}
                        </>
                    )}
                </Suspense>
            </main>
        </div>
    );
}
