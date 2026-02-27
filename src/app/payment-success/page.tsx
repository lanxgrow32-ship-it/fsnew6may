
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

// This page is now deprecated for the automatic flow but can serve as a fallback.
// The new manual flow redirects users to /welcome where they see their pending status.
export default async function PaymentSuccessPage({ searchParams }: { searchParams: { order_id?: string, transaction_id?: string } }) {

    // You could add logic here to check the status of the order_id if needed,
    // but for the manual flow, this page is less critical.
    const isSuccess = searchParams.order_id;

    if (isSuccess) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="mt-4 text-2xl">Registration Submitted!</CardTitle>
                        <CardDescription>
                            Your registration has been submitted for verification. An admin will review it shortly.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            You can now log in to check the status of your account.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button asChild className="w-full" size="lg">
                            <Link href="/login">Go to Login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        );
    }

    // Failed or Error status
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                        <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Something Went Wrong</CardTitle>
                    <CardDescription>
                        There was an issue processing your registration.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                       Please try signing up again. If the problem persists, contact our support team.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button asChild className="w-full" size="lg" variant="secondary">
                        <Link href="/login">Go to Login</Link>
                    </Button>
                    <Button asChild className="w-full" size="lg" variant="outline">
                        <Link href="/pricing">View Plans and Try Again</Link>
                    </Button>
                </CardFooter>
            </Card>
        </main>
    );
}
