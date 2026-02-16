
'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { preRegisterForCompetition } from './actions';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ClientOnly } from '@/components/ui/client-only';

function CompetitionSignupForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await preRegisterForCompetition(formData);

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else if (result.redirectUrl) {
            // Redirect to the payment gateway
            window.location.href = result.redirectUrl;
        } else {
            setError('Could not get payment URL. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4 md:py-12">
            <div className="w-full max-w-lg space-y-6">
                <div className="flex justify-center">
                    <Button asChild variant="ghost">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                    <h1 className="text-3xl font-bold mt-4 text-primary">Join the Trading Competition</h1>
                    <p className="text-muted-foreground">
                        Register below to enter the weekly or monthly challenge.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Choose Your Challenge</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup name="plan_type" defaultValue="weekly" className="space-y-4">
                                <Label htmlFor="plan_weekly" className="flex items-center justify-between rounded-lg border p-4 cursor-pointer has-[[data-state=checked]]:border-primary">
                                    <div>
                                        <p className="font-bold">Weekly Challenge</p>
                                        <p className="text-muted-foreground">₹249.00 / week</p>
                                    </div>
                                    <RadioGroupItem value="weekly" id="plan_weekly" />
                                </Label>
                                <Label htmlFor="plan_monthly" className="flex items-center justify-between rounded-lg border p-4 cursor-pointer has-[[data-state=checked]]:border-primary">
                                    <div>
                                        <p className="font-bold">Monthly Challenge</p>
                                        <p className="text-muted-foreground">₹549.00 / month</p>
                                    </div>
                                    <RadioGroupItem value="monthly" id="plan_monthly" />
                                </Label>
                            </RadioGroup>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Details</CardTitle>
                            <CardDescription>This will create your account on FundedStock.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input id="full_name" name="full_name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mobile_number">Mobile Number</Label>
                                <Input id="mobile_number" name="mobile_number" type="tel" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" name="password" type="password" required />
                            </div>

                            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Proceed to Payment'}
                            </Button>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </main>
    );
}

export default function CompetitionPage() {
    return (
        <div className="dark-theme">
            <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}>
                <ClientOnly>
                    <CompetitionSignupForm />
                </ClientOnly>
            </Suspense>
        </div>
    )
}
