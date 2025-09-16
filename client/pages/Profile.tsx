import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MessageButton } from "@/components/messaging/MessageButton";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { usePosts } from "@/contexts/PostsContext";
import { formatDistanceToNow } from "date-fns";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Users,
  Star,
  Calendar,
  Clock,
  FileIcon
} from "lucide-react";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isEmailVerified, user: authUser } = useAuth();
  const { profile, loading, hasProfile } = useProfile();
  const { getUserPosts } = usePosts();
  const [activeTab, setActiveTab] = useState<"posts" | "about" | "skills">("posts");
  // messaging modal removed; we now navigate to /messages

  // Get user's posts from the database
  const userPosts = authUser ? getUserPosts(authUser.id) : [];

  useEffect(() => {
    console.log('Profile useEffect - Auth state:', { isAuthenticated, isEmailVerified, hasProfile, loading });
    
    if (!isAuthenticated) {
      console.log('Redirecting to signin - not authenticated');
      navigate("/signin");
      return;
    }
    
    if (!isEmailVerified) {
      console.log('Redirecting to home - email not verified');
      navigate("/");
      return;
    }
    
    if (!loading && !hasProfile) {
      console.log('Redirecting to create-profile - no profile');
      navigate("/create-profile");
      return;
    }
  }, [isAuthenticated, isEmailVerified, hasProfile, loading]);

  // no-op placeholder for removed messaging modal

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

  // Add debugging for navigation
  const handleNavigation = (path: string) => {
    console.log('Navigation button clicked - attempting to navigate to:', path);
    console.log('Current auth state:', { isAuthenticated, isEmailVerified, hasProfile, loading });
    console.log('Current URL:', window.location.href);
    
    try {
      console.log('Calling navigate function...');
      navigate(path);
      console.log('Navigation successful to:', path);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: try using window.location
      console.log('Trying fallback navigation...');
      window.location.href = path;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Return early if no profile
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    console.log('Back button clicked!');
                    // Try to go back to previous page, fallback to home
                    if (window.history.length > 1) {
                      console.log('Going back in history...');
                      window.history.back();
                    } else {
                      console.log('No history, going to home...');
                      handleNavigation("/");
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  title="Go back"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                
                {/* Alternative navigation options */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      console.log('Feed button clicked!');
                      handleNavigation("/feed");
                    }}
                    className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded"
                    title="Go to Feed"
                  >
                    Feed
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    onClick={() => {
                      console.log('Home button clicked!');
                      handleNavigation("/");
                    }}
                    className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded"
                    title="Go Home"
                  >
                    Home
                  </button>
                </div>
              </div>
              <h1 className="text-xl font-semibold text-foreground">Profile</h1>
            </div>
            <Button onClick={() => handleNavigation("/create-post")}>New Post</Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Professional Profile Layout */}
        <div className="bg-white border border-border mb-8">
          {/* Banner */}
          <div className="bg-primary h-32"></div>

          {/* Profile Content */}
          <div className="px-6 py-6">
            <div className="flex items-start space-x-6 -mt-16">
              {/* Profile Picture */}
              <img
                src={
                  profile.profile_picture ||
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                }
                alt={profile.name}
                className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg flex-shrink-0"
              />

              {/* Profile Info */}
              <div className="flex-1 mt-16">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    {profile.name}
                  </h1>
                  <div className="flex items-center space-x-3">
                    <MessageButton
                      userId={profile.user_id || "current-user"}
                      userName={profile.name}
                      variant="default"
                      className="bg-primary hover:bg-primary/90 text-white"
                    />
                    <Button
                      onClick={() => {
                        console.log('Edit Profile button clicked!');
                        handleNavigation("/edit-profile");
                      }}
                      variant="outline"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                  <span>{profile.location || "Location not set"}</span>
                  <span>•</span>
                  <span>Joined {new Date(profile.created_at).getFullYear()}</span>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-primary font-medium">
                    Available for skill trades
                  </span>
                </div>

                {/* Skills */}
                {profile.skills_i_have && profile.skills_i_have.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills_i_have.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="border-t border-border pt-6 mt-6">
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {userPosts.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">4.9</div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">23</div>
                  <div className="text-sm text-muted-foreground">Trades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {profile.skills_i_have?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Skills</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {[
                { id: "posts", label: "Posts", count: userPosts.length },
                { id: "about", label: "About" },
                {
                  id: "skills",
                  label: "Skills",
                  count: profile.skills_i_have?.length || 0,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "py-4 px-2 border-b-2 font-medium text-sm transition-colors",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700",
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 text-xs text-gray-400">
                      ({tab.count})
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "posts" && (
              <div className="space-y-6">
                {userPosts.length > 0 ? (
                  userPosts.map((post) => {
                    const postTypeInfo = getPostTypeInfo(post.post_type);
                    
                    return (
                      <div
                        key={post.id}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
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
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Heart className="w-5 h-5" />
                                <span>{post.likes_count} likes</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <MessageCircle className="w-5 h-5" />
                                <span>{post.comments_count} comments</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Share2 className="w-5 h-5" />
                                <span>Share</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500 mb-6">
                      Start sharing your skills and projects with the community!
                    </p>
                    <Button
                      onClick={() => handleNavigation("/create-post")}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      Create Your First Post
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "about" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {profile.bio || "No bio available."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Experience Level</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                      {profile.experience_level || "Not specified"}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Availability</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                      {profile.availability || "Not specified"}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Preferred Work</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                      {profile.preferred_work || "Not specified"}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                    <span className="text-gray-700">{profile.location || "Not specified"}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "skills" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Expertise</h3>
                  
                  {profile.skills_i_have && profile.skills_i_have.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">Skills I Have</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills_i_have.map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.skills_i_want && profile.skills_i_want.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">Skills I Want to Learn</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills_i_want.map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.top_skills && profile.top_skills.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Top Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.top_skills.map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!profile.skills_i_have || profile.skills_i_have.length === 0) &&
                   (!profile.skills_i_want || profile.skills_i_want.length === 0) &&
                   (!profile.top_skills || profile.top_skills.length === 0) && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No skills added yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MessagingInterface removed; we navigate to /messages */}
    </div>
  );
};

export default Profile;
