import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CommentsSection } from "@/components/CommentsSection";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts, type Post } from "@/contexts/PostsContext";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase";
import { 
  Heart, 
  Share2, 
  MoreHorizontal, 
  Filter, 
  Search,
  FileIcon,
  Calendar,
  Star,
  Users,
  Clock
} from "lucide-react";
import { MessageButton } from "@/components/messaging/MessageButton";

const SocialFeed: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { posts, loading, likePost, unlikePost, refreshPosts } = usePosts();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  // Filter and sort posts
  const filteredPosts = posts
    .filter(post => {
      if (filterType !== 'all' && post.post_type !== filterType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          post.user?.name?.toLowerCase().includes(query) ||
          post.skills_offered?.some(skill => skill.toLowerCase().includes(query)) ||
          post.skills_needed?.some(skill => skill.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.isLiked) {
      await unlikePost(postId);
    } else {
      await likePost(postId);
    }
  };

  const getPostTypeInfo = (type: string) => {
    switch (type) {
      case 'skill_offer':
        return { label: 'Skill Offer', color: 'bg-green-100 text-green-800', icon: '💼' };
      case 'skill_request':
        return { label: 'Skill Request', color: 'bg-blue-100 text-blue-800', icon: '🔍' };
      case 'project':
        return { label: 'Project', color: 'bg-purple-100 text-purple-800', icon: '🤝' };
      case 'general':
        return { label: 'General', color: 'bg-gray-100 text-gray-800', icon: '📝' };
      default:
        return { label: type, color: 'bg-gray-100 text-gray-800', icon: '📝' };
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-orange-100 text-orange-700';
      case 'expert': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'full_time': return 'bg-blue-100 text-blue-700';
      case 'part_time': return 'bg-purple-100 text-purple-700';
      case 'project_based': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const renderMediaPreview = (mediaUrl: string, index: number) => {
    if (mediaUrl.startsWith('data:image/')) {
      return (
        <img
          src={mediaUrl}
          alt={`Post media ${index + 1}`}
          className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
          onClick={() => window.open(mediaUrl, '_blank')}
        />
      );
    } else if (mediaUrl.startsWith('data:video/')) {
      return (
        <video
          src={mediaUrl}
          className="w-full h-48 object-cover rounded-lg border border-gray-200"
          controls
          preload="metadata"
        />
      );
    } else {
      return (
        <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
          <FileIcon className="w-8 h-8 text-gray-400" />
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/")}
                className="text-gray-600 hover:text-green-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                title="Back to home"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">ST</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SkillTrade Feed</h1>
                  <p className="text-sm text-gray-500">{filteredPosts.length} posts</p>
                </div>
              </div>
            </div>

                         {/* Search and Actions */}
             <div className="flex items-center space-x-3">
               {/* Search */}
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input
                   type="text"
                   placeholder="Search posts..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 w-64"
                 />
               </div>

               {/* Filter */}
               <div className="relative">
                 <select
                   value={filterType}
                   onChange={(e) => setFilterType(e.target.value)}
                   className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                 >
                   <option value="all">All Posts</option>
                   <option value="skill_offer">Skill Offers</option>
                   <option value="skill_request">Skill Requests</option>
                   <option value="project">Projects</option>
                   <option value="general">General</option>
                 </select>
                 <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
               </div>

               {/* Sort */}
               <div className="relative">
                 <select
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular')}
                   className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                 >
                   <option value="latest">Latest</option>
                   <option value="popular">Popular</option>
                 </select>
                 <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
               </div>

               {/* Notifications */}
               <NotificationBell />

               <Button
                 onClick={() => navigate("/create-post")}
                 className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
               >
                 Create Post
               </Button>
             </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Be the first to create a post!'
              }
            </p>
            <Button
              onClick={() => navigate("/create-post")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
            >
              Create Your First Post
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post) => {
              const postTypeInfo = getPostTypeInfo(post.post_type);
              
              return (
                <div
                  key={post.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Post Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start space-x-4">
                      <img
                        src={
                          post.user?.profile_picture ||
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                        }
                        alt={post.user?.name || "User"}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {post.user?.name || "Anonymous User"}
                          </h3>
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1",
                            postTypeInfo.color
                          )}>
                            <span>{postTypeInfo.icon}</span>
                            <span>{postTypeInfo.label}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-3 text-lg">{post.title}</h4>
                    <p className="text-gray-700 whitespace-pre-wrap mb-4 leading-relaxed">{post.content}</p>

                    {/* Post Media/Images */}
                    {post.media_urls && post.media_urls.length > 0 && (
                      <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {post.media_urls.map((mediaUrl, index) => (
                            <div key={index} className="relative group">
                              {renderMediaPreview(mediaUrl, index)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {(post.skills_offered?.length > 0 || post.skills_needed?.length > 0) && (
                      <div className="mb-6">
                        {post.skills_offered?.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Users className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-600">Offering</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {post.skills_offered.map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {post.skills_needed?.length > 0 && (
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <Star className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-600">Seeking</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {post.skills_needed.map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      {post.experience_level && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4" />
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getExperienceColor(post.experience_level))}>
                            {post.experience_level}
                          </span>
                        </div>
                      )}
                      {post.availability && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getAvailabilityColor(post.availability))}>
                            {post.availability.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                      {post.deadline && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Deadline: {new Date(post.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Actions */}
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={cn(
                            "flex items-center space-x-2 text-sm transition-colors",
                            post.isLiked
                              ? "text-red-600 hover:text-red-700"
                              : "text-gray-500 hover:text-red-600"
                          )}
                        >
                          <Heart className={cn("w-5 h-5", post.isLiked ? "fill-current" : "fill-none")} />
                          <span>{post.likes_count} likes</span>
                        </button>
                        <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                          <Share2 className="w-5 h-5" />
                          <span>Share</span>
                        </button>
                      </div>
                      <MessageButton userId={post.user_id} userName={post.user?.name} />
                    </div>
                  </div>

                  {/* Comments Section */}
                  <CommentsSection 
                    postId={post.id} 
                    commentsCount={post.comments_count}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Message Button removed during messaging refactor */}
    </div>
  );
};

export default SocialFeed;
