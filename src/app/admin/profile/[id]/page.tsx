
'use client';

import { useState, useEffect, use, useActionState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Download, PanelLeft, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, resetPassword } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

type Profile = {
  id: string;
  full_name: string;
  email: string;
  plan_purchased: string;
  transaction_id: string;
  is_approved: boolean;
  credentials_provided: boolean;
  trading_username: string;
  trading_password: string;
  kyc_status: 'pending' | 'submitted' | 'verified' | 'rejected';
  mobile_number: string;
  pan_number: string;
  aadhar_number: string;
  selfie_url: string; // Now stores Aadhaar photo
  city_state: string;
  traded_before: boolean;
  trading_experience: string;
  comments: string;
  trading_style: string[];
  drawdown_rules_accepted: boolean;
  risk_rules_understood: boolean;
  terms_accepted: boolean;
  plan_price: number | null;
  coupon_code: string | null;
  discount_amount: number | null;
  final_amount_paid: number | null;
  is_breached: boolean;
  breach_reason: string | null;
  breach_image_url: string | null;
  role: string;
  is_pan_verified: boolean;
  is_aadhaar_verified: boolean; // Now means Aadhaar photo submitted
  digilocker_verification_id: string | null;
};

function ResetPasswordForm({ userId, role }: { userId: string, role: string }) {
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [state, formAction] = useActionState(resetPassword, { error: null, success: false });

    useEffect(() => {
        if (state.error) {
            toast({
                title: "Error Resetting Password",
                description: state.error,
                variant: "destructive",
            });
        }
        if (state.success) {
            toast({
                title: "Success",
                description: "User password has been reset successfully.",
            });
            formRef.current?.reset();
        }
    }, [state, toast]);

    function SubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" disabled={pending} variant="destructive">
                {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</> : 'Reset Password'}
            </Button>
        );
    }
    
    if (role === 'admin') {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Reset Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">You cannot reset the password for another admin user.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <form action={formAction} ref={formRef}>
                <input type="hidden" name="id" value={userId} />
                <CardHeader>
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>Enter a new password for the user. They will be logged out and will need to sign in again.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input id="password" name="password" type="password" required />
                        <p className="text-xs text-muted-foreground">Must be at least 6 characters long.</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </form>
        </Card>
    );
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mainFormRef = useRef<HTMLFormElement>(null);

  const { id } = use(params);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        setError('Failed to fetch profile.');
        console.error(error);
      } else {
        setProfile(data);
      }
      setIsFetching(false);
    };

    fetchProfile();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('id', profile.id);
    formData.append('full_name', profile.full_name);
    formData.append('email', profile.email);
    
    const result = await updateProfile(formData);

    if (result.error) {
      setError(result.error);
       toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Profile Updated Successfully' });
      router.push('/admin/dashboard');
    }
    setIsLoading(false);
  };
  
  if (isFetching) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (error && !profile) {
     return <div className="flex min-h-screen items-center justify-center"><Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div>
  }

  if (!profile) {
    return <div className="flex min-h-screen items-center justify-center"><p>Profile not found.</p></div>
  }

  const VerificationStatus = ({ label, isVerified }: { label: string, isVerified: boolean }) => (
    <div className={`flex items-center gap-2 font-medium ${isVerified ? 'text-green-600' : 'text-destructive'}`}>
        {isVerified ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
        <span>{label} {isVerified ? 'Verified' : 'Not Verified'}</span>
    </div>
  );

  return (
    <div className="bg-muted/40 min-h-screen">
        <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
           <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/dashboard">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Manage User Profile</h1>
           </div>
        </header>
        <main className="p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="space-y-8">
                    {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                    
                    <form onSubmit={handleSubmit} ref={mainFormRef}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-8">
                           <Card>
                                <CardHeader>
                                    <CardTitle>KYC & Verification Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        <VerificationStatus label="PAN" isVerified={profile.is_pan_verified} />
                                        <VerificationStatus label="Aadhaar Photo Submitted" isVerified={profile.is_aadhaar_verified} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm pt-4 border-t">
                                        <div className="space-y-1">
                                            <p className="font-medium text-muted-foreground">Mobile</p>
                                            <p>{profile.mobile_number || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-muted-foreground">PAN</p>
                                            <p>{profile.pan_number || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-muted-foreground">Aadhar Number</p>
                                            <p>{profile.aadhar_number || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-muted-foreground">Location</p>
                                            <p>{profile.city_state || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-muted-foreground">Traded Before</p>
                                            <p>{profile.traded_before ? 'Yes' : 'No'}</p>
                                        </div>
                                    </div>
                                    {profile.selfie_url && (
                                         <div className="space-y-2 pt-4 border-t">
                                            <p className="font-medium text-muted-foreground text-sm">Aadhaar Photo</p>
                                            <Image src={profile.selfie_url} alt="User Aadhaar photo" width={200} height={120} className="rounded-md border p-1" />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>Agreements & Trading Background</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-4 pt-4 text-sm">
                                        <div className="space-y-1">
                                            <p className="font-medium text-muted-foreground">Trading Experience</p>
                                            <p>{profile.trading_experience || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-muted-foreground">Comments</p>
                                            <p>{profile.comments || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-muted-foreground">Trading Styles</p>
                                            <p>{profile.trading_style?.join(', ') || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-4 mt-4 border-t text-sm">
                                        <p><strong>Drawdown Rules Accepted:</strong> {profile.drawdown_rules_accepted ? 'Yes' : 'No'}</p>
                                        <p><strong>Risk Rules Understood:</strong> {profile.risk_rules_understood ? 'Yes' : 'No'}</p>
                                        <p><strong>Terms Accepted:</strong> {profile.terms_accepted ? 'Yes' : 'No'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            
                             {/* Purchase Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Purchase Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">{profile.plan_purchased}</p>
                                        <p className="text-sm">₹{profile.plan_price?.toFixed(2) ?? 'N/A'}</p>
                                    </div>
                                    {profile.coupon_code && (
                                    <div className="flex items-center justify-between text-green-600">
                                        <p className="text-sm text-muted-foreground">Coupon "{profile.coupon_code}"</p>
                                        <p className="text-sm">- ₹{profile.discount_amount?.toFixed(2)}</p>
                                    </div>
                                    )}
                                    <div className="flex items-center justify-between border-t pt-4 font-bold">
                                        <p>Final Amount Paid</p>
                                        <p>₹{profile.final_amount_paid?.toFixed(2) ?? 'N/A'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        {/* Right Column */}
                        <div className="space-y-8">
                            {/* User Details */}
                            <Card>
                                <CardHeader>
                                <CardTitle>User Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                                        <p>{profile.full_name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                                        <p>{profile.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Plan</p>
                                        <p>{profile.plan_purchased}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
                                        <p className="truncate">{profile.transaction_id}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            {/* Admin Controls */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Admin Controls</CardTitle>
                                </CardHeader>
                                 <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label htmlFor="is_approved" className="font-semibold">Payment Approved</Label>
                                        <Switch id="is_approved" name="is_approved" defaultChecked={profile.is_approved} />
                                    </div>
                                     <div className="flex items-center justify-between space-x-2">
                                         <Label htmlFor="credentials_provided" className="font-semibold">Credentials Provided</Label>
                                         <Switch id="credentials_provided" name="credentials_provided" defaultChecked={profile.credentials_provided} />
                                     </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="kyc_status" className="font-semibold">KYC Status</Label>
                                        <Select name="kyc_status" defaultValue={profile.kyc_status}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Set Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending Submission</SelectItem>
                                                <SelectItem value="submitted">Submitted for Review</SelectItem>
                                                <SelectItem value="verified">Verified</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 space-y-4">
                                        <div className="flex items-center justify-between space-x-2">
                                            <Label htmlFor="is_breached" className="font-semibold text-destructive flex items-center gap-2">
                                                <ShieldAlert className="h-5 w-5" />
                                                Account Breached
                                            </Label>
                                            <Switch id="is_breached" name="is_breached" defaultChecked={profile.is_breached} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="breach_reason" className="text-destructive">Reason for Breach</Label>
                                            <Textarea 
                                                id="breach_reason" 
                                                name="breach_reason" 
                                                defaultValue={profile.breach_reason || ''}
                                                placeholder="Explain why the account was marked as breached..."
                                                className="bg-background"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="breach_image" className="text-destructive">Breach Proof Image</Label>
                                            <Input id="breach_image" name="breach_image" type="file" accept="image/*" className="bg-background" />
                                            {profile.breach_image_url && (
                                                <div className="mt-2">
                                                    <p className="text-xs text-destructive mb-1">Current Image:</p>
                                                    <Image src={profile.breach_image_url} alt="Breach proof" width={100} height={100} className="rounded-md border" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                             {/* Trading Credentials */}
                             <Card>
                                <CardHeader>
                                    <CardTitle>Trading Credentials</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="trading_username">Trading Username</Label>
                                        <Input id="trading_username" name="trading_username" defaultValue={profile.trading_username || ''} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="trading_password">Trading Password</Label>
                                        <Input id="trading_password" name="trading_password" defaultValue={profile.trading_password || ''} />
                                    </div>
                                </CardContent>
                             </Card>
                            <CardFooter className="mt-8 flex justify-end gap-4">
                                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                                <Button type="submit" size="lg" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </div>
                        </div>
                    </form>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                         <div className="lg:col-span-2" />
                         <div className="space-y-8">
                            <ResetPasswordForm userId={profile.id} role={profile.role}/>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
  );
}
