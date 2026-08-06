
import { createClient } from '@/lib/supabase/server';
import AdminDashboardClient from './dashboard-client';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // PROTOCOL v11.3: NULL-Safe Role Filtering to ensure non-admin users with NULL roles are visible
  const { data: profiles, error, count } = await supabase.from('profiles')
    .select('*', { count: 'exact' })
    .or('role.neq.admin,role.is.null') // Only exclude actual admins, catch everyone else
    .order('created_at', { ascending: false })
    .range(0, 49999);

  if (error) console.error("Error fetching profiles:", error);
  
  return <AdminDashboardClient initialProfiles={profiles || []} initialCount={count || 0} masterView={false} />;
}
