import { redirect } from 'next/navigation';

export default function MentorRedirectPage() {
  redirect('https://ai.fundedstock.io');
  
  // This component will not render anything as the redirect happens on the server.
  return null;
}
