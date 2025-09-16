import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: 'skill_offer' | 'skill_request' | 'project' | 'general';
  skills_offered: string[] | null;
  skills_needed: string[] | null;
  experience_level: string | null;
  availability: string | null;
  deadline: string | null;
  media_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    profile_picture: string;
    email: string;
  };
  isLiked?: boolean;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    profile_picture: string;
    email: string;
  };
}

interface PostsContextType {
  posts: Post[];
  loading: boolean;
  createPost: (postData: any) => Promise<{ error: string | null; success: boolean }>;
  updatePost: (postId: string, updates: any) => Promise<{ error: string | null; success: boolean }>;
  deletePost: (postId: string) => Promise<{ error: string | null; success: boolean }>;
  likePost: (postId: string) => Promise<{ error: string | null; success: boolean }>;
  unlikePost: (postId: string) => Promise<{ error: string | null; success: boolean }>;
  addComment: (postId: string, content: string) => Promise<{ error: string | null; success: boolean }>;
  deleteComment: (commentId: string) => Promise<{ error: string | null; success: boolean }>;
  loadComments: (postId: string) => Promise<Comment[]>;
  refreshPosts: () => void;
  getUserPosts: (userId: string) => Post[];
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      // First, fetch all posts
      const { data: rawPosts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return;
      }

      console.log('Raw posts data:', rawPosts);
      console.log('Number of posts found:', rawPosts?.length || 0);

      if (!rawPosts || rawPosts.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs from posts
      const userIds = [...new Set(rawPosts.map(post => post.user_id))];

      // Fetch profiles for all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, profile_picture, email')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      console.log('Posts with profile pictures:', rawPosts);
      console.log('Processed posts with user info:', rawPosts);

      // Create a map of user_id to profile data
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });

      // Combine posts with user data
      const postsWithUsers = rawPosts.map(post => ({
        ...post,
        user: profileMap.get(post.user_id) || null
      }));

      // If user is authenticated, check which posts they've liked
      if (user) {
        const { data: userLikes, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);

        if (!likesError && userLikes) {
          const likedPostIds = new Set(userLikes.map(like => like.post_id));
          postsWithUsers.forEach(post => {
            post.isLiked = likedPostIds.has(post.id);
          });
        }
      }

      console.log('Setting posts state with', postsWithUsers.length, 'posts');
      setPosts(postsWithUsers);
    } catch (error) {
      console.error('Error in loadPosts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: any) => {
    try {
      if (!user?.id) {
        return { error: 'You must be signed in to create a post', success: false };
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([{ ...postData, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        return { error: error.message, success: false };
      }

      console.log('Post created successfully:', data);
      await loadPosts(); // Refresh the posts list
      return { error: null, success: true };
    } catch (error) {
      console.error('Error creating post:', error);
      return { error: 'Failed to create post', success: false };
    }
  };

  const updatePost = async (postId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId);

      if (error) {
        return { error: error.message, success: false };
      }

      await loadPosts();
      return { error: null, success: true };
    } catch (error) {
      return { error: 'Failed to update post', success: false };
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        return { error: error.message, success: false };
      }

      await loadPosts();
      return { error: null, success: true };
    } catch (error) {
      return { error: 'Failed to delete post', success: false };
    }
  };

  const likePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('post_likes')
        .insert([{ post_id: postId, user_id: user?.id }]);

      if (error) {
        return { error: error.message, success: false };
      }

      // Update local state immediately for better UX
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, isLiked: true, likes_count: post.likes_count + 1 }
            : post
        )
      );

      return { error: null, success: true };
    } catch (error) {
      return { error: 'Failed to like post', success: false };
    }
  };

  const unlikePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user?.id);

      if (error) {
        return { error: error.message, success: false };
      }

      // Update local state immediately for better UX
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, isLiked: false, likes_count: Math.max(0, post.likes_count - 1) }
            : post
        )
      );

      return { error: null, success: true };
    } catch (error) {
      return { error: 'Failed to unlike post', success: false };
    }
  };

  const addComment = async (postId: string, content: string) => {
    try {
      if (!user?.id) {
        return { error: 'You must be signed in to comment', success: false };
      }

      const { data, error } = await supabase
        .from('post_comments')
        .insert([{ 
          post_id: postId, 
          user_id: user.id, 
          content: content 
        }])
        .select()
        .single();

      if (error) {
        return { error: error.message, success: false };
      }

      // Update local state immediately for better UX
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );

      return { error: null, success: true };
    } catch (error) {
      return { error: 'Failed to add comment', success: false };
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        return { error: error.message, success: false };
      }

      // Refresh posts to update comment counts
      await loadPosts();
      return { error: null, success: true };
    } catch (error) {
      return { error: 'Failed to delete comment', success: false };
    }
  };

  const loadComments = async (postId: string): Promise<Comment[]> => {
    try {
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        return [];
      }

      if (!comments || comments.length === 0) return [];

      const userIds = [...new Set(comments.map(c => c.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, profile_picture, email')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error loading comment profiles:', profilesError);
        return comments;
      }

      const profileMap = new Map<string, { user_id: string; name: string; profile_picture: string | null; email: string }>();
      profiles?.forEach(p => profileMap.set(p.user_id, p as any));

      return comments.map(comment => ({
        ...comment,
        user: profileMap.get(comment.user_id) || undefined,
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
      return [];
    }
  };

  const getUserPosts = (userId: string): Post[] => {
    return posts.filter(post => post.user_id === userId);
  };

  const refreshPosts = () => {
    loadPosts();
  };

  useEffect(() => {
    loadPosts();
  }, [user]);

  const value: PostsContextType = {
    posts,
    loading,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    addComment,
    deleteComment,
    loadComments,
    refreshPosts,
    getUserPosts
  };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};
