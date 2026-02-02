-- Issue 4: Content Reports Table for Report Content feature
CREATE TABLE public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'comment', 'answer')),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reporter_id, entity_id, entity_type)
);

-- Issue 4: Hidden Users Table for Hide Posts from User feature
CREATE TABLE public.hidden_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  hidden_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, hidden_user_id)
);

-- Issue 7: Add opinion column to reposts table for Repost with Opinion
ALTER TABLE public.reposts ADD COLUMN IF NOT EXISTS opinion TEXT;

-- Enable RLS on new tables
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_reports
CREATE POLICY "Users can create reports" ON public.content_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" ON public.content_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

-- RLS Policies for hidden_users
CREATE POLICY "Users can manage hidden users" ON public.hidden_users
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON public.content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_entity ON public.content_reports(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_hidden_users_user ON public.hidden_users(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_users_hidden ON public.hidden_users(hidden_user_id);