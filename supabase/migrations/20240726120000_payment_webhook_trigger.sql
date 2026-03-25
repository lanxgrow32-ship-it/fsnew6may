
-- Enable the HTTP extension if not already enabled
create extension if not exists http with schema extensions;
-- Enable the pg_cron extension for scheduling tasks if needed
create extension if not exists pg_cron with schema extensions;

-- Function to send a webhook when a user's payment is approved
create or replace function trigger_payment_approved_webhook()
returns trigger as $$
declare
  -- IMPORTANT: Replace with your actual Make.com Webhook URL from the .env file
  webhook_url text := 'https://hook.eu1.make.com/lm20hgqefloy6n16a7dwrbpt1epfk49t';
  -- You can add an API key here if you configure one in Make.com
  -- auth_header text := 'Authorization: Bearer YOUR_MAKE_API_KEY';
begin
  -- Check if the 'is_approved' status has just been changed to true
  if new.is_approved = true and old.is_approved = false then
    -- Perform the HTTP POST request to the Make.com webhook
    perform http_post(
      webhook_url,
      json_build_object(
        'user_name', new.full_name,
        'email', new.email,
        'plan_purchased', new.plan_purchased,
        'account_size', new.plan_price, -- Or a parsed value if different
        'order_sn', new.order_sn,
        'final_amount_paid', new.final_amount_paid,
        'payment_method', (case when new.crypto_transaction_hash is not null then 'Crypto' else 'UPI' end),
        'datetime', new.created_at
      )::jsonb,
      '{}'::jsonb,
      '{"Content-Type": "application/json"}'::jsonb
    );
  end if;
  return new;
end;
$$ language plpgsql;

-- Drop the trigger if it already exists to avoid errors on re-run
drop trigger if exists on_payment_approved on public.profiles;

-- Create the trigger
create trigger on_payment_approved
after update of is_approved on public.profiles
for each row
execute function trigger_payment_approved_webhook();

