
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
import { Home, Ticket, Wallet, LogOut, Loader2, Percent, Banknote } from 'lucide-react';
import { signOut } from '@/app/actions';

type PaymentDetails = {
    id: number;
    upi_id: string;
    qr_code_url: string;
    referral_commission_percentage: number;
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Settings'}
        </Button>
    );
}

function PaymentSettingsForm({ currentSettings }: { currentSettings: PaymentDetails | null }) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(updatePaymentSettings, { error: null, success: null });
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentSettings?.qr_code_url || null);
    const [commission, setCommission] = useState(currentSettings?.referral_commission_percentage ?? 10);
    const formRef = useRef<HTMLFormElement>(null);


    useEffect(() => {
        if (state.error) {
            toast({ title: 'Error', description: state.error, variant: 'destructive' });
        }
        if (state.success) {
            toast({ title: 'Success', description: state.success });
        }
    }, [state, toast]);

    useEffect(() => {
        // This ensures the form's value updates if the parent's data re-fetches successfully.
        if (currentSettings) {
            setCommission(currentSettings.referral_commission_percentage);
            setPreviewUrl(currentSettings.qr_code_url);
        }
    }, [currentSettings]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    }
    
    // Wrapper for form action to reset file input state
    const handleFormAction = (formData: FormData) => {
        formAction(formData);
        // We optimistically assume success. If it fails, the user might have to re-select the file.
        // A more complex setup would be needed to retain file state upon server action failure.
        const fileInput = formRef.current?.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = ""; // Clear file input
        }
    }

    return (
        <form ref={formRef} action={handleFormAction}>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>User Payment Details</CardTitle>
                        <CardDescription>Update the UPI ID and QR code shown to users during signup.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="upi_id">UPI ID</Label>
                            <Input id="upi_id" name="upi_id" defaultValue={currentSettings?.upi_id || ''} placeholder="your-upi-id@okhdfcbank" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="qr_code">QR Code Image</Label>
                            <Input id="qr_code" name="qr_code" type="file" accept="image/*" onChange={handleFileChange} />
                            <p className="text-xs text-muted-foreground">Upload a new image to replace the current one.</p>
                        </div>
                        {previewUrl && (
                            <div>
                                <Label>Current QR Code Preview</Label>
                                <div className="mt-2 rounded-md border p-4 w-fit bg-white">
                                    <Image src={previewUrl} alt="QR Code Preview" width={200} height={200} className="object-contain" />
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
                                    value={commission}
                                    onChange={(e) => setCommission(parseFloat(e.target.value))}
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

    }, []);

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="border-b p-4 h-[57px] flex items-center">
                    <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg">
                        <FundedStockLogo className="w-8 h-8 text-primary" />
                        <span className="text-foreground group-[[data-state=collapsed]]:hidden">FundedStock</span>
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

    