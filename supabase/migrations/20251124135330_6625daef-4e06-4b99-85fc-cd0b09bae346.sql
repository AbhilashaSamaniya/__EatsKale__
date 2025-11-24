-- Create storage bucket for meal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-images', 'meal-images', true);

-- Create storage policies for meal images
CREATE POLICY "Users can upload their own meal images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view meal images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'meal-images');

CREATE POLICY "Users can update their own meal images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own meal images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create daily_quotes table
CREATE TABLE public.daily_quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote text NOT NULL,
  author text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on daily_quotes
ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read quotes
CREATE POLICY "Anyone can view daily quotes"
ON public.daily_quotes
FOR SELECT
USING (true);

-- Create user_activity table to track daily logins
CREATE TABLE public.user_activity (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id),
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  login_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

-- Enable RLS on user_activity
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity"
ON public.user_activity
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
ON public.user_activity
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity"
ON public.user_activity
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for user_activity updated_at
CREATE TRIGGER update_user_activity_updated_at
BEFORE UPDATE ON public.user_activity
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert some initial quotes
INSERT INTO public.daily_quotes (quote, author) VALUES
('The only bad workout is the one that didn''t happen.', 'Unknown'),
('Take care of your body. It''s the only place you have to live.', 'Jim Rohn'),
('Your body can stand almost anything. It''s your mind that you have to convince.', 'Unknown'),
('Success is the sum of small efforts repeated day in and day out.', 'Robert Collier'),
('The groundwork for all happiness is good health.', 'Leigh Hunt'),
('Eat well, live well, be well.', 'Unknown'),
('Don''t wait until you''re sick to start taking care of yourself.', 'Unknown'),
('Health is not about the weight you lose, but about the life you gain.', 'Unknown');