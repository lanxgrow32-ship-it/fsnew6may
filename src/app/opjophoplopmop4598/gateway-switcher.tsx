
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
                toast({ title: "Gateway updated" });
            }
        });
    }

    return (
        <div className="space-y-4">
            <RadioGroup 
                value={selectedGateway}
                onValueChange={(value: 'primary' | 'secondary') => setSelectedGateway(value)}
                className="flex justify-center items-center gap-2 rounded-lg bg-muted p-1.5"
            >
                <RadioGroupItem value="secondary" id="gateway_s" className="sr-only" />
                <Label 
                    htmlFor="gateway_s" 
                    className={cn(
                        "flex-1 cursor-pointer rounded-md p-2 text-center text-xl font-bold transition-all",
                        selectedGateway === 'secondary' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'
                    )}
                >
                    S
                </Label>

                <RadioGroupItem value="primary" id="gateway_p" className="sr-only" />
                 <Label 
                    htmlFor="gateway_p" 
                    className={cn(
                        "flex-1 cursor-pointer rounded-md p-2 text-center text-xl font-bold transition-all",
                        selectedGateway === 'primary' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'
                    )}
                >
                    P
                </Label>

            </RadioGroup>
            <Button onClick={handleSubmit} className="w-full" size="lg" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
            </Button>
        </div>
    );
}
