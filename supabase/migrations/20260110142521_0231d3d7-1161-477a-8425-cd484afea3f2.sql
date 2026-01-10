-- Add ingredients and steps columns to recipes table
ALTER TABLE public.recipes 
ADD COLUMN ingredients text[] DEFAULT NULL,
ADD COLUMN steps text[] DEFAULT NULL;