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
import { Home, Ticket, Wallet, LogOut, Loader2, Percent, Banknote, MessageSquare, LineChart, IndianRupee, Swords, HardDrive, Wifi } from 'lucide-react';
import { signOut } from '@/app/actions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type PaymentDetails = {
    id: number;
    upi_id: string;
    qr_code_url: string;
    referral_commission_percentage: number;
    active_payment_gateway: 'lgpay' | 'manual';
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
    const [activeGateway, setActiveGateway] = useState<'lgpay' | 'manual'>(currentSettings?.active_payment_gateway || 'lgpay');

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

    return (
        <form ref={formRef} action={formAction} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Active Payment Gateway</CardTitle>
                    <CardDescription>Select which payment method new users will see during signup.</CardDescription>
                </CardHeader>
                <CardContent>
                     <RadioGroup 
                        name="active_gateway"
                        value={activeGateway}
                        onValueChange={(value: 'lgpay' | 'manual') => setActiveGateway(value)}
                        className="grid grid-cols-2 gap-4"
                     >
                        <div>
                             <RadioGroupItem value="lgpay" id="gateway-lgpay" className="sr-only" />
                             <Label htmlFor="gateway-lgpay" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", activeGateway === 'lgpay' && "border-primary")}>
                                <Wifi className="mb-3 h-6 w-6" />
                                LG-Pay (Automated)
                            </Label>
                        </div>
                         <div>
                            <RadioGroupItem value="manual" id="gateway-manual" className="sr-only" />
                             <Label htmlFor="gateway-manual" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", activeGateway === 'manual' && "border-primary")}>
                                <HardDrive className="mb-3 h-6 w-6" />
                                Manual UPI
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Manual Payment Details</CardTitle>
                    <CardDescription>Update the manual UPI payment option shown to users during signup.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                .select('id, upi_id, qr_code_url, referral_commission_percentage, active_payment_gateway')
                .eq('id', 1)
                .single();
            
            if (data) {
                setSettings(data as PaymentDetails);
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
