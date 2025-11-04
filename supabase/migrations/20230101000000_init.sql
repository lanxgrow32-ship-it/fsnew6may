-- Create the profiles table to store user data linked to auth
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  plan_purchased text,
  trading_username text,
  trading_password text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now(),
  credentials_provided boolean DEFAULT false,
  credentials_provided_at timestamptz
);
-- Add comments to the columns for clarity
COMMENT ON COLUMN public.profiles.id IS 'Links to auth.users table. ON DELETE CASCADE ensures profile is deleted when auth user is.';
COMMENT ON COLUMN public.profiles.plan_purchased IS 'The name or ID of the trading plan the user purchased.';
COMMENT ON COLUMN public.profiles.credentials_provided IS 'Flag to track if trading credentials have been set by the admin.';
COMMENT ON COLUMN public.profiles.credentials_provided_at IS 'Timestamp for when credentials were last provided.';

-- Create the admin activity log table
CREATE TABLE public.admin_activity_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES public.profiles(id),
  action text NOT NULL,
  target_user_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);
-- Add comment for the log table
COMMENT ON TABLE public.admin_activity_log IS 'Logs actions performed by admins for audit purposes.';

-- Enable Row Level Security (RLS) for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Enable RLS for the admin activity log table
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for 'profiles' table
-- Admins can see all profiles.
CREATE POLICY "Allow admin to read all profiles" ON public.profiles FOR SELECT TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
-- Users can only see their own profile.
CREATE POLICY "Allow users to read their own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
-- Admins can update any profile.
CREATE POLICY "Allow admin to update profiles" ON public.profiles FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
-- Users cannot update their profile (read-only system for them).
-- Admins can insert new profiles (handled by createUser server action).

-- Policies for 'admin_activity_log' table
-- Only admins can see the activity log.
CREATE POLICY "Allow admin to read logs" ON public.admin_activity_log FOR SELECT TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
-- Only admins can write to the activity log (handled by server actions).
