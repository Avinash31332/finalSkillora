import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface User {
  user_id: string;
  name: string;
  email: string;
  profile_picture: string | null;
  location: string | null;
  bio: string | null;
}

interface UserSearchProps {
  onUserSelect?: (user: User) => void;
  className?: string;
}

export const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect, className }) => {
  const { user } = useAuth();
  const { createConversation, isFollowing, followUser, unfollowUser } = useMessaging();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const searchUsers = async (query: string) => {
    if (!query.trim() || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, email, profile_picture, location, bio')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('user_id', user.id)
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        searchUsers(searchTerm);
      } else {
        setUsers([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleMessageUser = async (userToMessage: User) => {
    if (!user) return;

    const conversationId = await createConversation([userToMessage.user_id]);
    if (conversationId && onUserSelect) {
      onUserSelect(userToMessage);
    }
  };

  const handleFollowUser = async (userToFollow: User) => {
    if (!user) return;

    if (isFollowing(userToFollow.user_id)) {
      await unfollowUser(userToFollow.user_id);
    } else {
      await followUser(userToFollow.user_id);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Results */}
      <div className="space-y-2">
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Searching...</p>
          </div>
        )}

        {!loading && searchTerm && users.length === 0 && (
          <div className="text-center py-8">
            <UserPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}

        {users.map((userResult) => (
          <div
            key={userResult.user_id}
            className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
          >
            <img
              src={userResult.profile_picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
              alt={userResult.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{userResult.name}</h4>
              <p className="text-sm text-gray-500 truncate">{userResult.email}</p>
              {userResult.location && (
                <p className="text-xs text-gray-400">📍 {userResult.location}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handleMessageUser(userResult)}
                size="sm"
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Message
              </Button>
              
              <Button
                onClick={() => handleFollowUser(userResult)}
                size="sm"
                variant={isFollowing(userResult.user_id) ? "outline" : "default"}
                className={cn(
                  isFollowing(userResult.user_id)
                    ? "border-red-500 text-red-600 hover:bg-red-50"
                    : "bg-green-600 hover:bg-green-700"
                )}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                {isFollowing(userResult.user_id) ? "Following" : "Follow"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
