
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { GatewaySwitcher } from './gateway-switcher';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

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
        <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-destructive" />
                        Secret Gateway Control
                    </CardTitle>
                    <CardDescription>
                        This is a hidden control panel for the platform owner. Use this to switch the active payment gateway for new user signups.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <GatewaySwitcher currentSettings={settings} />
                </CardContent>
            </Card>
        </main>
    )
}
