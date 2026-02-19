
'use client';
import { useState, useEffect, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { updatePaymentSettings } from './actions';

import Link from 'next/link';
import Image from 'next/image';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { FundedStockLogo } from '@/components/ui/logo';
import { Home, Ticket, Wallet, LogOut, Loader2, Percent, Banknote, MessageSquare, LineChart, IndianRupee, Swords, Link2 } from 'lucide-react';
import { signOut } from '@/app/actions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

type PaymentDetails = {
    id: number;
    upi_id: string;
    qr_code_url: string;
    referral_commission_percentage: number;
    usdt_to_inr_rate: number;
    crypto_wallet_address: string;
    crypto_qr_code_url: string;
    is_upi_enabled: boolean;
    is_crypto_enabled: boolean;
    primary_payment_url: string | null;
    secondary_payment_url: string | null;
    active_payment_url: 'primary' | 'secondary' | null;
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
    
    const [upiQrPreview, setUpiQrPreview] = useState<string | null>(currentSettings?.qr_code_url || null);
    const [cryptoQrPreview, setCryptoQrPreview] = useState<string | null>(currentSettings?.crypto_qr_code_url || null);
    
    const formRef = useRef<HTMLFormElement>(null);


    useEffect(() => {
        if (state.error) {
            toast({ title: 'Error', description: state.error, variant: 'destructive' });
        }
        if (state.success) {
            toast({ title: 'Success', description: state.success });
        }
    }, [state, toast]);
    
    const handleUpiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUpiQrPreview(URL.createObjectURL(file));
        }
    }
    
    const handleCryptoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCryptoQrPreview(URL.createObjectURL(file));
        }
    }

    return (
        <form ref={formRef} action={formAction} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Link2 className="w-5 h-5"/> Funded Plan Payment URLs</CardTitle>
                        <CardDescription>
                            Configure the `styfashion.in` payment page URLs. Select which URL is currently active for new signups.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="primary_payment_url">Primary Payment URL (Razorpay Account #1)</Label>
                            <Input id="primary_payment_url" name="primary_payment_url" defaultValue={currentSettings?.primary_payment_url || 'https://styfashion.in/funded-access/primary'} placeholder="https://styfashion.in/funded-access/primary" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="secondary_payment_url">Secondary Payment URL (Razorpay Account #2)</Label>
                            <Input id="secondary_payment_url" name="secondary_payment_url" defaultValue={currentSettings?.secondary_payment_url || 'https://styfashion.in/funded-access/secondary'} placeholder="https://styfashion.in/funded-access/secondary" />
                        </div>
                         <div className="space-y-2">
                             <Label>Active Payment Account</Label>
                            <RadioGroup name="active_payment_url" defaultValue={currentSettings?.active_payment_url || 'primary'} className="space-y-2">
                                 <Label htmlFor="active_primary" className={cn("flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-all", "has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5")}>
                                     <div>
                                        <p className="font-bold">Primary URL</p>
                                        <p className="text-muted-foreground text-sm truncate">{currentSettings?.primary_payment_url || 'https://styfashion.in/funded-access/primary'}</p>
                                    </div>
                                    <RadioGroupItem value="primary" id="active_primary" />
                                </Label>
                                 <Label htmlFor="active_secondary" className={cn("flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-all", "has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5")}>
                                     <div>
                                        <p className="font-bold">Secondary URL</p>
                                        <p className="text-muted-foreground text-sm truncate">{currentSettings?.secondary_payment_url || 'https://styfashion.in/funded-access/secondary'}</p>
                                    </div>
                                    <RadioGroupItem value="secondary" id="active_secondary" />
                                </Label>
                            </RadioGroup>
                         </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Manual Payment Details</CardTitle>
                        <CardDescription>Update the manual payment options shown to users during signup.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* UPI Section */}
                        <div className="space-y-6 p-4 border rounded-lg">
                             <h3 className="font-semibold text-lg flex items-center gap-2"><IndianRupee className="w-5 h-5"/> UPI Settings</h3>
                             <div className="space-y-2">
                                <Label htmlFor="upi_id">UPI ID</Label>
                                <Input id="upi_id" name="upi_id" defaultValue={currentSettings?.upi_id || ''} placeholder="your-upi-id@okhdfcbank" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="qr_code">UPI QR Code Image</Label>
                                <Input id="qr_code" name="qr_code" type="file" accept="image/*" onChange={handleUpiFileChange} />
                                <p className="text-xs text-muted-foreground">Upload a new image to replace the current one.</p>
                            </div>
                            {upiQrPreview && (
                                <div>
                                    <Label>Current UPI QR Code Preview</Label>
                                    <div className="mt-2 rounded-md border p-4 w-fit bg-white">
                                        <Image src={upiQrPreview} alt="UPI QR Code Preview" width={150} height={150} className="object-contain" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Crypto Section */}
                        <div className="space-y-6 p-4 border rounded-lg">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Wallet className="w-5 h-5"/> Crypto (USDT) Settings</h3>
                            <div className="space-y-2">
                                <Label htmlFor="usdt_to_inr_rate">USDT to INR Rate</Label>
                                <Input id="usdt_to_inr_rate" name="usdt_to_inr_rate" type="number" step="0.01" defaultValue={currentSettings?.usdt_to_inr_rate || 90} placeholder="e.g., 90" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="crypto_wallet_address">USDT Wallet Address (TRC20)</Label>
                                <Input id="crypto_wallet_address" name="crypto_wallet_address" defaultValue={currentSettings?.crypto_wallet_address || ''} placeholder="T..." />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="crypto_qr_code">Crypto Wallet QR Code</Label>
                                <Input id="crypto_qr_code" name="crypto_qr_code" type="file" accept="image/*" onChange={handleCryptoFileChange} />
                            </div>
                            {cryptoQrPreview && (
                                <div>
                                    <Label>Current Crypto QR Code Preview</Label>
                                    <div className="mt-2 rounded-md border p-4 w-fit bg-white">
                                        <Image src={cryptoQrPreview} alt="Crypto QR Code Preview" width={150} height={150} className="object-contain" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment Method Availability</CardTitle>
                        <CardDescription>Toggle which payment methods are available to users during signup.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_upi_enabled" className="text-base">Standard Gateway / Manual UPI</Label>
                                <p className="text-sm text-muted-foreground">Enable or disable all INR payment methods.</p>
                            </div>
                            <Switch
                                id="is_upi_enabled"
                                name="is_upi_enabled"
                                defaultChecked={currentSettings?.is_upi_enabled ?? true}
                            />
                        </div>
                         <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_crypto_enabled" className="text-base">Crypto (USDT)</Label>
                                <p className="text-sm text-muted-foreground">Enable or disable manual crypto payments.</p>
                            </div>
                            <Switch
                                id="is_crypto_enabled"
                                name="is_crypto_enabled"
                                defaultChecked={currentSettings?.is_crypto_enabled ?? true}
                            />
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Referral Program Settings</CardTitle>
                        <CardDescription>Set the commission percentage for successful referrals.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-2">
                            <Label htmlFor="referral_commission_percentage">Referral Commission (%)</Label>
                            <div className="relative">
                                <Input 
                                    id="referral_commission_percentage" 
                                    name="referral_commission_percentage" 
                                    type="number"
                                    defaultValue={currentSettings?.referral_commission_percentage ?? 10}
                                    placeholder="e.g. 10" 
                                    required 
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="pl-8"
                                />
                                <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                 <div className="flex justify-end">
                    <SubmitButton />
                </div>
        </form>
    );
}


export default function PaymentSettingsPage() {
    const supabase = createClient();
    const [settings, setSettings] = useState<PaymentDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('payment_details')
                .select('*')
                .eq('id', 1)
                .single();
            
            if (data) {
                setSettings(data);
            }
            setIsLoading(false);
        };
        fetchSettings();
        
        const channel = supabase
            .channel('realtime payment_details')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payment_details', filter: 'id=eq.1' }, 
            (payload) => {
                setSettings(payload.new as PaymentDetails);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

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
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/dashboard" tooltip="Dashboard">
                                <Home />
                                Dashboard
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/competition" tooltip="Competition">
                                <Swords />
                                Competition
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/coupons" tooltip="Coupons">
                                <Ticket />
                                Coupons
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/payouts" tooltip="Payouts">
                                <Banknote />
                                Payouts
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/tickets" tooltip="Support">
                                <MessageSquare />
                                Support
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/reports" tooltip="Reports">
                                <LineChart />
                                Reports
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/admin/payment-settings" isActive tooltip="Payment Settings">
                                <Wallet />
                                Payment Settings
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="border-t p-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <form action={signOut} className="w-full">
                                <SidebarMenuButton tooltip="Logout" asChild>
                                    <button type="submit" className="w-full">
                                        <LogOut />
                                        Logout
                                    </button>
                                </SidebarMenuButton>
                            </form>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-[57px] items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-xl font-semibold">Payment Settings</h1>
                    </div>
                    <ThemeToggle />
                </header>
                <main className="p-4 md:p-8 bg-muted/40">
                    <div className="max-w-2xl mx-auto">
                        {isLoading ? (
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-7 w-48" />
                                    <Skeleton className="h-4 w-full mt-2" />
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Skeleton className="h-10 w-32" />
                                </CardFooter>
                            </Card>
                        ) : (
                           <PaymentSettingsForm currentSettings={settings} />
                        )}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
