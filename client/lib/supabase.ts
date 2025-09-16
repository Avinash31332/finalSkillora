import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mphkcuxbsggnbtvzemxf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1waGtjdXhic2dnbmJ0dnplbXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODg4NTYsImV4cCI6MjA3MTM2NDg1Nn0.E-QvvbZPu66kO4XlLOTdkQRjrOUqWM7B2D-e8qw5eQE'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          bio: string | null
          location: string | null
          profile_picture: string | null
          skills_i_have: string[] | null
          skills_i_want: string[] | null
          top_skills: string[] | null
          experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          availability: 'full_time' | 'part_time' | 'project_based' | null
          preferred_work: 'online' | 'offline' | 'both' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          bio?: string | null
          location?: string | null
          profile_picture?: string | null
          skills_i_have?: string[] | null
          skills_i_want?: string[] | null
          top_skills?: string[] | null
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          availability?: 'full_time' | 'part_time' | 'project_based' | null
          preferred_work?: 'online' | 'offline' | 'both' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          bio?: string | null
          location?: string | null
          profile_picture?: string | null
          skills_i_have?: string[] | null
          skills_i_want?: string[] | null
          top_skills?: string[] | null
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          availability?: 'full_time' | 'part_time' | 'project_based' | null
          preferred_work?: 'online' | 'offline' | 'both' | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          post_type: 'skill_offer' | 'skill_request' | 'project' | 'general'
          skills_offered: string[] | null
          skills_needed: string[] | null
          experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          availability: 'full_time' | 'part_time' | 'project_based' | null
          deadline: string | null
          media_urls: string[] | null
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          post_type: 'skill_offer' | 'skill_request' | 'project' | 'general'
          skills_offered?: string[] | null
          skills_needed?: string[] | null
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          availability?: 'full_time' | 'part_time' | 'project_based' | null
          deadline?: string | null
          media_urls?: string[] | null
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          post_type?: 'skill_offer' | 'skill_request' | 'project' | 'general'
          skills_offered?: string[] | null
          skills_needed?: string[] | null
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          availability?: 'full_time' | 'part_time' | 'project_based' | null
          deadline?: string | null
          media_urls?: string[] | null
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      post_comments: {
        Row: {
          id: string
          user_id: string
          post_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          content: string
          created_at?: string
          updated_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}

