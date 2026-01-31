-- Create communities table
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  objective TEXT,
  logo_url TEXT,
  is_closed BOOLEAN DEFAULT false,
  creator_id UUID NOT NULL,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create community members table
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Communities RLS Policies
-- Anyone can view open communities
CREATE POLICY "View open communities" ON public.communities
  FOR SELECT USING (
    is_closed = false OR 
    id IN (SELECT community_id FROM public.community_members WHERE user_id = auth.uid())
  );

-- Verified+ users can create communities
CREATE POLICY "Verified users can create communities" ON public.communities
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Admins can update their communities
CREATE POLICY "Admins can update communities" ON public.communities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.community_members 
      WHERE community_id = communities.id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Community Members RLS Policies
-- Members can view memberships
CREATE POLICY "View community memberships" ON public.community_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    community_id IN (SELECT community_id FROM public.community_members WHERE user_id = auth.uid())
  );

-- Users can join communities
CREATE POLICY "Users can join communities" ON public.community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave communities  
CREATE POLICY "Users can leave communities" ON public.community_members
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update member count
CREATE OR REPLACE FUNCTION public.handle_community_member_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.community_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_community_member_change ON public.community_members;
CREATE TRIGGER trigger_community_member_change
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_community_member_change();

-- Auto-add creator as admin when community is created
CREATE OR REPLACE FUNCTION public.handle_community_created()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_community_created ON public.communities;
CREATE TRIGGER trigger_community_created
  AFTER INSERT ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_community_created();

-- Add updated_at trigger for communities
DROP TRIGGER IF EXISTS trigger_communities_updated_at ON public.communities;
CREATE TRIGGER trigger_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();