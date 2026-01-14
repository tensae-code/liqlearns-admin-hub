-- Create community_posts table
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  is_question BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community_post_likes table for tracking who liked what
CREATE TABLE public.community_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create community_post_comments table
CREATE TABLE public.community_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts
CREATE POLICY "Anyone can view community posts"
  ON public.community_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can update their own posts"
  ON public.community_posts FOR UPDATE
  USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can delete their own posts"
  ON public.community_posts FOR DELETE
  USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for community_post_likes
CREATE POLICY "Anyone can view likes"
  ON public.community_post_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like posts"
  ON public.community_post_likes FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can unlike their own likes"
  ON public.community_post_likes FOR DELETE
  USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for community_post_comments
CREATE POLICY "Anyone can view comments"
  ON public.community_post_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.community_post_comments FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can update their own comments"
  ON public.community_post_comments FOR UPDATE
  USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can delete their own comments"
  ON public.community_post_comments FOR DELETE
  USING (user_id = (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Create function to update likes_count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for likes count
CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.community_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_post_comments;