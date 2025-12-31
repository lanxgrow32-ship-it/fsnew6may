
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Payment Successful!</CardTitle>
                    <CardDescription>
                        Your account has been created and your payment was processed successfully.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        The next step is to complete your KYC verification. Please log in to your new account to continue.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button asChild className="w-full" size="lg">
                        <Link href="/login">Log In and Complete KYC</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="https://www.fundedstock.io/">Back to Main Site</Link>
                    </Button>
                </CardFooter>
            </Card>
        </main>
    );
}
