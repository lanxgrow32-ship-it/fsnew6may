
import { createClient } from '@/lib/supabase/server';
import AdminDashboardClient from './dashboard-client';

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const { data: profiles, error } = await supabase.from('profiles')
    .select('*')
    .eq('account_type', 'standard')
    .or('is_hidden.is.false,is_hidden.is.null')
    .order('created_at', { ascending: false });


  if (error) {
    console.error("Error fetching profiles:", error);
    // You might want to render an error state here
  }
  
  return <AdminDashboardClient initialProfiles={profiles || []} />;
}
