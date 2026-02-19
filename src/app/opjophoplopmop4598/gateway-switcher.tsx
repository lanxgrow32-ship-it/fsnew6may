
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { updateActiveGateway } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type Settings = {
    active_payment_url: 'primary' | 'secondary' | null;
    primary_payment_url: string | null;
    secondary_payment_url: string | null;
}

export function GatewaySwitcher({ currentSettings }: { currentSettings: Settings }) {
    const { toast } = useToast();
    const [selectedGateway, setSelectedGateway] = useState(currentSettings.active_payment_url || 'primary');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        startTransition(async () => {
            const result = await updateActiveGateway(selectedGateway);
            if (result.error) {
                toast({ title: "Error", description: result.error, variant: 'destructive' });
            }
            if (result.success) {
                toast({ title: "Success!", description: result.success });
            }
        });
    }

    return (
        <div className="space-y-6">
            <RadioGroup 
                name="active_payment_url"
                value={selectedGateway}
                onValueChange={(value: 'primary' | 'secondary') => setSelectedGateway(value)}
                className="space-y-4"
            >
                <Label htmlFor="active_primary" className={cn("flex flex-col md:flex-row items-start md:items-center justify-between rounded-lg border p-4 cursor-pointer transition-all", "has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5")}>
                    <div className="mb-4 md:mb-0">
                        <p className="font-bold text-lg">Primary Gateway</p>
                        <p className="text-muted-foreground text-sm">Main payment gateway for all standard users.</p>
                        <p className="text-muted-foreground text-xs font-mono mt-2 truncate max-w-xs md:max-w-md">{currentSettings.primary_payment_url || 'Not Set'}</p>
                    </div>
                    <RadioGroupItem value="primary" id="active_primary" />
                </Label>
                <Label htmlFor="active_secondary" className={cn("flex flex-col md:flex-row items-start md:items-center justify-between rounded-lg border p-4 cursor-pointer transition-all", "has-[[data-state=checked]]:border-destructive has-[[data-state=checked]]:bg-destructive/5 has-[[data-state=checked]]:text-destructive-foreground")}>
                     <div className="mb-4 md:mb-0">
                        <p className="font-bold text-lg text-destructive">Secondary (Hidden) Gateway</p>
                        <p className="text-muted-foreground">When active, new users will be hidden from the admin panel.</p>
                        <p className="text-muted-foreground text-xs font-mono mt-2 truncate max-w-xs md:max-w-md">{currentSettings.secondary_payment_url || 'Not Set'}</p>
                    </div>
                    <RadioGroupItem value="secondary" id="active_secondary" />
                </Label>
            </RadioGroup>
            <Button onClick={handleSubmit} className="w-full" size="lg" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save and Activate
            </Button>
        </div>
    );
}
