-- Supabase Database Schema for Fixtral
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reddit posts table
CREATE TABLE IF NOT EXISTS public.reddit_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  author TEXT NOT NULL,
  subreddit TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  num_comments INTEGER DEFAULT 0,
  created_utc INTEGER NOT NULL,
  permalink TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT reddit_posts_post_id_unique UNIQUE (post_id)
);

-- Edit history table
CREATE TABLE IF NOT EXISTS public.edit_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL,
  post_title TEXT NOT NULL,
  request_text TEXT NOT NULL,
  analysis TEXT NOT NULL,
  edit_prompt TEXT NOT NULL,
  original_image_url TEXT NOT NULL,
  edited_image_url TEXT,
  post_url TEXT,
  method TEXT NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed')),
  processing_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reddit_posts_created_at ON public.reddit_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_subreddit ON public.reddit_posts(subreddit);
CREATE INDEX IF NOT EXISTS idx_edit_history_user_id ON public.edit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_edit_history_created_at ON public.edit_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edit_history_status ON public.edit_history(status);

-- Row Level Security (RLS) Policies

-- Users table policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Reddit posts policies (public read, authenticated insert)
ALTER TABLE public.reddit_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reddit posts"
  ON public.reddit_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert reddit posts"
  ON public.reddit_posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- User credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  daily_generations INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  total_generations INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one record per user
  CONSTRAINT user_credits_user_id_unique UNIQUE (user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_last_reset ON public.user_credits(last_reset_date);

-- Function to reset daily credits
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void AS $$
BEGIN
  UPDATE public.user_credits
  SET daily_generations = 0, last_reset_date = CURRENT_DATE, updated_at = NOW()
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create user credits
CREATE OR REPLACE FUNCTION get_or_create_user_credits(user_uuid UUID)
RETURNS TABLE (
  daily_generations INTEGER,
  last_reset_date DATE,
  total_generations INTEGER
) AS $$
BEGIN
  -- First reset any outdated credits
  PERFORM reset_daily_credits();

  -- Then get or create user credits
  RETURN QUERY
  INSERT INTO public.user_credits (user_id, daily_generations, last_reset_date, total_generations)
  VALUES (user_uuid, 0, CURRENT_DATE, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    user_id = EXCLUDED.user_id
  RETURNING user_credits.daily_generations, user_credits.last_reset_date, user_credits.total_generations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User credits policies
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON public.user_credits FOR ALL
  USING (auth.uid() = user_id);

-- Edit history policies
ALTER TABLE public.edit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own edit history"
  ON public.edit_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own edit history"
  ON public.edit_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own edit history"
  ON public.edit_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  is_admin_user BOOLEAN := FALSE;
BEGIN
  -- Extract name from metadata
  user_name := new.raw_user_meta_data->>'name';

  -- Check if this is an admin email or UID (set via environment variables in app)
  IF new.email = 'farizanjum2018@gmail.com' OR new.id::text = '337aaae0-a3ff-423e-8290-d24aab5de3ee' THEN
    is_admin_user := TRUE;
  END IF;

  INSERT INTO public.users (id, email, name, is_admin)
  VALUES (new.id, new.email, user_name, is_admin_user);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_uuid AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually set user as admin by email (for existing users)
CREATE OR REPLACE FUNCTION public.set_user_admin_by_email(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.users
  SET is_admin = TRUE
  WHERE email = user_email;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually set user as admin by UID (for existing users)
CREATE OR REPLACE FUNCTION public.set_user_admin_by_uid(user_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.users
  SET is_admin = TRUE
  WHERE id = user_uid;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin by email or UID (flexible admin check)
CREATE OR REPLACE FUNCTION public.is_user_admin_by_credentials(user_email TEXT DEFAULT NULL, user_uid UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check by UID if provided
  IF user_uid IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.users
      WHERE id = user_uid AND is_admin = TRUE
    );
  END IF;

  -- Check by email if provided
  IF user_email IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.users
      WHERE email = user_email AND is_admin = TRUE
    );
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER edit_history_updated_at
  BEFORE UPDATE ON public.edit_history
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
