
import { createClient } from '@/lib/supabase/server';
import PayLaterDashboardClient from './dashboard-client';

export default async function PayLaterDashboardPage({ searchParams }: { searchParams: { master_view?: string } }) {
  const supabase = await createClient();
  const masterView = searchParams.master_view === 'true';

  let query = supabase.from('profiles').select('*').eq('account_model', 'passthrupay');

  if (masterView) {
    query = query.eq('is_hidden', true);
  } else {
    query = query.or('is_hidden.is.false,is_hidden.is.null');
  }

  // Increased range to 50,000
  const { data: profiles, error } = await query
    .order('created_at', { ascending: false })
    .range(0, 49999);


  if (error) {
    console.error("Error fetching pay-later profiles:", error);
  }
  
  return <PayLaterDashboardClient initialProfiles={profiles || []} masterView={masterView} />;
}
