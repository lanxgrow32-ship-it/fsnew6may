
import { redirect } from 'next/navigation';

/**
 * Redirection Protocol
 * Pointing internal T&C requests to the primary corporate legal page.
 */
export default async function TermsAndConditionsPage() {
    redirect('https://www.fundedstock.io/terms-and-conditions');
    return null;
}
