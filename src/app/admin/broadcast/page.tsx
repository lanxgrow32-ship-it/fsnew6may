
import { redirect } from 'next/navigation';

export default function BroadcastPage() {
    redirect('/admin/payment-settings?tab=broadcast');
}
