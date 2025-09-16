import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

export type UserProfile = Database['public']['Tables']['profiles']['Row'] | null;

type ProfileContextType = {
  profile: UserProfile;
  loading: boolean;
  createProfile: (profileData: Omit<Database['public']['Tables']['profiles']['Insert'], 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ error?: string; success?: boolean }>;
  updateProfile: (profileData: Partial<Database['public']['Tables']['profiles']['Update']>) => Promise<{ error?: string; success?: boolean }>;
  uploadProfilePicture: (file: File) => Promise<{ url?: string; error?: string }>;
  hasProfile: boolean;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);

  const createProfile = async (profileData: Omit<Database['public']['Tables']['profiles']['Insert'], 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!user) {
        return { error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          email: user.email!,
          ...profileData,
        })
        .select()
        .single();

      if (error) {
        console.error('Create profile error:', error);
        return { error: error.message };
      }

      setProfile(data);
      return { success: true };
    } catch (error) {
      console.error('Create profile error:', error);
      return { error: 'Failed to create profile' };
    }
  };

  const updateProfile = async (profileData: Partial<Database['public']['Tables']['profiles']['Update']>) => {
    try {
      if (!user || !profile) {
        return { error: 'User not authenticated or no profile exists' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Update profile error:', error);
        return { error: error.message };
      }

      setProfile(data);
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: 'Failed to update profile' };
    }
  };

  const uploadProfilePicture = async (file: File) => {
    try {
      if (!user) {
        return { error: 'User not authenticated' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName; // Simplified path structure

      console.log('Uploading profile picture:', { 
        filePath, 
        fileSize: file.size, 
        fileType: file.type,
        userId: user.id 
      });

      // First, check if the bucket exists
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      console.log('Available buckets:', buckets);
      
      if (bucketError) {
        console.error('Bucket list error:', bucketError);
      }

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { error: error.message };
      }

      console.log('Upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);
      
      // Ensure the URL is complete and correct
      const fullUrl = publicUrl || `https://mphkcuxbsggnbtvzemxf.supabase.co/storage/v1/object/public/avatars/${filePath}`;
      console.log('Full URL:', fullUrl);
      
      return { url: fullUrl };
    } catch (error) {
      console.error('Upload error:', error);
      return { error: 'Failed to upload image' };
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated || !user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Load profile error:', error);
        }

        setProfile(data || null);
      } catch (error) {
        console.error('Load profile error:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, isAuthenticated]);

  const value = {
    profile,
    loading,
    createProfile,
    updateProfile,
    uploadProfilePicture,
    hasProfile: !!profile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
