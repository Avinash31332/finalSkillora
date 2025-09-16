import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { PostsProvider } from "./contexts/PostsContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Index from "./pages/Index";
import Skills from "./pages/Skills";
import Trades from "./pages/Trades";
import About from "./pages/About";
import ResumePage from "./pages/Resume";
import EditResumePage from "./pages/EditResume";
import CreateProfile from "./pages/CreateProfile";
import SocialFeed from "./pages/SocialFeed";
import CreatePost from "./pages/CreatePost";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProfileProvider>
        <PostsProvider>
          <NotificationProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/skills" element={<Skills />} />
                <Route path="/trades" element={<Trades />} />
                {/* About removed from header; route kept if directly visited */}
                <Route path="/about" element={<About />} />
                <Route path="/resume" element={<ResumePage />} />
                <Route path="/resume/edit" element={<EditResumePage />} />
                <Route path="/create-profile" element={<CreateProfile />} />
                <Route path="/feed" element={<SocialFeed />} />
                <Route path="/create-post" element={<CreatePost />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/settings" element={<Settings />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </PostsProvider>
      </ProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// Standard React 18 root creation
const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<App />);
