'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from './actions';

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
};

export default function ProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
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
  }, [params.id, supabase]);

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
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Manage User Profile</CardTitle>
          <CardDescription>Approve users and provide trading credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            
            <div className="space-y-2">
              <h3 className="font-semibold">{profile.full_name} ({profile.email})</h3>
              <p className="text-sm text-muted-foreground">Plan: {profile.plan_purchased}</p>
              <p className="text-sm text-muted-foreground">Transaction ID: {profile.transaction_id}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="is_approved" name="is_approved" defaultChecked={profile.is_approved} />
              <Label htmlFor="is_approved">Approve User</Label>
            </div>

            <div className="space-y-4 rounded-md border p-4">
                 <h4 className="font-medium">Trading Credentials</h4>
                <div className="space-y-2">
                    <Label htmlFor="trading_username">Trading Username</Label>
                    <Input id="trading_username" name="trading_username" defaultValue={profile.trading_username || ''} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="trading_password">Trading Password</Label>
                    <Input id="trading_password" name="trading_password" defaultValue={profile.trading_password || ''} />
                </div>
                 <div className="flex items-center space-x-2">
                    <Switch id="credentials_provided" name="credentials_provided" defaultChecked={profile.credentials_provided} />
                    <Label htmlFor="credentials_provided">Credentials Provided</Label>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
