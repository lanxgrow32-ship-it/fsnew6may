
'use client';

import { useState, useActionState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { sendAadhaarOtp, verifyAadhaarOtp } from './actions';

// This component handles the first step: sending the OTP
function SendOtpForm({ onOtpSent }: { onOtpSent: (requestId: string, aadhaar: string) => void }) {
    const [state, formAction, isPending] = useActionState(sendAadhaarOtp, { error: null, success: false, requestId: null, aadhaarNumber: null });

    useEffect(() => {
        if (state.success && state.requestId && state.aadhaarNumber) {
            onOtpSent(state.requestId, state.aadhaarNumber);
        }
    }, [state.success, state.requestId, state.aadhaarNumber, onOtpSent]);
    
    return (
        <form action={formAction} className="space-y-4">
             {state.error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}
            <div className="space-y-2">
                <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                <Input
                    id="aadhaar_number"
                    name="aadhaar_number"
                    placeholder="Enter 12-digit Aadhaar number"
                    maxLength={12}
                    required
                />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
            </Button>
        </form>
    );
}

// This component handles the second step: verifying the OTP
function VerifyOtpForm({ requestId, aadhaarNumber, onVerified }: { requestId: string; aadhaarNumber: string; onVerified: (data: any) => void }) {
    const initialState = { error: null, success: false, data: null, requestId, aadhaarNumber };
    const [state, formAction, isPending] = useActionState(verifyAadhaarOtp, initialState);
    
    useEffect(() => {
        if (state.success && state.data) {
            onVerified(state.data);
        }
    }, [state.success, state.data, onVerified]);

    return (
        <form action={formAction} className="space-y-4">
            {/* Hidden inputs to pass necessary data to the server action */}
            <input type="hidden" name="request_id" value={requestId} />
            <input type="hidden" name="aadhaar_number" value={aadhaarNumber} />

            <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>OTP Sent!</AlertTitle>
                <AlertDescription>
                    An OTP has been sent to the mobile number linked with Aadhaar number {aadhaarNumber}.
                </AlertDescription>
            </Alert>

            {state.error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}

            <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                    id="otp"
                    name="otp"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Aadhaar
            </Button>
        </form>
    );
}

// Main page component to manage the flow
export default function AadhaarTestPage() {
    const [step, setStep] = useState<'send' | 'verify' | 'result'>('send');
    const [requestId, setRequestId] = useState('');
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [verifiedData, setVerifiedData] = useState<any>(null);

    // Callback when OTP is successfully sent
    const handleOtpSent = (newRequestId: string, newAadhaarNumber: string) => {
        setRequestId(newRequestId);
        setAadhaarNumber(newAadhaarNumber);
        setStep('verify');
    };
    
    // Callback when Aadhaar is successfully verified
    const handleVerified = (data: any) => {
        setVerifiedData(data);
        setStep('result');
    }

    // Function to restart the process
    const resetFlow = () => {
        setStep('send');
        setRequestId('');
        setAadhaarNumber('');
        setVerifiedData(null);
    }

    const renderContent = () => {
        switch (step) {
            case 'send':
                return <SendOtpForm onOtpSent={handleOtpSent} />;
            case 'verify':
                return <VerifyOtpForm requestId={requestId} aadhaarNumber={aadhaarNumber} onVerified={handleVerified} />;
            case 'result':
                 const details = verifiedData?.aadhaar_details;
                return (
                    <div className="space-y-4">
                        <Alert variant={verifiedData ? 'default' : 'destructive'} className={verifiedData ? 'border-green-500 text-green-700' : ''}>
                           {verifiedData ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                           <AlertTitle>{verifiedData ? 'Aadhaar Verified Successfully' : 'Verification Failed'}</AlertTitle>
                        </Alert>
                       
                        {details && (
                             <Card className="bg-muted/50">
                                 <CardHeader><CardTitle className="text-base">Verified Data</CardTitle></CardHeader>
                                <CardContent className="text-sm space-y-2">
                                     <p><strong>Name:</strong> {details.full_name}</p>
                                     <p><strong>Gender:</strong> {details.gender}</p>
                                     <p><strong>DOB:</strong> {details.dob}</p>
                                     <p><strong>Address:</strong> {details.address_details?.address_line}</p>
                                </CardContent>
                             </Card>
                        )}
                         <pre className="mt-4 p-4 rounded-md bg-slate-950 text-slate-50 text-xs overflow-x-auto">
                            {JSON.stringify(verifiedData || { error: 'No data returned'}, null, 2)}
                        </pre>
                         <Button onClick={resetFlow} variant="outline" className="w-full">Start New Verification</Button>
                    </div>
                );
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Aadhaar OTP Verification Test</CardTitle>
                    <CardDescription>
                        Use this page to test the IMB Aadhaar OTP verification flow.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   {renderContent()}
                </CardContent>
            </Card>
        </main>
    );
}
