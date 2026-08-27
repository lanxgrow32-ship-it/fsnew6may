
import { createClient } from '@/lib/supabase/server';
import AdminDashboardClient from './dashboard-client';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // PROTOCOL v11.3: NULL-Safe Role Filtering
  const { data: profiles, error, count } = await supabase.from('profiles')
    .select('*', { count: 'exact' })
    .or('role.neq.admin,role.is.null')
    .order('created_at', { ascending: false })
    .range(0, 49999);

  if (error) console.error("Error fetching profiles:", error);
  
  // Check if the SSO Bridge Secret is configured (Security check)
  const isBridgeConfigured = !!process.env.FS_ADMIN_BRIDGE_SECRET;
  
  return (
    <AdminDashboardClient 
        initialProfiles={profiles || []} 
        initialCount={count || 0} 
        masterView={false} 
        isBridgeConfigured={isBridgeConfigured}
    />
  );
}
