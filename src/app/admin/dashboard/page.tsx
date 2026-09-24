
import { createClient } from '@/lib/supabase/server';
import AdminDashboardClient from './dashboard-client';

/**
 * Main Admin Hub
 * This view always shows ALL users. It is NOT affected by the Lead Terminal 'Done' actions.
 */
export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch all profiles without any visibility filters
  const { data: profiles, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .or('role.neq.admin,role.is.null')
    .order('created_at', { ascending: false })
    .range(0, 1000);

  if (error) console.error("Error fetching profiles:", error);
  
  const isBridgeConfigured = !!process.env.STOCKMINT_API_KEY;
  
  return (
    <AdminDashboardClient 
        initialProfiles={profiles || []} 
        initialCount={count || 0} 
        isBridgeConfigured={isBridgeConfigured}
    />
  );
}
