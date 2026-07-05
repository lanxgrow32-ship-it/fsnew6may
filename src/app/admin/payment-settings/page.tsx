
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
import { Home, Ticket, Wallet, LogOut, Loader2, Percent, Banknote, LineChart, IndianRupee, Swords, HardDrive, Wifi, Users, Newspaper, UserCheck, ShieldCheck, Zap, Repeat, Settings2, PackageCheck, ShoppingCart } from 'lucide-react';
import { signOut } from '@/app/actions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

type PaymentDetails = {
    id: number;
    upi_id: string;
    qr_code_url: string;
    referral_commission_percentage: number;
    active_payment_gateway: 'lgpay' | 'manual' | 'watchpay' | 'automated' | 'cashfree';
    automated_gateway_mode: 'both' | 'lgpay' | 'watchpay';
    pay_later_upi_id: string | null;
    pay_later_qr_code_url: string | null;
    watchpay_merchant_id: string | null;
    watchpay_api_key: string | null;
    is_ptp_enabled: boolean;
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save All Settings'}
        </Button>
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
                    <CardTitle>Marketplace Inventory</CardTitle>
                    <CardDescription>Control which account models are visible to traders.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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

                    {activeGateway === 'automated' && (
                        <div className="space-y-4 pt-4 border-t border-dashed animate-in fade-in slide-in-from-top-2">
                            <Label className="text-sm font-bold flex items-center gap-2"><Settings2 className="w-4 h-4 text-primary" /> Automated Routing</Label>
                            <RadioGroup name="automated_mode" value={automatedMode} onValueChange={(value: any) => setAutomatedMode(value)} className="grid grid-cols-3 gap-2">
                                <div><RadioGroupItem value="both" id="mode-both" className="sr-only" /><Label htmlFor="mode-both" className={cn("flex items-center justify-center gap-2 rounded-lg border bg-muted/50 p-3 cursor-pointer text-xs font-semibold", automatedMode === 'both' && "bg-primary text-primary-foreground border-primary")}>50/50 Split</Label></div>
                                <div><RadioGroupItem value="lgpay" id="mode-lg" className="sr-only" /><Label htmlFor="mode-lg" className={cn("flex items-center justify-center gap-2 rounded-lg border bg-muted/50 p-3 cursor-pointer text-xs font-semibold", automatedMode === 'lgpay' && "bg-primary text-primary-foreground border-primary")}>LGPay Only</Label></div>
                                <div><RadioGroupItem value="watchpay" id="mode-wp" className="sr-only" /><Label htmlFor="mode-wp" className={cn("flex items-center justify-center gap-2 rounded-lg border bg-muted/50 p-3 cursor-pointer text-xs font-semibold", automatedMode === 'watchpay' && "bg-primary text-primary-foreground border-primary")}>WatchPay Only</Label></div>
                            </RadioGroup>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Manual Payment Details</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label htmlFor="upi_id">Standard UPI ID</Label>
                        <Input id="upi_id" name="upi_id" defaultValue={currentSettings?.upi_id || ''} placeholder="your-upi@okhdfc" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="pay_later_upi_id">Pay Later UPI ID</Label>
                        <Input id="pay_later_upi_id" name="pay_later_upi_id" defaultValue={currentSettings?.pay_later_upi_id || ''} placeholder="pay-later@oksbi" />
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
            const { data } = await supabase.from('payment_details').select('*').eq('id', 1).single();
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
                        <SidebarMenuItem><SidebarMenuButton href="/admin/payment-settings" isActive tooltip="Payment Settings"><Wallet />Payment Settings</SidebarMenuButton></SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu><SidebarMenuItem><form action={signOut} className="w-full"><SidebarMenuButton tooltip="Logout" asChild><button type="submit" className="w-full"><LogOut />Logout</button></SidebarMenuButton></form></SidebarMenuItem></SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4"><SidebarTrigger className="md:hidden" /><h1 className="text-xl font-semibold">Payment Settings</h1></div>
                    <ThemeToggle />
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
                    <div className="max-w-2xl mx-auto">
                        {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary"/></div> : <PaymentSettingsForm currentSettings={settings} />}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
