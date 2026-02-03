-- Add privacy_interests column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS privacy_interests boolean DEFAULT true;

-- Update handle_follow_change function to include title and body in notifications
CREATE OR REPLACE FUNCTION public.handle_follow_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    
    -- Create notification with title and body
    INSERT INTO public.notifications (user_id, type, actor_id, entity_type, entity_id, title, body)
    VALUES (NEW.following_id, 'follow', NEW.follower_id, 'user', NEW.follower_id, 'New follower', 'started following you');
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE public.profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create notification trigger for comments
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_author_id uuid;
  commenter_name text;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.entity_type = 'post' THEN
    -- Get the post author
    SELECT author_id INTO post_author_id FROM public.posts WHERE id = NEW.entity_id;
    -- Get commenter name
    SELECT full_name INTO commenter_name FROM public.profiles WHERE id = NEW.author_id;
    
    -- Don't notify if commenting on own post
    IF post_author_id IS NOT NULL AND post_author_id != NEW.author_id THEN
      INSERT INTO public.notifications (user_id, type, actor_id, entity_type, entity_id, title, body)
      VALUES (post_author_id, 'comment', NEW.author_id, 'post', NEW.entity_id, 'New comment', COALESCE(commenter_name, 'Someone') || ' commented on your post');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_comment_notification ON public.comments;
CREATE TRIGGER on_comment_notification
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_notification();

-- Create notification trigger for reactions (upvotes/likes)
CREATE OR REPLACE FUNCTION public.handle_reaction_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_author_id uuid;
  reactor_name text;
  notification_title text;
  notification_body text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get reactor name
    SELECT full_name INTO reactor_name FROM public.profiles WHERE id = NEW.user_id;
    
    IF NEW.entity_type = 'post' THEN
      -- Get post author
      SELECT author_id INTO target_author_id FROM public.posts WHERE id = NEW.entity_id;
      
      IF NEW.reaction_type = 'upvote' THEN
        notification_title := 'Post upvoted';
        notification_body := COALESCE(reactor_name, 'Someone') || ' upvoted your post';
      ELSIF NEW.reaction_type = 'downvote' THEN
        notification_title := 'Post downvoted';
        notification_body := COALESCE(reactor_name, 'Someone') || ' downvoted your post';
      ELSIF NEW.reaction_type = 'like' THEN
        notification_title := 'Post liked';
        notification_body := COALESCE(reactor_name, 'Someone') || ' liked your post';
      END IF;
    ELSIF NEW.entity_type = 'answer' THEN
      -- Get answer author
      SELECT author_id INTO target_author_id FROM public.answers WHERE id = NEW.entity_id;
      
      IF NEW.reaction_type = 'upvote' THEN
        notification_title := 'Answer upvoted';
        notification_body := COALESCE(reactor_name, 'Someone') || ' upvoted your answer';
      ELSIF NEW.reaction_type = 'downvote' THEN
        notification_title := 'Answer downvoted';
        notification_body := COALESCE(reactor_name, 'Someone') || ' downvoted your answer';
      END IF;
    END IF;
    
    -- Don't notify if reacting to own content
    IF target_author_id IS NOT NULL AND target_author_id != NEW.user_id AND notification_title IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, actor_id, entity_type, entity_id, title, body)
      VALUES (target_author_id, 'reaction', NEW.user_id, NEW.entity_type, NEW.entity_id, notification_title, notification_body);
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_reaction_notification ON public.reactions;
CREATE TRIGGER on_reaction_notification
  AFTER INSERT ON public.reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reaction_notification();

-- Create notification trigger for reposts
CREATE OR REPLACE FUNCTION public.handle_repost_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_author_id uuid;
  reposter_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the original post author
    SELECT author_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
    -- Get reposter name
    SELECT full_name INTO reposter_name FROM public.profiles WHERE id = NEW.user_id;
    
    -- Don't notify if reposting own post
    IF post_author_id IS NOT NULL AND post_author_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, actor_id, entity_type, entity_id, title, body)
      VALUES (post_author_id, 'repost', NEW.user_id, 'post', NEW.post_id, 'Post reposted', COALESCE(reposter_name, 'Someone') || ' reposted your post');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_repost_notification ON public.reposts;
CREATE TRIGGER on_repost_notification
  AFTER INSERT ON public.reposts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_repost_notification();

-- Mark user profile as expert/verified for testing
UPDATE public.profiles
SET 
  mobile_verified = true,
  linkedin_verified = true,
  linkedin_id = 'aman',
  linkedin_url = 'https://www.linkedin.com/in/aman',
  is_expert = true,
  tier = 'expert',
  streak_days = 100,
  upvote_rate = 0.85
WHERE email = 'prodmandeep@gmail.com';