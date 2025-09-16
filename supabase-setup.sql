-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    bio TEXT,
    location TEXT,
    profile_picture TEXT,
    skills_i_have TEXT[],
    skills_i_want TEXT[],
    top_skills TEXT[],
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    availability TEXT CHECK (availability IN ('full_time', 'part_time', 'project_based')),
    preferred_work TEXT CHECK (preferred_work IN ('online', 'offline', 'both')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- =============================================
-- Minimal Direct Messages Schema (Reset + Setup)
-- Ensures a simple messages table with RLS and realtime
-- =============================================

DO $$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL THEN
    DROP TABLE public.messages CASCADE;
  END IF;
  IF to_regclass('public.conversation_participants') IS NOT NULL THEN
    DROP TABLE public.conversation_participants CASCADE;
  END IF;
  IF to_regclass('public.conversations') IS NOT NULL THEN
    DROP TABLE public.conversations CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='messages' AND policyname='dm_select_sender_or_receiver'
  ) THEN
    CREATE POLICY dm_select_sender_or_receiver ON public.messages
      FOR SELECT TO authenticated
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='messages' AND policyname='dm_insert_sender_only'
  ) THEN
    CREATE POLICY dm_insert_sender_only ON public.messages
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

-- Realtime setup
ALTER TABLE public.messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;


-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read all profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
      AND policyname='Profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
      FOR SELECT USING (true);
  END IF;
END $$;

-- =============================================
-- Messaging Reset (DROP and Recreate Cleanly)
-- Run this block to fully reset the messaging schema
-- =============================================

-- Drop triggers/functions first (idempotent)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='messages' AND t.tgname='update_conversation_timestamp_trigger'
  ) THEN
    DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON public.messages;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname='update_conversation_timestamp'
  ) THEN
    DROP FUNCTION IF EXISTS public.update_conversation_timestamp() CASCADE;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='conversations' AND t.tgname='add_creator_as_participant_trigger'
  ) THEN
    DROP TRIGGER IF EXISTS add_creator_as_participant_trigger ON public.conversations;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname='add_creator_as_participant'
  ) THEN
    DROP FUNCTION IF EXISTS public.add_creator_as_participant() CASCADE;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname='invite_participants'
  ) THEN
    DROP FUNCTION IF EXISTS public.invite_participants(uuid, uuid[]) CASCADE;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname='is_participant'
  ) THEN
    DROP FUNCTION IF EXISTS public.is_participant(uuid) CASCADE;
  END IF;
END $$;

-- Drop tables (clean slate)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Recreate schema (clean, minimal, fast)
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional fields for compatibility with client (type + read receipts)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS read_by jsonb DEFAULT '[]';

-- Indexes for speed
CREATE INDEX idx_conv_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX idx_participants_user ON public.conversation_participants(user_id);
CREATE INDEX idx_participants_conversation ON public.conversation_participants(conversation_id);
CREATE INDEX idx_messages_conv_created ON public.messages(conversation_id, created_at);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper (SECURITY DEFINER) to avoid recursion and centralize membership
CREATE OR REPLACE FUNCTION public.is_participant(conv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conv_id AND cp.user_id = auth.uid()
  );
$$;

-- Policies
-- Conversations: anyone authenticated can create; only participants can view/update
CREATE POLICY "conv_insert_authenticated" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "conv_select_participants" ON public.conversations
  FOR SELECT TO authenticated
  USING (public.is_participant(id) OR creator_id = auth.uid());

CREATE POLICY "conv_update_participants" ON public.conversations
  FOR UPDATE TO authenticated
  USING (public.is_participant(id));

-- Participants: users can see rows for conversations they are in; insert via RPC only
CREATE POLICY "cp_select_participants" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (public.is_participant(conversation_id));

CREATE POLICY "cp_update_self" ON public.conversation_participants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "cp_delete_self" ON public.conversation_participants
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Messages: only participants can read/send
CREATE POLICY "msg_select_participants" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_participant(conversation_id));

CREATE POLICY "msg_insert_participants" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.is_participant(conversation_id));

-- Auto-add creator as participant
CREATE OR REPLACE FUNCTION public.add_creator_as_participant()
RETURNS trigger AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.conversation_participants(conversation_id, user_id)
    VALUES (NEW.id, auth.uid())
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER add_creator_as_participant_trigger
AFTER INSERT ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.add_creator_as_participant();

-- Keep conversations sorted by last activity
CREATE OR REPLACE FUNCTION public.bump_conversation_timestamp()
RETURNS trigger AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bump_conversation_timestamp_trigger
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_timestamp();

-- Invite participants (adds the other user atomically)
CREATE OR REPLACE FUNCTION public.invite_participants(conv_id uuid, participant_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE pid uuid;
BEGIN
  IF NOT public.is_participant(conv_id) AND auth.uid() <> (
    SELECT creator_id FROM public.conversations WHERE id = conv_id
  ) THEN
    RAISE EXCEPTION 'not a participant';
  END IF;

  FOREACH pid IN ARRAY participant_ids LOOP
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (conv_id, pid)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END LOOP;
END;
$$;

-- Realtime: ensure full payloads and publication membership
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;

-- Users can insert their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
      AND policyname='Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
      AND policyname='Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can delete their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
      AND policyname='Users can delete their own profile'
  ) THEN
    CREATE POLICY "Users can delete their own profile" ON public.profiles
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Avatar images are publicly accessible'
  ) THEN
    CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Allow authenticated users to upload to avatars bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Authenticated users can upload avatars'
  ) THEN
    CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Allow users to update their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Users can update their own avatars'
  ) THEN
    CREATE POLICY "Users can update their own avatars" ON storage.objects
      FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Allow users to delete their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Users can delete their own avatars'
  ) THEN
    CREATE POLICY "Users can delete their own avatars" ON storage.objects
      FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called when a new user signs up
    -- We don't automatically create a profile here, let the user do it manually
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT CHECK (post_type IN ('skill_offer', 'skill_request', 'project', 'general')) NOT NULL,
    skills_offered TEXT[],
    skills_needed TEXT[],
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    availability TEXT CHECK (availability IN ('full_time', 'part_time', 'project_based')),
    deadline TIMESTAMP WITH TIME ZONE,
    media_urls TEXT[],
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policies for posts
-- Users can read all posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='posts'
      AND policyname='Posts are viewable by everyone'
  ) THEN
    CREATE POLICY "Posts are viewable by everyone" ON public.posts
      FOR SELECT USING (true);
  END IF;
END $$;

-- Users can insert their own posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='posts'
      AND policyname='Users can insert their own posts'
  ) THEN
    CREATE POLICY "Users can insert their own posts" ON public.posts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update their own posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='posts'
      AND policyname='Users can update their own posts'
  ) THEN
    CREATE POLICY "Users can update their own posts" ON public.posts
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can delete their own posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='posts'
      AND policyname='Users can delete their own posts'
  ) THEN
    CREATE POLICY "Users can delete their own posts" ON public.posts
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create likes table for post interactions
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Enable RLS for likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Policies for likes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_likes'
      AND policyname='Users can view all likes'
  ) THEN
    CREATE POLICY "Users can view all likes" ON public.post_likes
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_likes'
      AND policyname='Users can like posts'
  ) THEN
    CREATE POLICY "Users can like posts" ON public.post_likes
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_likes'
      AND policyname='Users can unlike posts'
  ) THEN
    CREATE POLICY "Users can unlike posts" ON public.post_likes
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Policies for comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_comments'
      AND policyname='Users can view all comments'
  ) THEN
    CREATE POLICY "Users can view all comments" ON public.post_comments
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_comments'
      AND policyname='Users can create comments'
  ) THEN
    CREATE POLICY "Users can create comments" ON public.post_comments
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_comments'
      AND policyname='Users can update their own comments'
  ) THEN
    CREATE POLICY "Users can update their own comments" ON public.post_comments
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='post_comments'
      AND policyname='Users can delete their own comments'
  ) THEN
    CREATE POLICY "Users can delete their own comments" ON public.post_comments
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create follows table for user relationships
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Enable RLS for follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies for follows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='follows'
      AND policyname='Users can view all follows'
  ) THEN
    CREATE POLICY "Users can view all follows" ON public.follows
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='follows'
      AND policyname='Users can follow others'
  ) THEN
    CREATE POLICY "Users can follow others" ON public.follows
      FOR INSERT WITH CHECK (auth.uid() = follower_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='follows'
      AND policyname='Users can unfollow others'
  ) THEN
    CREATE POLICY "Users can unfollow others" ON public.follows
      FOR DELETE USING (auth.uid() = follower_id);
  END IF;
END $$;

-- Create conversations table for messaging
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure creator_id exists if table already created previously
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS creator_id UUID;
ALTER TABLE public.conversations ALTER COLUMN creator_id SET DEFAULT auth.uid();

-- Enable RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policies for conversations (required for client-side creation and access)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Users can create conversations'
  ) THEN
    CREATE POLICY "Users can create conversations" ON public.conversations
      FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Users can view their conversations'
  ) THEN
    CREATE POLICY "Users can view their conversations" ON public.conversations
      FOR SELECT
      USING (public.is_participant(public.conversations.id));
  END IF;
END $$;

-- Create conversation participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Enable RLS for conversation participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user participates in a conversation (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_participant(conv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conv_id AND cp.user_id = auth.uid()
  );
$$;

-- Policies for conversation participants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='conversation_participants'
      AND policyname='Users can view conversations they participate in'
  ) THEN
    CREATE POLICY "Users can view conversations they participate in" ON public.conversation_participants
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow selecting all participant rows in conversations the user belongs to
DROP POLICY IF EXISTS "Users can view all participants in their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view all participants in their conversations" ON public.conversation_participants
  FOR SELECT USING (public.is_participant(conversation_participants.conversation_id));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='conversation_participants'
      AND policyname='Users can join conversations'
  ) THEN
    CREATE POLICY "Users can join conversations" ON public.conversation_participants
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='conversation_participants'
      AND policyname='Users can update their conversation status'
  ) THEN
    CREATE POLICY "Users can update their conversation status" ON public.conversation_participants
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='conversation_participants'
      AND policyname='Users can leave conversations'
  ) THEN
    CREATE POLICY "Users can leave conversations" ON public.conversation_participants
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create conversations SELECT policy now that participants table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Users can view their conversations'
  ) THEN
    CREATE POLICY "Users can view their conversations" ON public.conversations
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.conversation_participants cp
          WHERE cp.conversation_id = public.conversations.id
          AND cp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Allow creators to view their conversations immediately after insert (RETURNING)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Creators can view their conversations'
  ) THEN
    CREATE POLICY "Creators can view their conversations" ON public.conversations
      FOR SELECT
      USING (creator_id = auth.uid());
  END IF;
END $$;

-- Automatically add creator as participant on conversation creation
CREATE OR REPLACE FUNCTION public.add_creator_as_participant()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (NEW.id, auth.uid())
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS add_creator_as_participant_trigger ON public.conversations;
CREATE TRIGGER add_creator_as_participant_trigger
  AFTER INSERT ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.add_creator_as_participant();

-- Invite participants to a conversation (SECURITY DEFINER to bypass RLS safely)
CREATE OR REPLACE FUNCTION public.invite_participants(conv_id uuid, participant_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid;
BEGIN
  -- Only allow if the current user is already a participant in the conversation
  IF NOT public.is_participant(conv_id) THEN
    RAISE EXCEPTION 'not a participant';
  END IF;

  FOREACH pid IN ARRAY participant_ids LOOP
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (conv_id, pid)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END LOOP;
END;
$$;

-- Allow participants to update their conversations (needed for updated_at trigger)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Participants can update their conversations'
  ) THEN
    CREATE POLICY "Participants can update their conversations" ON public.conversations
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.conversation_participants cp
          WHERE cp.conversation_id = public.conversations.id
          AND cp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create messages table for real-time messaging
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('text', 'image', 'file')) DEFAULT 'text',
    media_url TEXT,
    read_by JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='messages'
      AND policyname='Users can view messages in their conversations'
  ) THEN
    CREATE POLICY "Users can view messages in their conversations" ON public.messages
      FOR SELECT USING (public.is_participant(public.messages.conversation_id));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='messages'
      AND policyname='Users can send messages to their conversations'
  ) THEN
    CREATE POLICY "Users can send messages to their conversations" ON public.messages
      FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND public.is_participant(public.messages.conversation_id)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='messages'
      AND policyname='Users can update their own messages'
  ) THEN
    CREATE POLICY "Users can update their own messages" ON public.messages
      FOR UPDATE USING (auth.uid() = sender_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='messages'
      AND policyname='Users can delete their own messages'
  ) THEN
    CREATE POLICY "Users can delete their own messages" ON public.messages
      FOR DELETE USING (auth.uid() = sender_id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Function to update post counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'post_likes' THEN
            UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        ELSIF TG_TABLE_NAME = 'post_comments' THEN
            UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'post_likes' THEN
            UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        ELSIF TG_TABLE_NAME = 'post_comments' THEN
            UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic count updates (idempotent)
DROP TRIGGER IF EXISTS update_likes_count ON public.post_likes;
CREATE TRIGGER update_likes_count
    AFTER INSERT OR DELETE ON public.post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_counts();

DROP TRIGGER IF EXISTS update_comments_count ON public.post_comments;
CREATE TRIGGER update_comments_count
    AFTER INSERT OR DELETE ON public.post_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Function to update conversation updated_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp when new message is added (idempotent)
DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON public.messages;
CREATE TRIGGER update_conversation_timestamp_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Realtime: ensure tables emit full row changes and are in publication
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.follows REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='follows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
  END IF;
END $$;