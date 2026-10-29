-- StartEase Supabase Database Schema
-- Run this in your Supabase SQL Editor to enable cloud storage for task logs, user sessions, and preferences.

-- 1. Profiles Table (Extension linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Gentle Logs Table (Syncs completed/paused tasks across devices)
CREATE TABLE IF NOT EXISTS public.task_logs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task TEXT NOT NULL,
  last_step TEXT,
  status TEXT DEFAULT 'Finished',
  app_name TEXT,
  completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own task logs"
  ON public.task_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task logs"
  ON public.task_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task logs"
  ON public.task_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task logs"
  ON public.task_logs FOR DELETE
  USING (auth.uid() = user_id);

-- 3. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  text_size TEXT DEFAULT 'normal',
  calm_motion BOOLEAN DEFAULT false,
  read_aloud BOOLEAN DEFAULT false,
  show_shortcuts BOOLEAN DEFAULT true,
  window_opacity INTEGER DEFAULT 100,
  dyslexia_friendly BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- 4. Active User Sessions Table (Syncs in-progress active task across relaunch & devices)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  session_id TEXT NOT NULL,
  session_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own session"
  ON public.user_sessions FOR ALL
  USING (auth.uid() = user_id);
