import { createClient } from '@supabase/supabase-js';

// This admin client is for use in server-side actions ONLY.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
