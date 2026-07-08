
'use client';
import { useState, useEffect, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { updatePaymentSettings } from './actions';
import { cn } from '@/lib/utils';

import Link from 'next/link';
import Image from 'next/image';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { FundedStockLogo } from '@/components/ui/logo';
import { 
    Home, 
    Ticket, 
    Wallet, 
    LogOut, 
    Loader2, 
    Percent, 
    Banknote, 
    LineChart, 
    IndianRupee, 
    Swords, 
    HardDrive, 
    Wifi, 
    Users, 
    Newspaper, 
    UserCheck, 
    ShieldCheck, 
    Zap, 
    Repeat, 
    Settings2, 
    PackageCheck, 
    ShoppingCart, 
    BrainCircuit, 
    UploadCloud,
    Megaphone,
    Mail,
    Send,
    FlaskConical
} from 'lucide-react';
import { signOut } from '@/app/actions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { getSubscriberEmails, sendBroadcastSignal } from '../broadcast/actions';

type PaymentDetails = {
    id: number;
    upi_id: string;
    qr_code_url: string;
    referral_commission_percentage: number;
    active_payment_gateway: 'lgpay' | 'manual' | 'watchpay' | 'automated' | 'cashfree';
    automated_gateway_mode: 'both' | 'lgpay' | 'watchpay';
    pay_later_upi_id: string | null;
    pay_later_qr_code_url: string | null;
    is_ptp_enabled: boolean;
    is_ai_support_enabled: boolean;
    watchpay_merchant_id?: string;
    watchpay_api_key?: string;
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save All Settings'}
        </Button>
    );
}

function BroadcastHub() {
    const { toast } = useToast();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [testEmail, setTestEmail] = useState('');
    
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'error'}[]>([]);

    const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        setLogs(prev => [{msg, type}, ...prev].slice(0, 5));
    };

    const handleSendTest = async () => {
        if (!testEmail || !subject || !message) {
            toast({ title: "Incomplete Form", description: "Subject, message, and test email are required.", variant: "destructive" });
            return;
        }

        setIsTesting(true);
        addLog(`Initiating test to ${testEmail}...`);
        
        const res = await sendBroadcastSignal(testEmail, subject, message);
        
        if (res.success) {
            toast({ title: "Test Signal Sent!", description: `Check ${testEmail} for the broadcast preview.` });
            addLog(`Test successful for ${testEmail}`, 'success');
        } else {
            toast({ title: "Test Failed", description: res.error, variant: "destructive" });
            addLog(`Test failed: ${res.error}`, 'error');
        }
        setIsTesting(false);
    };

    const handleStartBroadcast = async () => {
        if (!subject || !message) {
            toast({ title: "Required Fields", description: "Subject and message cannot be empty.", variant: "destructive" });
            return;
        }

        if (!confirm("Are you sure you want to broadcast this message to ALL standard traders?")) return;

        setIsBroadcasting(true);
        addLog("Fetching subscriber list from database...");

        const emails = await getSubscriberEmails();
        
        if (emails.length === 0) {
            toast({ title: "No Recipients", description: "Could not find any standard users to email.", variant: "destructive" });
            setIsBroadcasting(false);
            return;
        }

        addLog(`Found ${emails.length} recipients. Starting dispatch...`);

        let successCount = 0;
        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];
            const res = await sendBroadcastSignal(email, subject, message);
            
            if (res.success) successCount++;
            
            const currentProgress = Math.round(((i + 1) / emails.length) * 100);
            setProgress(currentProgress);
        }

        addLog(`Broadcast complete. ${successCount}/${emails.length} signals delivered.`, 'success');
        toast({ title: "Broadcast Finalized", description: `${successCount} traders notified.` });
        setIsBroadcasting(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-xl border-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary" />
                            Compose Broadcast
                        </CardTitle>
                        <CardDescription>Craft your message to the trader community. Use plain text or Markdown.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Email Subject</Label>
                            <Input 
                                id="subject" 
                                placeholder="e.g. Weekly Market Analysis & Payout Schedule" 
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="h-12 text-lg font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message Body</Label>
                            <textarea 
                                id="message" 
                                placeholder="Write your email content here..." 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={12}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none leading-relaxed"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-amber-400" />
                            Testing Protocol
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] text-gray-500 uppercase">Test Recipient</Label>
                            <Input 
                                placeholder="test@example.com" 
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={handleSendTest} 
                            disabled={isTesting || isBroadcasting}
                            className="w-full h-11 border-amber-500/20 text-amber-500 hover:bg-amber-500/10 font-bold"
                        >
                            {isTesting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Send className="mr-2 h-4 w-4" />}
                            Send Test Email
                        </Button>
                    </CardContent>
                </Card>

                <Card className={cn("border-primary/20", isBroadcasting && "bg-primary/5")}>
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            <Megaphone className="w-4 h-4 text-primary" />
                            Mass Dispatch
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                Broadcast will send this email to every active standard trader.
                            </p>
                        </div>

                        {isBroadcasting && (
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase text-primary">
                                    <span>Progress</span>
                                    <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                            </div>
                        )}

                        <Button 
                            onClick={handleStartBroadcast} 
                            disabled={isBroadcasting || isTesting}
                            className="w-full h-14 text-base font-bold shadow-xl shadow-primary/20"
                        >
                            {isBroadcasting ? <Loader2 className="animate-spin mr-2 h-5 w-5"/> : <Send className="mr-2 h-5 w-5" />}
                            Launch Broadcast
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-black border-white/5">
                    <CardHeader className="py-3 border-b border-white/5">
                        <CardTitle className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Protocol Monitor</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 h-48 overflow-y-auto space-y-2">
                        {logs.length > 0 ? logs.map((log, i) => (
                            <div key={i} className="flex gap-2 text-[11px] font-mono leading-tight animate-in slide-in-from-left-2">
                                <span className="text-gray-700">[{new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'})}]</span>
                                <span className={cn(
                                    log.type === 'error' ? 'text-red-400' : 
                                    log.type === 'success' ? 'text-green-400' : 'text-gray-400'
                                )}>{log.msg}</span>
                            </div>
                        )) : (
                            <p className="text-[10px] text-gray-800 font-bold uppercase tracking-widest text-center mt-12">Standby...</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function PaymentSettingsForm({ currentSettings }: { currentSettings: PaymentDetails | null }) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(updatePaymentSettings, { error: null, success: null });
    
    const [activeGateway, setActiveGateway] = useState<'lgpay' | 'manual' | 'watchpay' | 'automated' | 'cashfree'>(currentSettings?.active_payment_gateway || 'manual');
    const [automatedMode, setAutomatedMode] = useState<'both' | 'lgpay' | 'watchpay'>(currentSettings?.automated_gateway_mode || 'both');

    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.error) {
            toast({ title: 'Error', description: state.error, variant: 'destructive' });
        }
        if (state.success) {
            toast({ title: 'Success', description: state.success });
        }
    }, [state, toast]);
    
    return (
        <form ref={formRef} action={formAction} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Global Automation</CardTitle>
                    <CardDescription>Configure AI assistants and marketplace visibility.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-white/5">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold flex items-center gap-2">
                                <BrainCircuit className="w-4 h-4 text-primary" />
                                AI Support Mode
                            </Label>
                            <p className="text-xs text-muted-foreground">If enabled, the AI will auto-reply to traders with live database context.</p>
                        </div>
                        <Switch name="is_ai_support_enabled" defaultChecked={currentSettings?.is_ai_support_enabled ?? false} />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-white/5">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold flex items-center gap-2">
                                <PackageCheck className="w-4 h-4 text-primary" />
                                PassThenPay Availability
                            </Label>
                            <p className="text-xs text-muted-foreground">If disabled, PTP plans will vanish from the marketplace.</p>
                        </div>
                        <Switch name="is_ptp_enabled" defaultChecked={currentSettings?.is_ptp_enabled ?? true} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Active Payment Strategy</CardTitle>
                    <CardDescription>Choose how direct plan purchases are processed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     <RadioGroup 
                        name="active_gateway"
                        value={activeGateway}
                        onValueChange={(value: any) => setActiveGateway(value)}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                     >
                        <div>
                             <RadioGroupItem value="automated" id="gateway-automated" className="sr-only" />
                             <Label htmlFor="gateway-automated" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground cursor-pointer h-32 transition-all", activeGateway === 'automated' && "border-primary bg-primary/5")}>
                                <Zap className={cn("mb-2 h-6 w-6", activeGateway === 'automated' ? "text-primary" : "text-muted-foreground")} />
                                <span className="text-center font-bold text-lg">Automated</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">LGPay + WatchPay</span>
                            </Label>
                        </div>
                        <div>
                             <RadioGroupItem value="cashfree" id="gateway-cashfree" className="sr-only" />
                             <Label htmlFor="gateway-cashfree" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground cursor-pointer h-32 transition-all", activeGateway === 'cashfree' && "border-primary bg-primary/5")}>
                                <ShoppingCart className={cn("mb-2 h-6 w-6", activeGateway === 'cashfree' ? "text-primary" : "text-muted-foreground")} />
                                <span className="text-center font-bold text-lg">Cashfree</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">External Portal</span>
                            </Label>
                        </div>
                         <div>
                            <RadioGroupItem value="manual" id="gateway-manual" className="sr-only" />
                             <Label htmlFor="gateway-manual" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground cursor-pointer h-32 transition-all", activeGateway === 'manual' && "border-primary bg-primary/5")}>
                                <HardDrive className={cn("mb-2 h-6 w-6", activeGateway === 'manual' ? "text-primary" : "text-muted-foreground")} />
                                <span className="text-center font-bold text-lg">Manual UPI</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Verification Required</span>
                            </Label>
                        </div>
                    </RadioGroup>

                    {(activeGateway === 'automated' || activeGateway === 'watchpay') && (
                        <div className="space-y-6 pt-6 border-t border-dashed animate-in fade-in slide-in-from-top-2">
                             <Label className="text-sm font-bold flex items-center gap-2"><Settings2 className="w-4 h-4 text-primary" /> Gateway Credentials</Label>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="watchpay_merchant_id">WatchPay Merchant ID</Label>
                                    <Input id="watchpay_merchant_id" name="watchpay_merchant_id" defaultValue={currentSettings?.watchpay_merchant_id || ''} placeholder="M123456" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="watchpay_api_key">WatchPay API Key</Label>
                                    <Input id="watchpay_api_key" name="watchpay_api_key" defaultValue={currentSettings?.watchpay_api_key || ''} placeholder="api_key_..." />
                                </div>
                             </div>

                             {activeGateway === 'automated' && (
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">Routing Strategy</Label>
                                    <RadioGroup name="automated_mode" value={automatedMode} onValueChange={(value: any) => setAutomatedMode(value)} className="grid grid-cols-3 gap-2">
                                        <div><RadioGroupItem value="both" id="mode-both" className="sr-only" /><Label htmlFor="mode-both" className={cn("flex items-center justify-center gap-2 rounded-lg border bg-muted/50 p-3 cursor-pointer text-xs font-semibold", automatedMode === 'both' && "bg-primary text-primary-foreground border-primary")}>50/50 Split</Label></div>
                                        <div><RadioGroupItem value="lgpay" id="mode-lg" className="sr-only" /><Label htmlFor="mode-lg" className={cn("flex items-center justify-center gap-2 rounded-lg border bg-muted/50 p-3 cursor-pointer text-xs font-semibold", automatedMode === 'lgpay' && "bg-primary text-primary-foreground border-primary")}>LGPay Only</Label></div>
                                        <div><RadioGroupItem value="watchpay" id="mode-wp" className="sr-only" /><Label htmlFor="mode-wp" className={cn("flex items-center justify-center gap-2 rounded-lg border bg-muted/50 p-3 cursor-pointer text-xs font-semibold", automatedMode === 'watchpay' && "bg-primary text-primary-foreground border-primary")}>WatchPay Only</Label></div>
                                    </RadioGroup>
                                </div>
                             )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Manual Payment Details</CardTitle>
                    <CardDescription>Setup standard and pay-later manual verification gateways.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Standard UPI */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="upi_id">Standard UPI ID</Label>
                                <Input id="upi_id" name="upi_id" defaultValue={currentSettings?.upi_id || ''} placeholder="your-upi@okhdfc" />
                            </div>
                            <div className="space-y-2">
                                <Label>Standard QR Code</Label>
                                <div className="flex items-center gap-4">
                                    {currentSettings?.qr_code_url && (
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                                            <Image src={currentSettings.qr_code_url} alt="Current QR" fill className="object-cover" />
                                        </div>
                                    )}
                                    <Input name="qr_code" type="file" accept="image/*" className="flex-1" />
                                </div>
                            </div>
                        </div>

                        {/* Pay Later UPI */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="pay_later_upi_id">Pay Later UPI ID</Label>
                                <Input id="pay_later_upi_id" name="pay_later_upi_id" defaultValue={currentSettings?.pay_later_upi_id || ''} placeholder="pay-later@oksbi" />
                            </div>
                            <div className="space-y-2">
                                <Label>Pay Later QR Code</Label>
                                <div className="flex items-center gap-4">
                                    {currentSettings?.pay_later_qr_code_url && (
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                                            <Image src={currentSettings.pay_later_qr_code_url} alt="Current PTP QR" fill className="object-cover" />
                                        </div>
                                    )}
                                    <Input name="pay_later_qr_code" type="file" accept="image/*" className="flex-1" />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader><CardTitle>Referral Commission</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="referral_commission_percentage">Commission (%)</Label>
                        <Input id="referral_commission_percentage" name="referral_commission_percentage" type="number" defaultValue={currentSettings?.referral_commission_percentage ?? 10} min="0" max="100" step="0.1" />
                    </div>
                </CardContent>
            </Card>
            <div className="flex justify-end"><SubmitButton /></div>
        </form>
    );
}


export default function PaymentSettingsPage() {
    const supabase = createClient();
    const [settings, setSettings] = useState<PaymentDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await (await supabase).from('payment_details').select('*').eq('id', 1).single();
            if (data) setSettings(data as PaymentDetails);
            setIsLoading(false);
        };
        fetchSettings();
    }, [supabase]);

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="border-b p-4 h-[57px] flex items-center">
                    <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg">
                        <FundedStockLogo className="w-8 h-8 text-primary" />
                        <span className="text-foreground group-[[data-state=collapsed]]:hidden">FundedStock 2.0</span>
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/dashboard" tooltip="Dashboard"><Home />Dashboard</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/account-requests" tooltip="Account Requests"><UserCheck />Account Requests</SidebarMenuButton></SidebarMenuItem>
                         <SidebarMenuItem><SidebarMenuButton href="/admin/competition" tooltip="Competition"><Swords />Competition</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/pay-later" tooltip="Pay Later Users"><Users />Pay Later Users</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/coupons" tooltip="Coupons"><Ticket />Coupons</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/blog" tooltip="Blog"><Newspaper />Blog</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/wallet-requests" tooltip="Wallet Requests"><Wallet />Wallet Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payouts" tooltip="Payouts"><Banknote />Payouts</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/reports" tooltip="Reports"><LineChart />Reports</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payment-settings" isActive tooltip="Settings & Broadcast"><Wallet />Settings</SidebarMenuButton></SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu><SidebarMenuItem><form action={signOut} className="w-full"><SidebarMenuButton tooltip="Logout" asChild><button type="submit" className="w-full"><LogOut />Logout</button></SidebarMenuButton></form></SidebarMenuItem></SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4"><SidebarTrigger className="md:hidden" /><h1 className="text-xl font-semibold">Admin Command Center</h1></div>
                    <ThemeToggle />
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
                    <Tabs defaultValue="settings" className="w-full space-y-8">
                        <TabsList className="bg-background border border-white/5 h-12 p-1 gap-2">
                            <TabsTrigger value="settings" className="rounded-md font-bold px-8">Gateways & Global</TabsTrigger>
                            <TabsTrigger value="broadcast" className="rounded-md font-bold px-8 flex items-center gap-2">
                                <Megaphone className="w-4 h-4 text-primary" />
                                Email Broadcast
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="settings" className="animate-in fade-in slide-in-from-left-2">
                            <div className="max-w-4xl mx-auto">
                                {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary"/></div> : <PaymentSettingsForm currentSettings={settings} />}
                            </div>
                        </TabsContent>

                        <TabsContent value="broadcast" className="animate-in fade-in slide-in-from-right-2">
                            <BroadcastHub />
                        </TabsContent>
                    </Tabs>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
