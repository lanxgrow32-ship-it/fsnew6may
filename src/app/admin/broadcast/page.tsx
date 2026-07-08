
'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { 
    SidebarProvider, 
    Sidebar, 
    SidebarContent, 
    SidebarHeader, 
    SidebarFooter, 
    SidebarMenu, 
    SidebarMenuItem, 
    SidebarMenuButton, 
    SidebarInset, 
    SidebarTrigger 
} from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
    Home, 
    UserCheck, 
    Swords, 
    Users, 
    Ticket, 
    Newspaper, 
    Wallet, 
    Banknote, 
    LineChart, 
    LogOut,
    Send,
    Mail,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    FlaskConical,
    Megaphone
} from 'lucide-react';
import { FundedStockLogo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { signOut } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { getSubscriberEmails, sendBroadcastSignal } from './actions';
import { cn } from '@/lib/utils';

export default function BroadcastPage() {
    const { toast } = useToast();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [testEmail, setTestEmail] = useState('');
    
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'idle' | 'fetching' | 'sending' | 'complete'>('idle');
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
        setStatus('fetching');
        addLog("Fetching subscriber list from database...");

        const emails = await getSubscriberEmails();
        
        if (emails.length === 0) {
            toast({ title: "No Recipients", description: "Could not find any standard users to email.", variant: "destructive" });
            setIsBroadcasting(false);
            setStatus('idle');
            return;
        }

        setStatus('sending');
        addLog(`Found ${emails.length} recipients. Starting dispatch...`);

        let successCount = 0;
        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];
            const res = await sendBroadcastSignal(email, subject, message);
            
            if (res.success) successCount++;
            
            const currentProgress = Math.round(((i + 1) / emails.length) * 100);
            setProgress(currentProgress);
        }

        setStatus('complete');
        addLog(`Broadcast complete. ${successCount}/${emails.length} signals delivered.`, 'success');
        toast({ title: "Broadcast Finalized", description: `${successCount} traders notified.` });
        setIsBroadcasting(false);
    };

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
                        <SidebarMenuItem><SidebarMenuButton href="/admin/dashboard"><Home />Dashboard</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/account-requests"><UserCheck />Account Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/competition"><Swords />Competition</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/pay-later"><Users />Pay Later Users</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/coupons"><Ticket />Coupons</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/blog"><Newspaper />Blog</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/broadcast" isActive><Megaphone className="text-primary" />Broadcast Hub</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/wallet-requests"><Wallet />Wallet Requests</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payouts"><Banknote />Payouts</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/reports"><LineChart />Reports</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payment-settings"><Wallet />Payment Settings</SidebarMenuButton></SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu><SidebarMenuItem><form action={signOut} className="w-full"><SidebarMenuButton asChild><button type="submit" className="w-full"><LogOut />Logout</button></SidebarMenuButton></form></SidebarMenuItem></SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-xl font-bold tracking-tight">Email Broadcast Hub</h1>
                    </div>
                    <ThemeToggle />
                </header>

                <main className="p-4 md:p-8 bg-muted/40 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Editor Section */}
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
                                        <Textarea 
                                            id="message" 
                                            placeholder="Write your email content here..." 
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={12}
                                            className="resize-none leading-relaxed"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Controls Section */}
                        <div className="space-y-6">
                            {/* Test Card */}
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

                            {/* Broadcast Card */}
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
                                            Clicking broadcast will send this email to every active standard trader in the database.
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

                            {/* Console Logs */}
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
                                        <p className="text-[10px] text-gray-800 font-bold uppercase tracking-widest text-center mt-12">Standby for signal...</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
