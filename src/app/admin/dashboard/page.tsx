import { createClient } from '@/lib/supabase/server';
import AdminDashboardClient from './dashboard-client';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Load a massive dataset of all users to ensure the "Full All" list is visible
  const { data: profiles, error, count } = await supabase.from('profiles')
    .select('*', { count: 'exact' })
    .eq('account_type', 'standard')
    .order('created_at', { ascending: false })
    .range(0, 49999);

  if (error) console.error("Error fetching profiles:", error);
  
  return <AdminDashboardClient initialProfiles={profiles || []} initialCount={count || 0} masterView={false} />;
}
