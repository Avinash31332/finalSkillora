import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/contexts/PostsContext';
import { useProfile } from '@/contexts/ProfileContext';
import { X, Image, Video, File, Plus, Trash2, Upload } from 'lucide-react';

type PostType = 'skill_offer' | 'skill_request' | 'project' | 'general';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type Availability = 'full_time' | 'part_time' | 'project_based';

interface PostData {
  type: PostType;
  title: string;
  description: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
  availability?: Availability;
  deadline?: string;
  budget?: string;
  location?: string;
  media?: {
    files: File[];
    previews: string[];
  };
}

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isEmailVerified } = useAuth();
  const { profile, hasProfile } = useProfile();
  const { createPost } = usePosts();
  const [step, setStep] = useState(1);
  const [currentSkill, setCurrentSkill] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [postData, setPostData] = useState<PostData>({
    type: 'general',
    title: '',
    description: '',
    skills: [],
    experienceLevel: 'intermediate',
    availability: 'project_based',
    deadline: '',
    budget: '',
    location: '',
    media: {
      files: [],
      previews: []
    }
  });

  const addSkill = () => {
    if (currentSkill.trim() && !postData.skills.includes(currentSkill.trim())) {
      setPostData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setPostData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileUpload = (files: FileList) => {
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      const isValidType = file.type.startsWith('image/') || 
                         file.type.startsWith('video/') || 
                         file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== newFiles.length) {
      alert('Some files were skipped. Only images, videos, and PDFs under 10MB are allowed.');
    }

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setPostData(prev => ({
          ...prev,
          media: {
            files: [...(prev.media?.files || []), file],
            previews: [...(prev.media?.previews || []), preview]
          }
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setPostData(prev => ({
      ...prev,
      media: {
        files: prev.media?.files.filter((_, i) => i !== index) || [],
        previews: prev.media?.previews.filter((_, i) => i !== index) || []
      }
    }));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to create a post');
      return;
    }

    if (!hasProfile) {
      alert('Please create a profile first');
      navigate('/create-profile');
      return;
    }

    try {
      setIsSubmitting(true);

      const postDataForDB = {
        title: postData.title,
        content: postData.description,
        post_type: postData.type,
        skills_offered: postData.type === 'skill_request' ? postData.skills : [],
        skills_needed: postData.type === 'skill_offer' || postData.type === 'project' ? postData.skills : [],
        experience_level: postData.experienceLevel,
        availability: postData.availability,
        deadline: postData.deadline ? new Date(postData.deadline).toISOString() : null,
        media_urls: postData.media?.previews || [],
      };

      console.log('Creating post with data:', postDataForDB);

      const { error, success } = await createPost(postDataForDB);

      if (error) {
        alert(`Failed to create post: ${error}`);
        return;
      }

      if (success) {
        alert('Post created successfully!');
        navigate('/feed');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('An error occurred while creating your post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return postData.type !== 'general';
    if (step === 2) {
      return postData.title && postData.description && postData.skills.length > 0;
    }
    return true;
  };

  const getPostTypeInfo = (type: PostType) => {
    switch (type) {
      case 'skill_offer':
        return {
          title: 'I have work to offer',
          subtitle: 'Post a project or job opportunity',
          icon: '💼',
          color: 'green'
        };
      case 'skill_request':
        return {
          title: 'I\'m looking for work',
          subtitle: 'Showcase your skills and availability',
          icon: '🔍',
          color: 'blue'
        };
      case 'project':
        return {
          title: 'Project Collaboration',
          subtitle: 'Find partners for your project',
          icon: '🤝',
          color: 'purple'
        };
      default:
        return {
          title: 'General Post',
          subtitle: 'Share something with the community',
          icon: '📝',
          color: 'gray'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/feed')}
                className="text-gray-600 hover:text-green-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Create Post</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[1, 2].map((stepNumber) => (
                  <div
                    key={stepNumber}
                    className={cn(
                      "w-3 h-3 rounded-full transition-colors",
                      step >= stepNumber ? "bg-green-500" : "bg-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 ml-2">Step {step} of 2</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Step 1: Choose Post Type */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">What do you want to share?</h2>
              <p className="text-gray-600 text-lg">Choose the type of post you'd like to create</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['skill_offer', 'skill_request', 'project', 'general'] as PostType[]).map((type) => {
                const info = getPostTypeInfo(type);
                const isSelected = postData.type === type;
                
                return (
                  <button
                    key={type}
                    onClick={() => setPostData(prev => ({ ...prev, type }))}
                    className={cn(
                      "group relative bg-white border-2 rounded-xl p-8 text-left transition-all duration-200 hover:shadow-lg hover:scale-105",
                      isSelected 
                        ? `border-${info.color}-500 bg-${info.color}-50` 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-colors",
                        isSelected ? `bg-${info.color}-500 text-white` : `bg-${info.color}-100 group-hover:bg-${info.color}-200`
                      )}>
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{info.title}</h3>
                        <p className="text-gray-600">{info.subtitle}</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {type === 'skill_offer' && (
                        <>
                          <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            <span>Describe the work you need done</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            <span>Specify required skills and experience</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            <span>Set deadlines and expectations</span>
                          </li>
                        </>
                      )}
                      {type === 'skill_request' && (
                        <>
                          <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <span>Highlight your skills and experience</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <span>Show your availability and preferences</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <span>Specify what you can offer in exchange</span>
                          </li>
                        </>
                      )}
                      {type === 'project' && (
                        <>
                          <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                            <span>Describe your project idea</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                            <span>List required skills and roles</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                            <span>Outline collaboration terms</span>
                          </li>
                        </>
                      )}
                      {type === 'general' && (
                        <>
                          <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                            <span>Share thoughts, ideas, or updates</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                            <span>Connect with the community</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                            <span>Start discussions and conversations</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center pt-6">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceed()}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Post Details */}
        {step === 2 && postData.type && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {getPostTypeInfo(postData.type).title}
              </h2>
              <p className="text-gray-600 text-lg">
                {getPostTypeInfo(postData.type).subtitle}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Post Title *
                </label>
                <input
                  type="text"
                  value={postData.title}
                  onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Enter a compelling title for your post..."
                  maxLength={100}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {postData.title.length}/100
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={postData.description}
                  onChange={(e) => setPostData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-colors"
                  placeholder="Tell us more about what you're looking for or offering..."
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {postData.description.length}/1000
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {postData.type === 'skill_request' ? 'Skills/Services Offered *' : 'Skills/Services Needed *'}
                </label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Type a skill and press Enter"
                  />
                  <Button
                    type="button"
                    onClick={addSkill}
                    variant="outline"
                    className="px-6 border-green-500 text-green-600 hover:bg-green-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {postData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {postData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center space-x-2 group hover:bg-green-200 transition-colors"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-green-600 hover:text-green-800 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Experience Level Required *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['beginner', 'intermediate', 'advanced', 'expert'] as ExperienceLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPostData(prev => ({ ...prev, experienceLevel: level }))}
                      className={cn(
                        "py-3 px-4 text-sm font-medium rounded-lg border transition-all duration-200 capitalize",
                        postData.experienceLevel === level
                          ? "bg-green-600 text-white border-green-600 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Add Media (Optional)
                </label>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
                    dragActive 
                      ? "border-green-400 bg-green-50" 
                      : "border-gray-300 hover:border-green-400 hover:bg-green-50"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf"
                    onChange={(e) => handleFileUpload(e.target.files!)}
                    className="hidden"
                  />
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Upload className="w-12 h-12 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">
                        <span className="text-green-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Images, videos, and PDFs up to 10MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Media Previews */}
                {postData.media && postData.media.previews.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Uploaded Media</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {postData.media.previews.map((preview, index) => (
                        <div key={index} className="relative group">
                          {postData.media?.files[index]?.type.startsWith('image/') ? (
                            <img
                              src={preview}
                              alt="Preview"
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:opacity-75 transition-opacity"
                            />
                          ) : postData.media?.files[index]?.type.startsWith('video/') ? (
                            <video
                              src={preview}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:opacity-75 transition-opacity"
                              controls={false}
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center group-hover:opacity-75 transition-opacity">
                              <File className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <button
                            onClick={() => removeMedia(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg truncate">
                            {postData.media?.files[index]?.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Fields */}
              {postData.type === 'skill_request' && (
                <>
                  {/* Availability */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Availability *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(['full_time', 'part_time', 'project_based'] as Availability[]).map((availability) => (
                        <button
                          key={availability}
                          type="button"
                          onClick={() => setPostData(prev => ({ ...prev, availability }))}
                          className={cn(
                            "py-3 px-4 text-sm font-medium rounded-lg border transition-all duration-200",
                            postData.availability === availability
                              ? "bg-green-600 text-white border-green-600 shadow-md"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                          )}
                        >
                          {availability === 'full_time' && 'Full Time'}
                          {availability === 'part_time' && 'Part Time'}
                          {availability === 'project_based' && 'Project Based'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={postData.location}
                      onChange={(e) => setPostData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="City, Country or Remote"
                    />
                  </div>
                </>
              )}

              {(postData.type === 'skill_offer' || postData.type === 'project') && (
                <>
                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Budget Range (Optional)
                    </label>
                    <input
                      type="text"
                      value={postData.budget}
                      onChange={(e) => setPostData(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="e.g., $500-1000, Negotiable, Equity"
                    />
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Deadline (Optional)
                    </label>
                    <input
                      type="date"
                      value={postData.deadline}
                      onChange={(e) => setPostData(prev => ({ ...prev, deadline: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={postData.location}
                      onChange={(e) => setPostData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="City, Country or Remote"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="px-6 py-3 transition-colors"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publishing...
                  </>
                ) : (
                  'Publish Post'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePost;
