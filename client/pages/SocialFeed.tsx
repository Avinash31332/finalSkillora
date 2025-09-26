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
  MessageSquare,
  Share2, 
  MoreHorizontal, 
  Filter, 
  Search,
  FileIcon,
  Calendar,
  Star,
  Users,
  Clock,
  Plus,
  Home,
  TrendingUp,
  Award,
  Globe,
  Eye,
  Briefcase,
  Bell
} from "lucide-react";
import { MessageButton } from "@/components/messaging/MessageButton";
import { useProfile } from "@/contexts/ProfileContext";

const SocialFeed: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { posts, loading, likePost, unlikePost, refreshPosts } = usePosts();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { profile: currentUserProfile } = useProfile();
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  // Filter and sort posts
  const filteredPosts = posts
    .filter(post => {
      if (filterType !== 'all' && post.post_type !== filterType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          post.title?.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query) ||
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
        return { 
          label: 'Skill Offer', 
          color: 'text-green-600', 
          bgColor: 'bg-green-50 border-green-200', 
          icon: Briefcase 
        };
      case 'skill_request':
        return { 
          label: 'Skill Request', 
          color: 'text-blue-600', 
          bgColor: 'bg-blue-50 border-blue-200', 
          icon: Search 
        };
      case 'project':
        return { 
          label: 'Project', 
          color: 'text-purple-600', 
          bgColor: 'bg-purple-50 border-purple-200', 
          icon: Star 
        };
      case 'general':
        return { 
          label: 'General', 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-50 border-gray-200', 
          icon: Globe 
        };
      default:
        return { 
          label: type, 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-50 border-gray-200', 
          icon: Globe 
        };
    }
  };

  const experienceColors = {
    beginner: 'bg-green-50 text-green-700 border-green-200',
    intermediate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    advanced: 'bg-orange-50 text-orange-700 border-orange-200',
    expert: 'bg-red-50 text-red-700 border-red-200',
    default: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const getExperienceColor = (level: string) => {
    return experienceColors[level as keyof typeof experienceColors] || experienceColors.default;
  };

  const availabilityColors = {
    full_time: 'bg-blue-50 text-blue-700 border-blue-200',
    part_time: 'bg-purple-50 text-purple-700 border-purple-200',
    project_based: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    default: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const getAvailabilityColor = (availability: string) => {
    return availabilityColors[availability as keyof typeof availabilityColors] || availabilityColors.default;
  };

  const renderMediaPreview = (mediaUrl: string, index: number) => {
    if (mediaUrl.startsWith('data:image/') || mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
      return (
        <img
        src={mediaUrl}
        alt={`Post media ${index + 1}`}
          className="w-full max-h-96 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity border border-gray-200"
          onClick={() => window.open(mediaUrl, '_blank')}
        />
      );
    } else if (mediaUrl.startsWith('data:video/') || mediaUrl.match(/\.(mp4|webm|ogg)$/i)) {
      return (
        <video
          src={mediaUrl}
          className="w-full max-h-96 object-cover rounded-lg border border-gray-200"
          controls
          preload="metadata"
        />
      );
    } else {
      return (
        <div className="w-full h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
          <div className="text-center">
            <FileIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-sm text-gray-500">Attachment</span>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* LinkedIn-style Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Left Section - Logo & Search */}
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate("/")}
                className="flex items-center space-x-3 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">SO</span>
                </div>
                <span className="hidden md:block text-xl font-bold text-gray-900">SkillOra</span>
              </button>
              
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts, skills, people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 bg-gray-100 border-0 rounded-md text-sm placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Right Section - Navigation & Actions */}
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => navigate('/')}
                className="flex flex-col items-center p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-w-[64px]"
              >
                <Home className="w-6 h-6" />
                <span className="text-xs mt-1">Home</span>
              </button>
              
              <div className="relative">
                <button className="flex flex-col items-center p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-w-[64px]">
                  <TrendingUp className="w-6 h-6" />
                  <span className="text-xs mt-1">Trending</span>
                </button>
              </div>

              <div className="relative">
                <button className="flex flex-col items-center p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-w-[64px] relative">
                  <Bell className="w-6 h-6" />
                  <span className="text-xs mt-1">Notifications</span>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </button>
              </div>

              <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-gray-200">
                <img
                src={currentUserProfile?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserProfile?.name || 'S')}&background=0D8ABC&color=fff`}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
                <Button
                  onClick={() => navigate("/create-post")}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-6">
          {/* Left Sidebar */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              {/* Profile Cover */}
              <div className="h-16 bg-gradient-to-r from-green-600 to-green-700"></div>
              
              {/* Profile Info */}
              <div className="p-4 text-center -mt-8">
                <img
                src={currentUserProfile?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserProfile?.name || 'S')}&background=0D8ABC&color=fff`}
                  alt="Profile"
                  className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-white shadow-sm"
                />
                <h3 className="font-semibold text-gray-900">{currentUserProfile?.name || "Your Name"}</h3>
                <p className="text-sm text-gray-500 mt-1">Professional Network</p>
              </div>
              
              {/* Stats */}
              <div className="px-4 pb-4 space-y-2 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center hover:bg-gray-50 px-2 py-1 rounded">
                  <span className="text-gray-600">Profile views</span>
                  <span className="font-semibold text-green-600">24</span>
                </div>
                <div className="flex justify-between items-center hover:bg-gray-50 px-2 py-1 rounded">
                  <span className="text-gray-600">Post impressions</span>
                  <span className="font-semibold text-green-600">156</span>
                </div>
              </div>
            </div>

            {/* Trending Skills */}
            <div className="bg-white rounded-lg border border-gray-200 mt-4 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Trending Skills</h3>
              <div className="space-y-2 text-sm">
                {['React Development', 'UI/UX Design', 'Data Science', 'Python'].map((skill, index) => (
                  <div key={skill} className="flex items-center justify-between hover:bg-gray-50 px-2 py-1 rounded">
                    <span className="text-gray-600">{skill}</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2">
            {/* Create Post Widget */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <img
                src={currentUserProfile?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserProfile?.name || 'S')}&background=0D8ABC&color=fff`}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <button
                  onClick={() => navigate("/create-post")}
                  className="flex-1 text-left px-4 py-3 border border-gray-300 rounded-full text-gray-500 hover:bg-gray-50 transition-colors text-sm"
                >
                  Start a post about your skills...
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSortBy('latest')}
                    className={cn(
                      "px-3 py-2 rounded-full text-sm font-medium transition-colors",
                      sortBy === 'latest'
                        ? "bg-green-100 text-green-700"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setSortBy('popular')}
                    className={cn(
                      "px-3 py-2 rounded-full text-sm font-medium transition-colors",
                      sortBy === 'popular'
                        ? "bg-green-100 text-green-700"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    Popular
                  </button>
                </div>
                
                <div className="relative">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                  >
                    <option value="all">All Posts</option>
                    <option value="skill_offer">Skill Offers</option>
                    <option value="skill_request">Skill Requests</option>
                    <option value="project">Projects</option>
                    <option value="general">General</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts to show</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || filterType !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Be the first to share something with your network!'
                  }
                </p>
                <Button
                  onClick={() => navigate("/create-post")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Create Your First Post
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => {
                  const postTypeInfo = getPostTypeInfo(post.post_type);
                  const IconComponent = postTypeInfo.icon;
                  
                  return (
                    <article
                      key={post.id}
                      className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 shadow-sm"
                    >
                      {/* Post Header */}
                      <div className="p-4 pb-3">
                        <div className="flex items-start space-x-3">
                          <img
                          src={
                              post.user?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.name || 'A')}&background=random`
                          }
                            alt={post.user?.name || "User"}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              const name = post.user?.name || 'A';
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {post.user?.name || "Anonymous User"}
                              </h3>
                              <span className="text-gray-500">•</span>
                              <span className="text-sm text-gray-500">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className={cn("flex items-center space-x-1 px-2 py-1 rounded-full border", postTypeInfo.bgColor)}>
                                <IconComponent className={cn("w-3 h-3", postTypeInfo.color)} />
                                <span className={cn("text-xs font-medium", postTypeInfo.color)}>
                                  {postTypeInfo.label}
                                </span>
                              </div>
                              <Globe className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                          <button className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="px-4 pb-3">
                        {post.title && (
                          <h4 className="font-semibold text-gray-900 mb-2 text-lg">{post.title}</h4>
                        )}
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                          {post.content}
                        </p>

                        {/* Skills Tags */}
                        {(post.skills_offered?.length > 0 || post.skills_needed?.length > 0) && (
                          <div className="mb-4 space-y-3">
                            {post.skills_offered?.length > 0 && (
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <Users className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-600">Offering</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {post.skills_offered.map((skill, index) => (
                                    <span
                                      key={index}
                                      className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm border border-green-200 hover:bg-green-100 transition-colors"
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
                                  <span className="text-sm font-medium text-blue-600">Looking for</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {post.skills_needed.map((skill, index) => (
                                    <span
                                      key={index}
                                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200 hover:bg-blue-100 transition-colors"
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
                        {(post.experience_level || post.availability || post.deadline) && (
                          <div className="flex flex-wrap gap-3 text-sm mb-3">
                            {post.experience_level && (
                              <div className="flex items-center space-x-1">
                                <Award className="w-4 h-4 text-gray-500" />
                                <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", getExperienceColor(post.experience_level))}>
                                  {post.experience_level.charAt(0).toUpperCase() + post.experience_level.slice(1)}
                                </span>
                              </div>
                            )}
                            {post.availability && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", getAvailabilityColor(post.availability))}>
                                  {post.availability.replace('', ' ').charAt(0).toUpperCase() + post.availability.replace('', ' ').slice(1)}
                                </span>
                              </div>
                            )}
                            {post.deadline && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">Due {new Date(post.deadline).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Post Media */}
                      {post.media_urls && post.media_urls.length > 0 && (
                        <div className="px-4 pb-3">
                          <div className="space-y-3">
                            {post.media_urls.map((mediaUrl, index) => (
                              <div key={index}>
                                {renderMediaPreview(mediaUrl, index)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Post Stats */}
                      {(post.likes_count > 0 || post.comments_count > 0) && (
                        <div className="px-4 pb-2 border-b border-gray-100">
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              {post.likes_count > 0 && (
                                <button className="flex items-center space-x-1 hover:underline">
                                  <div className="flex -space-x-1">
                                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center border-2 border-white">
                                      <Heart className="w-3 h-3 text-red-600 fill-current" />
                                    </div>
                                  </div>
                                  <span>{post.likes_count}</span>
                                </button>
                              )}
                            </div>
                            {post.comments_count > 0 && (
                              <button className="hover:underline">
                                {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="px-4 py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleLike(post.id)}
                              className={cn(
                                "flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium",
                                post.isLiked
                                  ? "text-red-600"
                                  : "text-gray-600"
                              )}
                            >
                              <Heart className={cn("w-5 h-5", post.isLiked ? "fill-current" : "")} />
                              <span>Like</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600">
                              <MessageSquare className="w-5 h-5" />
                              <span>Comment</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600">
                              <Share2 className="w-5 h-5" />
                              <span>Share</span>
                            </button>
                          </div>
                          <MessageButton 
                            userId={post.user_id} 
                            userName={post.user?.name}
                            className="text-sm font-medium text-gray-600 hover:text-gray-900"
                          />
                        </div>
                      </div>

                      {/* Comments Section */}
                      <CommentsSection 
                        postId={post.id} 
                        commentsCount={post.comments_count}
                      />
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block">
            {/* Activity Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Skill Exchange Network</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <span className="text-gray-600">Active skill offers</span>
                  <span className="font-semibold text-green-600">42</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <span className="text-gray-600">Skill requests</span>
                  <span className="font-semibold text-blue-600">28</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                  <span className="text-gray-600">Active collaborations</span>
                  <span className="font-semibold text-purple-600">15</span>
                </div>
              </div>
              <Button 
                onClick={() => navigate("/create-post")} 
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                Share Your Skills
              </Button>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                Recent Activity
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  { text: 'New React developer joined', time: '2 minutes ago', color: 'bg-green-500' },
                  { text: 'UI/UX Design project posted', time: '15 minutes ago', color: 'bg-blue-500' },
                  { text: 'Python mentorship available', time: '1 hour ago', color: 'bg-purple-500' },
                  { text: 'Web development trade completed', time: '3 hours ago', color: 'bg-orange-500' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", activity.color)}></div>
                    <div className="flex-1">
                      <p className="text-gray-700">{activity.text}</p>
                      <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Widget */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4 text-center text-sm text-gray-500 shadow-sm">
              <div className="space-y-2">
                <p>About • Privacy • Terms • More</p>
                <p>SkillOra Corporation © 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialFeed;