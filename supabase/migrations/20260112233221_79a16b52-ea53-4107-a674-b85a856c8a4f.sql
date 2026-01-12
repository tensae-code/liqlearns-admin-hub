-- Create message_requests table for the 3-request limit system
CREATE TABLE public.message_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create follows table for follow/followers system
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on both tables
ALTER TABLE public.message_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_requests
CREATE POLICY "Users can view their own message requests"
ON message_requests FOR SELECT
USING (
  sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can send message requests"
ON message_requests FOR INSERT
WITH CHECK (
  sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
  -- Limit to 3 pending requests per sender-receiver pair is handled by check constraint
  (SELECT COUNT(*) FROM message_requests 
   WHERE sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) 
   AND receiver_id = message_requests.receiver_id 
   AND status = 'pending') < 3
);

CREATE POLICY "Receivers can update message requests"
ON message_requests FOR UPDATE
USING (
  receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own requests"
ON message_requests FOR DELETE
USING (
  sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- RLS policies for follows
CREATE POLICY "Anyone can view follows"
ON follows FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON follows FOR INSERT
WITH CHECK (
  follower_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can unfollow"
ON follows FOR DELETE
USING (
  follower_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Add followers_count and following_count to profiles (virtual/calculated)
-- We'll calculate these in queries instead of storing them

-- Create function to count followers
CREATE OR REPLACE FUNCTION public.get_follower_count(profile_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM follows WHERE following_id = profile_id;
$$;

-- Create function to count following
CREATE OR REPLACE FUNCTION public.get_following_count(profile_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM follows WHERE follower_id = profile_id;
$$;

-- Create function to check if user is following another
CREATE OR REPLACE FUNCTION public.is_following(follower UUID, following UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM follows WHERE follower_id = follower AND following_id = following);
$$;

-- Create function to count pending message requests from a user to another
CREATE OR REPLACE FUNCTION public.get_pending_request_count(sender UUID, receiver UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM message_requests 
  WHERE sender_id = sender AND receiver_id = receiver AND status = 'pending';
$$;

-- Create function to check if can message (friend, accepted request, or fewer than 3 pending)
CREATE OR REPLACE FUNCTION public.can_message(sender_profile_id UUID, receiver_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Is friend (accepted friendship)
    EXISTS (
      SELECT 1 FROM friendships 
      WHERE status = 'accepted' 
      AND ((requester_id = sender_profile_id AND addressee_id = receiver_profile_id)
           OR (addressee_id = sender_profile_id AND requester_id = receiver_profile_id))
    )
    OR
    -- Has accepted message request
    EXISTS (
      SELECT 1 FROM message_requests 
      WHERE status = 'accepted'
      AND ((sender_id = sender_profile_id AND receiver_id = receiver_profile_id)
           OR (sender_id = receiver_profile_id AND receiver_id = sender_profile_id))
    );
$$;