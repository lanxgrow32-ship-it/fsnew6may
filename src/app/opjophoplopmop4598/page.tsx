
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { GatewaySwitcher } from './gateway-switcher';
import { Shield } from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function SecretGatewayControlPage() {
    const supabase = createClient();

    const { data: settings, error } = await supabase
        .from('payment_details')
        .select('active_payment_url, primary_payment_url, secondary_payment_url')
        .eq('id', 1)
        .single();
    
    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center p-4">
                <Alert variant="destructive">
                    <AlertTitle>Error Fetching Settings</AlertTitle>
                    <AlertDescription>
                        Could not load payment gateway settings from the database.
                    </AlertDescription>
                </Alert>
            </main>
        )
    }
    
    return (
        <main className="flex min-h-screen items-center justify-center bg-background text-foreground p-4">
            <div className="w-full max-w-xs">
               <GatewaySwitcher currentSettings={settings} />
            </div>
        </main>
    )
}
