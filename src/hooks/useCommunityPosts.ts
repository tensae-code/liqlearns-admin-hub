import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  is_question: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  comments?: CommunityComment[];
  isLikedByMe?: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export const useCommunityPosts = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);

  // Fetch user's profile ID
  useEffect(() => {
    const fetchProfileId = async () => {
      if (!user) {
        setUserProfileId(null);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setUserProfileId(data.id);
      }
    };
    
    fetchProfileId();
  }, [user]);

  // Fetch all posts with authors and comments
  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs from posts
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      
      // Fetch profiles for post authors
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Fetch comments for all posts
      const postIds = postsData.map(p => p.id);
      const { data: commentsData } = await supabase
        .from('community_post_comments')
        .select('*')
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

      // Get user IDs from comments
      const commentUserIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      
      // Fetch profiles for comment authors
      const { data: commentProfilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', commentUserIds);

      const commentProfilesMap = new Map(commentProfilesData?.map(p => [p.id, p]) || []);

      // Fetch user's likes
      let userLikes: string[] = [];
      if (userProfileId) {
        const { data: likesData } = await supabase
          .from('community_post_likes')
          .select('post_id')
          .eq('user_id', userProfileId);
        
        userLikes = likesData?.map(l => l.post_id) || [];
      }

      // Combine data
      const enrichedPosts: CommunityPost[] = postsData.map(post => ({
        ...post,
        author: profilesMap.get(post.user_id),
        comments: commentsData
          ?.filter(c => c.post_id === post.id)
          .map(c => ({
            ...c,
            author: commentProfilesMap.get(c.user_id)
          })) || [],
        isLikedByMe: userLikes.includes(post.id)
      }));

      setPosts(enrichedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [userProfileId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('community-posts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_posts' },
        () => fetchPosts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_post_comments' },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfileId]);

  // Create a new post
  const createPost = async (content: string, isQuestion: boolean = false) => {
    if (!userProfileId) {
      toast.error('Please sign in to post');
      return false;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: userProfileId,
          content,
          is_question: isQuestion
        });

      if (error) throw error;
      
      toast.success('Post created!');
      return true;
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
      return false;
    }
  };

  // Toggle like on a post
  const toggleLike = async (postId: string) => {
    if (!userProfileId) {
      toast.error('Please sign in to like posts');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.isLikedByMe) {
        // Unlike
        await supabase
          .from('community_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userProfileId);
        
        // Update local state immediately
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, isLikedByMe: false, likes_count: p.likes_count - 1 }
            : p
        ));
      } else {
        // Like
        await supabase
          .from('community_post_likes')
          .insert({ post_id: postId, user_id: userProfileId });
        
        // Update local state immediately
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, isLikedByMe: true, likes_count: p.likes_count + 1 }
            : p
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  // Add a comment to a post
  const addComment = async (postId: string, content: string) => {
    if (!userProfileId) {
      toast.error('Please sign in to comment');
      return false;
    }

    try {
      const { error } = await supabase
        .from('community_post_comments')
        .insert({
          post_id: postId,
          user_id: userProfileId,
          content
        });

      if (error) throw error;
      
      toast.success('Comment added!');
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      return false;
    }
  };

  // Delete a post
  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post deleted');
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
      return false;
    }
  };

  return {
    posts,
    loading,
    createPost,
    toggleLike,
    addComment,
    deletePost,
    refetch: fetchPosts,
    isAuthenticated: !!userProfileId
  };
};
