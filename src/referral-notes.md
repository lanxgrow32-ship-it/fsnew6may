-- Add missing payment and coupon columns to profiles table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='plan_price') THEN
    ALTER TABLE public.profiles ADD COLUMN plan_price numeric;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='coupon_code') THEN
    ALTER TABLE public.profiles ADD COLUMN coupon_code text;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='discount_amount') THEN
    ALTER TABLE public.profiles ADD COLUMN discount_amount numeric;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='final_amount_paid') THEN
    ALTER TABLE public.profiles ADD COLUMN final_amount_paid numeric;
  END IF;
END $$;
