
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Server as ServerIcon, Eye, EyeOff } from 'lucide-react';

export function CredentialsView({ profile }: { profile: any }) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(prev => !prev);
    };

    return (
        <Card className="w-full shadow-sm">
            <CardHeader>
                <CardTitle>Your Trading Account</CardTitle>
                <CardDescription>Here are your trading account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="rounded-lg border bg-muted/40 p-4">
                    <p className="text-sm font-medium text-muted-foreground">Plan Purchased</p>
                    <p className="text-lg font-semibold">{profile.plan_purchased || 'Not specified'}</p>
                </div>
                {profile.credentials_provided ? (
                    <>
                        <div className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="rounded-lg border bg-muted/40 p-4">
                                    <p className="text-sm font-medium text-muted-foreground">Trading Username</p>
                                    <p className="text-xl font-semibold tracking-wider">{profile.trading_username}</p>
                                </div>
                                <div className="rounded-lg border bg-muted/40 p-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-medium text-muted-foreground">Trading Password</p>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={togglePasswordVisibility}>
                                            {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-xl font-semibold tracking-wider">
                                        {isPasswordVisible ? profile.trading_password : '••••••••••'}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-lg border bg-muted/40 p-4 flex items-center gap-3">
                                <ServerIcon className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Server</p>
                                    <p className="text-lg font-semibold">Falcon Trader</p>
                                </div>
                            </div>
                        </div>
                        <Button asChild size="lg" className="w-full">
                            <Link href="https://nextrade.club/" target="_blank">
                                Launch Trading Software
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                                <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
                                <p className="font-semibold text-yellow-800">Your trading credentials are being set up.</p>
                            </div>
                            <p className="text-sm text-yellow-600 mt-2">Now that your KYC is verified, an admin will provide your credentials shortly. Please check back later.</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
