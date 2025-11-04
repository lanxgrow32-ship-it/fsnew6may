
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

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
  pan_card_url: string;
  aadhar_card_url: string;
  selfie_url: string;
  city_state: string;
  traded_before: boolean;
  trading_experience: string;
  comments: string;
  trading_style: string[];
  drawdown_rules_accepted: boolean;
  risk_rules_understood: boolean;
  terms_accepted: boolean;
};

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Manage User Profile</CardTitle>
            <CardDescription>Approve users, review KYC, and provide trading credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Details */}
              <Card>
                <CardHeader>
                  <CardTitle>User Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p><strong>Name:</strong> {profile.full_name}</p>
                  <p><strong>Email:</strong> {profile.email}</p>
                  <p><strong>Plan:</strong> {profile.plan_purchased}</p>
                  <p><strong>Transaction ID:</strong> {profile.transaction_id}</p>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch id="is_approved" name="is_approved" defaultChecked={profile.is_approved} />
                    <Label htmlFor="is_approved">Payment Approved</Label>
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
                  <div className="flex items-center space-x-2 pt-2">
                      <Switch id="credentials_provided" name="credentials_provided" defaultChecked={profile.credentials_provided} />
                      <Label htmlFor="credentials_provided">Credentials Provided</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* KYC Details */}
            {profile.kyc_status === 'submitted' || profile.kyc_status === 'verified' || profile.kyc_status === 'rejected' ? (
                <Card>
                    <CardHeader>
                        <CardTitle>KYC Verification Details</CardTitle>
                        <div className="flex items-center gap-4 pt-2">
                          <Label htmlFor="kyc_status">KYC Status</Label>
                           <Select name="kyc_status" defaultValue={profile.kyc_status}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Set Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="submitted">Submitted</SelectItem>
                                    <SelectItem value="verified">Verified</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <p><strong>Mobile:</strong> {profile.mobile_number}</p>
                            <p><strong>PAN:</strong> {profile.pan_number}</p>
                            <p><strong>Aadhar:</strong> {profile.aadhar_number}</p>
                            <p><strong>Location:</strong> {profile.city_state}</p>
                            <p><strong>Traded Before:</strong> {profile.traded_before ? 'Yes' : 'No'}</p>
                       </div>
                       <div className="space-y-2">
                            <p><strong>Trading Experience:</strong> {profile.trading_experience}</p>
                            <p><strong>Comments:</strong> {profile.comments || 'N/A'}</p>
                            <p><strong>Trading Styles:</strong> {profile.trading_style?.join(', ')}</p>
                       </div>
                       <div className="space-y-2">
                           <p><strong>Drawdown Rules Accepted:</strong> {profile.drawdown_rules_accepted ? 'Yes' : 'No'}</p>
                           <p><strong>Risk Rules Understood:</strong> {profile.risk_rules_understood ? 'Yes' : 'No'}</p>
                           <p><strong>Terms Accepted:</strong> {profile.terms_accepted ? 'Yes' : 'No'}</p>
                       </div>
                        <div className="flex gap-4 pt-4">
                            {profile.pan_card_url && <Button asChild variant="outline"><Link href={profile.pan_card_url} target="_blank">View PAN Card</Link></Button>}
                            {profile.aadhar_card_url && <Button asChild variant="outline"><Link href={profile.aadhar_card_url} target="_blank">View Aadhar Card</Link></Button>}
                            {profile.selfie_url && <Button asChild variant="outline"><Link href={profile.selfie_url} target="_blank">View Selfie</Link></Button>}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>KYC Verification</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">User has not submitted KYC details yet.</p>
                    </CardContent>
                </Card>
            )}

          </CardContent>
          <CardFooter className="flex justify-end gap-4 pt-6">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}

