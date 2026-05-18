import { createClient } from '@/lib/supabase/server';
import AdminDashboardClient from './dashboard-client';

export default async function AdminDashboardPage({ searchParams }: { searchParams: { master_view?: string } }) {
  const supabase = createClient();
  const masterView = searchParams.master_view === 'true';

  let query = supabase.from('profiles')
    .select('*', { count: 'exact' })
    .eq('account_type', 'standard')
    .or('account_model.is.null,account_model.neq.passthrupay');

  if (masterView) {
    query = query.eq('is_hidden', true);
  } else {
    query = query.or('is_hidden.is.false,is_hidden.is.null');
  }

  // Fetching a large range to ensure the table displays many users
  const { data: profiles, error, count } = await query
    .order('created_at', { ascending: false })
    .range(0, 49999);


  if (error) {
    console.error("Error fetching profiles:", error);
  }
  
  return <AdminDashboardClient initialProfiles={profiles || []} initialCount={count || 0} masterView={masterView} />;
}
