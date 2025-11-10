-- Add missing payment and coupon columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN plan_price numeric,
ADD COLUMN coupon_code text,
ADD COLUMN discount_amount numeric,
ADD COLUMN final_amount_paid numeric;
