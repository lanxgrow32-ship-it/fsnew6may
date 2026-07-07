'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, BrainCircuit, Send, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import { testAiSupport } from './actions';
import { cn } from '@/lib/utils';

export default function AiTestingPage() {
    const [message, setMessage] = useState('');
    const [result, setResult] = useState<{ success?: boolean; response?: string; error?: string; details?: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleTest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isPending) return;

        startTransition(async () => {
            const res = await testAiSupport(message);
            setResult(res);
        });
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white font-poppins p-4 md:p-12 flex items-center justify-center relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-primary/20 rounded-full filter blur-3xl opacity-20" />

            <div className="w-full max-w-2xl relative z-10 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-2">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 mx-auto mb-4 shadow-[0_0_40px_rgba(139,44,245,0.2)]">
                        <BrainCircuit className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter">NEURAL PROBE TERMINAL</h1>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em]">Direct AI Flow Diagnostic — v1.0</p>
                </div>

                <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
                    <CardHeader className="border-b border-white/5 pb-6">
                        <CardTitle className="text-white text-lg font-bold">Input Protocol</CardTitle>
                        <CardDescription className="text-gray-500">Test the AI's logic without database constraints.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleTest} className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Diagnostic Message</Label>
                                <Input 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="e.g. Help me with KYC issues..."
                                    className="bg-black/40 border-white/10 h-14 text-white text-base rounded-2xl focus:ring-primary/50"
                                    disabled={isPending}
                                />
                            </div>
                            <Button type="submit" disabled={isPending || !message.trim()} className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20">
                                {isPending ? <Loader2 className="animate-spin h-5 w-5 mr-2"/> : <Activity className="h-5 w-5 mr-2" />}
                                Fire Neural Probe
                            </Button>
                        </form>

                        {result && (
                            <div className="mt-10 space-y-6 animate-in slide-in-from-top-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-px flex-1 bg-white/5" />
                                    <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.5em]">Result Received</span>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>

                                {result.success ? (
                                    <div className="space-y-4">
                                        <Alert className="bg-green-500/10 border-green-500/20 text-green-400 rounded-2xl">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <AlertTitle className="font-black uppercase tracking-widest text-[10px]">Signal Success</AlertTitle>
                                            <AlertDescription className="text-xs font-medium opacity-80">The model responded successfully.</AlertDescription>
                                        </Alert>
                                        <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl relative group">
                                            <p className="text-sm leading-relaxed text-gray-200 italic">
                                                "{result.response}"
                                            </p>
                                            <div className="absolute top-[-10px] left-6 px-2 bg-slate-950 text-primary text-[8px] font-black uppercase tracking-widest">Model Response</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-2xl">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle className="font-black uppercase tracking-widest text-[10px]">Signal Interrupted</AlertTitle>
                                            <AlertDescription className="text-xs font-medium opacity-80">{result.error}</AlertDescription>
                                        </Alert>
                                        {result.details && (
                                            <div className="p-4 bg-black/60 rounded-xl border border-white/5 overflow-x-auto">
                                                <pre className="text-[10px] text-gray-500 font-mono">
                                                    {result.details}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-gray-700 font-black text-[9px] uppercase tracking-[0.4em]">
                    Internal Diagnostic Tools · FundedStock Infrastructure
                </p>
            </div>
        </main>
    );
}
