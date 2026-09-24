
import { createClient } from '@/lib/supabase/server';
import AdminDashboardClient from './dashboard-client';

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ master_view?: string }> }) {
  const supabase = await createClient();
  const { master_view } = await searchParams;
  const isMasterView = master_view === 'true';

  // Fetch profiles based on visibility
  // Standard view: role != admin AND is_hidden != true
  // Master view: role != admin AND is_hidden == true
  let query = supabase.from('profiles')
    .select('*', { count: 'exact' })
    .or('role.neq.admin,role.is.null');
  
  if (isMasterView) {
      query = query.eq('is_hidden', true);
  } else {
      query = query.or('is_hidden.eq.false,is_hidden.is.null');
  }

  const { data: profiles, error, count } = await query
    .order('created_at', { ascending: false })
    .range(0, 1000);

  if (error) console.error("Error fetching profiles:", error);
  
  const isBridgeConfigured = !!process.env.FS_ADMIN_BRIDGE_SECRET;
  
  return (
    <AdminDashboardClient 
        initialProfiles={profiles || []} 
        initialCount={count || 0} 
        masterView={isMasterView} 
        isBridgeConfigured={isBridgeConfigured}
    />
  );
}
