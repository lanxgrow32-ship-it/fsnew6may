
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Loader2 } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import { SignupForm } from './signup-form';

export default async function SignupPage() {
  const supabase = createClient();
  const { data: paymentSettings } = await supabase
    .from('payment_details')
    .select('active_payment_gateway')
    .eq('id', 1)
    .single();

  return (
    <div className="dark-theme">
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}>
          <ClientOnly>
              <SignupForm paymentSettings={paymentSettings} />
          </ClientOnly>
      </Suspense>
    </div>
  )
}
