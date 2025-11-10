
-- First, remove the old, broken function if it still exists
DROP FUNCTION IF EXISTS public.send_payment_confirmation_email();

-- Create a function to be called by the trigger
create or replace function public.trigger_send_email_webhook()
returns trigger
language plpgsql
security definer -- required for http extension
as $$
declare
  -- IMPORTANT: Replace this with your actual production URL
  -- You can get this from your Vercel deployment logs or settings.
  -- For local testing, you can use ngrok or a similar tool.
  webhook_url text := 'https://<YOUR_DEPLOYMENT_URL>/api/send-email';
  payload json;
begin
  -- Construct the payload
  payload := json_build_object(
    'record', new
  );

  -- Make the HTTP request
  -- The 'supabase-service-role-key' is used for simple authentication
  -- on the API route, which should be configured to check for it.
  perform net.http_post(
    url := webhook_url,
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || secrets.get('supabase_service_role_key')
    )
  );
  
  return new;
end;
$$;


-- Create the trigger on the 'profiles' table
create trigger on_profile_approved_send_email
  after update of is_approved on public.profiles
  for each row
  when (new.is_approved = true and old.is_approved = false)
  execute procedure public.trigger_send_email_webhook();
