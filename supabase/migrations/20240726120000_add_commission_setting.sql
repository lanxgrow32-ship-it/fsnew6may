-- Add referral commission percentage to payment_details table
ALTER TABLE public.payment_details
ADD COLUMN referral_commission_percentage numeric NOT NULL DEFAULT 10;

-- Update the RLS policy to allow users to read this public setting
DROP POLICY IF EXISTS "Public can read payment details" ON public.payment_details;
CREATE POLICY "Public can read payment details"
ON public.payment_details
FOR SELECT
USING (true);
