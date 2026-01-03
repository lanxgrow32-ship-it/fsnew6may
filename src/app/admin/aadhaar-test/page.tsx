'use client';

import { useState, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { sendAadhaarOtp, verifyAadhaarOtp } from './actions';
import { Separator } from '@/components/ui/separator';

function SendOtpForm({ onOtpSent }: { onOtpSent: (refId: string, aadhaar: string) => void }) {
    const [state, formAction] = useActionState(sendAadhaarOtp, { error: null, success: false, refId: null, aadhaarNumber: null });
    const { pending } = useFormStatus();

    if (state.success && state.refId && state.aadhaarNumber) {
        onOtpSent(state.refId, state.aadhaarNumber);
    }
    
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
            <Button type="submit" className="w-full" disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
            </Button>
        </form>
    );
}

function VerifyOtpForm({ refId, aadhaarNumber, onVerified }: { refId: string; aadhaarNumber: string; onVerified: (data: any) => void }) {
    const [state, formAction] = useActionState(verifyAadhaarOtp, { error: null, success: false, data: null });
    const { pending } = useFormStatus();
    
    if (state.success && state.data) {
        onVerified(state.data);
    }

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="ref_id" value={refId} />
            <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>OTP Sent!</AlertTitle>
                <AlertDescription>
                    An OTP has been sent to the mobile number linked with Aadhaar ending in ...{aadhaarNumber.slice(-4)}.
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

            <Button type="submit" className="w-full" disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Aadhaar
            </Button>
        </form>
    );
}


export default function AadhaarTestPage() {
    const [step, setStep] = useState<'send' | 'verify' | 'result'>('send');
    const [refId, setRefId] = useState('');
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [verifiedData, setVerifiedData] = useState<any>(null);

    const handleOtpSent = (newRefId: string, newAadhaarNumber: string) => {
        setRefId(newRefId);
        setAadhaarNumber(newAadhaarNumber);
        setStep('verify');
    };
    
    const handleVerified = (data: any) => {
        setVerifiedData(data);
        setStep('result');
    }

    const resetFlow = () => {
        setStep('send');
        setRefId('');
        setAadhaarNumber('');
        setVerifiedData(null);
    }

    const renderContent = () => {
        switch (step) {
            case 'send':
                return <SendOtpForm onOtpSent={handleOtpSent} />;
            case 'verify':
                return <VerifyOtpForm refId={refId} aadhaarNumber={aadhaarNumber} onVerified={handleVerified} />;
            case 'result':
                return (
                    <div className="space-y-4">
                        <Alert variant={verifiedData ? 'default' : 'destructive'} className={verifiedData ? 'border-green-500 text-green-700' : ''}>
                           {verifiedData ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                           <AlertTitle>{verifiedData ? 'Aadhaar Verified Successfully' : 'Verification Failed'}</AlertTitle>
                        </Alert>
                       
                        {verifiedData && (
                             <Card className="bg-muted/50">
                                 <CardHeader><CardTitle className="text-base">Verified Data</CardTitle></CardHeader>
                                <CardContent className="text-sm space-y-2">
                                     <p><strong>Name:</strong> {verifiedData.name}</p>
                                     <p><strong>Gender:</strong> {verifiedData.gender}</p>
                                     <p><strong>DOB:</strong> {verifiedData.dob}</p>
                                     <p><strong>Address:</strong> {verifiedData.address}</p>
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
