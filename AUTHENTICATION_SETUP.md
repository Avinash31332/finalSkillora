# SkillOra Authentication Setup Guide

## Overview
This guide will help you set up the complete authentication system for SkillOra using Supabase.

## Prerequisites
- Supabase account and project
- Node.js and npm installed
- The project dependencies installed

## Step 1: Supabase Database Setup

1. **Go to your Supabase project dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `mphkcuxbsggnbtvzemxf`

2. **Run the SQL script**
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase-setup.sql`
   - Execute the script to create:
     - `profiles` table with proper RLS policies
     - `avatars` storage bucket for profile pictures
     - Storage policies for secure file uploads

3. **Enable Email Authentication**
   - Go to Authentication > Settings
   - Enable "Enable email confirmations"
   - Set your site URL to: `http://localhost:8080`
   - Add redirect URLs: `http://localhost:8080/auth/callback`

## Step 2: Environment Configuration

The Supabase configuration is already set up in `client/lib/supabase.ts` with your project credentials.

## Step 3: Authentication Flow

### User Registration Flow:
1. User clicks "Sign Up" → `/signup`
2. User fills email/password → Supabase creates account
3. User receives verification email
4. User clicks verification link → `/auth/callback`
5. Email verified → User can now sign in
6. After sign in → User redirected to home page
7. If no profile → "Get Started" button becomes "Create Profile"
8. User creates profile → Profile appears in header

### User Sign In Flow:
1. User clicks "Sign In" → `/signin`
2. User enters credentials → Supabase authenticates
3. If email not verified → Error message
4. If authenticated → Redirect to home page
5. If no profile → "Create Profile" button in header
6. If has profile → Profile dropdown in header

## Step 4: Testing the System

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the complete flow:**
   - Visit `http://localhost:8080`
   - Click "Sign Up" and create an account
   - Check your email for verification link
   - Click the verification link
   - Sign in with your credentials
   - Create your profile
   - Verify profile appears in header

## Features Implemented

### ✅ Authentication
- [x] User registration with email verification
- [x] User sign in with email/password
- [x] Email verification flow
- [x] Secure session management
- [x] Sign out functionality

### ✅ Profile Management
- [x] Profile creation after authentication
- [x] Profile picture upload to Supabase Storage
- [x] Profile data storage in Supabase database
- [x] Profile editing capabilities
- [x] Profile display in header

### ✅ UI/UX
- [x] Professional sign up/sign in pages
- [x] Email verification success/error pages
- [x] Dynamic header based on auth state
- [x] Button text changes based on user state
- [x] Proper error handling and user feedback

### ✅ Security
- [x] Row Level Security (RLS) policies
- [x] Secure file upload policies
- [x] Email verification requirement
- [x] Protected routes and redirects

## Database Schema

### Profiles Table
```sql
profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  bio TEXT,
  location TEXT,
  profile_picture TEXT,
  _i_have TEXT[],
  skills_i_want TEXT[],
  top_skills TEXT[],
  experience_level TEXT,
  availability TEXT,
  preferred_work TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## File Structure

```
client/
├── lib/
│   └── supabase.ts          # Supabase client configuration
├── contexts/
│   ├── AuthContext.tsx      # Authentication state management
│   └── ProfileContext.tsx   # Profile state management
├── pages/
│   ├── SignUp.tsx           # User registration page
│   ├── SignIn.tsx           # User sign in page
│   ├── AuthCallback.tsx     # Email verification callback
│   └── CreateProfile.tsx    # Profile creation page
└── components/
    └── Header.tsx           # Dynamic header with auth state
```

## Troubleshooting

### Common Issues:

1. **Email verification not working:**
   - Check Supabase email settings
   - Verify redirect URLs are correct
   - Check spam folder

2. **Profile creation fails:**
   - Ensure RLS policies are set up correctly
   - Check database table exists
   - Verify user is authenticated

3. **File upload fails:**
   - Check storage bucket exists
   - Verify storage policies
   - Check file size limits

4. **Authentication state not persisting:**
   - Check Supabase session management
   - Verify AuthContext is properly configured

## Next Steps

After setting up authentication, you can:

1. Add password reset functionality
2. Implement social authentication (Google, GitHub)
3. Add user roles and permissions
4. Create protected routes for authenticated users
5. Add profile completion tracking
6. Implement user search and discovery features

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify Supabase dashboard settings
3. Check the network tab for failed requests
4. Ensure all dependencies are installed correctly




















