
import { createClient } from '@/lib/supabase/server';
import AdminDashboardClient from './dashboard-client';

export default async function AdminDashboardPage({ searchParams }: { searchParams: { master_view?: string } }) {
  const supabase = createClient();
  const masterView = searchParams.master_view === 'true';

  let query = supabase.from('profiles')
    .select('*')
    .eq('account_type', 'standard')
    .or('account_model.is.null,account_model.neq.passthrupay');

  if (masterView) {
    query = query.eq('is_hidden', true);
  } else {
    query = query.or('is_hidden.is.false,is_hidden.is.null');
  }

  // Increased range to 10,000 to overcome the default 1,000 limit
  const { data: profiles, error } = await query
    .order('created_at', { ascending: false })
    .range(0, 9999);


  if (error) {
    console.error("Error fetching profiles:", error);
    // You might want to render an error state here
  }
  
  return <AdminDashboardClient initialProfiles={profiles || []} masterView={masterView} />;
}
