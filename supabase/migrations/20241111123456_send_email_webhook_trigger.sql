
-- First, drop the old, broken function and trigger if they exist
drop trigger if exists on_profile_update_send_email on public.profiles;
drop function if exists public.send_payment_confirmation_email();

-- 1. Create the new function to call the webhook
create or replace function public.trigger_send_email_webhook()
returns trigger
language plpgsql
as $$
declare
  -- The deployment URL has been hardcoded here.
  webhook_url text := 'https://app.fundedstock.io/api/send-email';
  -- This secret must match the SUPABASE_WEBHOOK_SECRET in your .env file
  webhook_secret text := 'your-very-secret-and-random-string-12345';
  payload jsonb;
begin
  -- Build the payload with the record data
  payload := jsonb_build_object('record', row_to_json(new));

  -- Trigger the HTTP request
  perform net.http_post(
    url := webhook_url,
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    )
  );
  return new;
end;
$$;

-- 2. Create the trigger to run the function on specific updates
create trigger on_profile_update_send_email
after update on public.profiles
for each row
when (
  -- Condition 1: When payment is first approved
  (old.is_approved is false and new.is_approved is true) or
  -- Condition 2: When KYC status changes to 'submitted'
  (old.kyc_status is distinct from 'submitted' and new.kyc_status = 'submitted') or
  -- Condition 3: When credentials are first provided
  (old.credentials_provided is false and new.credentials_provided is true)
)
execute function public.trigger_send_email_webhook();
