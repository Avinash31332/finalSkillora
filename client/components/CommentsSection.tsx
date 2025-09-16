import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { usePosts, type Comment } from '@/contexts/PostsContext';
import { formatDistanceToNow } from 'date-fns';
import { 
  Send, 
  Trash2, 
  MoreHorizontal, 
  MessageCircle,
  User,
  Loader2
} from 'lucide-react';

interface CommentsSectionProps {
  postId: string;
  commentsCount: number;
  onCommentAdded?: () => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  postId,
  commentsCount,
  onCommentAdded
}) => {
  const { user } = useAuth();
  const { addComment, deleteComment, loadComments } = usePosts();
  const { profile } = useProfile();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(true);

  const loadPostComments = async () => {
    setIsLoading(true);
    try {
      const postComments = await loadComments(postId);
      setComments(postComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      loadPostComments();
    }
  }, [showComments, postId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error, success } = await addComment(postId, newComment.trim());
      
      if (success) {
        setNewComment('');
        await loadPostComments();
        onCommentAdded?.();
      } else {
        console.error('Failed to add comment:', error);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error, success } = await deleteComment(commentId);
      
      if (success) {
        // Remove comment from local state
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      } else {
        console.error('Failed to delete comment:', error);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  return (
    <div className="border-t border-gray-100 bg-gray-50">
      {/* Comments Toggle Button */}
      <div className="px-6 py-3">
        <button
          type="button"
          onClick={toggleComments}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>
            {showComments ? 'Hide' : 'Show'} {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
          </span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-6 pb-4 space-y-4">
          {/* Add Comment Form */}
          {user && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <img
                    src={profile?.profile_picture || user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                    alt="Your profile"
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                      rows={2}
                      maxLength={500}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {newComment.length}/500
                      </span>
                      <Button
                        type="button"
                        disabled={!newComment.trim() || isSubmitting}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 text-sm"
                        onClick={handleSubmitComment}
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading comments...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={
                        comment.user?.profile_picture ||
                        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                      }
                      alt={comment.user?.name || "User"}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 text-sm">
                            {comment.user?.name || "Anonymous User"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {user && comment.user_id === user.id && (
                          <div className="relative group">
                            <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
