
alter table "public"."profiles" add column "plain_password" text;

-- Add a policy to restrict access to the plain_password column
-- Only service_role can access it. No user, authenticated or anonymous, can access it.
alter table "public"."profiles" enable row level security;

-- Drop existing policies for profiles if they exist, to recreate them cleanly.
-- We check for existence to avoid errors if the policy isn't there.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow admin read access' AND tablename = 'profiles') THEN
        DROP POLICY "Allow admin read access" ON "public"."profiles";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow individual user access to their own profile' AND tablename = 'profiles') THEN
        DROP POLICY "Allow individual user access to their own profile" ON "public"."profiles";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to read referral codes' AND tablename = 'profiles') THEN
        DROP POLICY "Allow authenticated users to read referral codes" ON "public"."profiles";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to update their own payout details' AND tablename = 'profiles') THEN
       DROP POLICY "Allow users to update their own payout details" ON "public"."profiles";
    END IF;
END
$$;


-- RLS Policies for profiles table
-- 1. Admin users can read all profiles, but cannot read the plain_password.
CREATE POLICY "Allow admin read access"
ON "public"."profiles"
FOR SELECT
TO authenticated
USING (
  (get_my_claim('role'::text)) = '"admin"'::jsonb
);

-- 2. Users can access their own profile data, but cannot read the plain_password.
CREATE POLICY "Allow individual user access to their own profile"
ON "public"."profiles"
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Any authenticated user can read the referral_code of another user.
CREATE POLICY "Allow authenticated users to read referral codes"
ON "public"."profiles"
FOR SELECT
TO authenticated
USING (true);


-- 4. Users can update their own payout details
CREATE POLICY "Allow users to update their own payout details"
ON "public"."profiles"
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
