
-- This function will be called by the trigger.
-- It sends a POST request to the Make.com webhook URL.
create or replace function send_payment_confirmation_webhook()
returns trigger
language plpgsql
as $$
declare
  -- IMPORTANT: The webhook URL is stored in the vault for security.
  webhook_url text := vault.get_secret('make_webhook_url');
begin
  -- Check if the webhook URL is configured
  if webhook_url is null then
    raise warning 'MAKE_WEBHOOK_URL secret not found in vault. Skipping webhook.';
    return new;
  end if;

  -- Perform the HTTP request to the Make.com webhook
  perform net.http_post(
    url := webhook_url,
    body := json_build_object(
      'user_name', new.full_name,
      'email', new.email,
      'plan_purchased', new.plan_purchased,
      'account_size', new.plan_price,
      'order_sn', new.order_sn,
      'final_amount_paid', new.final_amount_paid,
      'payment_method', 'UPI/Card', -- Generic placeholder
      'datetime', new.created_at
    )::jsonb,
    headers := '{"Content-Type": "application/json"}'
  );

  return new;
end;
$$;

-- This trigger fires AFTER a profile is updated.
-- It checks if 'is_approved' was changed from false to true.
create trigger on_payment_approved_trigger
after update on public.profiles
for each row
when (old.is_approved is false and new.is_approved is true)
execute function send_payment_confirmation_webhook();

-- Note for the user:
-- This SQL setup ensures that any time a user's `is_approved` status changes from `false` to `true`,
-- whether it happens automatically via the payment gateway or manually by an admin,
-- the `send_payment_confirmation_webhook` function is called, which in turn notifies your Make.com scenario.
