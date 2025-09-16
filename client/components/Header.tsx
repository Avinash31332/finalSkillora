import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { isAuthenticated, signOut, isEmailVerified } = useAuth();
  const { profile, hasProfile } = useProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleProfileClick = () => {
    if (hasProfile) {
      navigate("/profile");
    } else {
      navigate("/create-profile");
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <a href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ST</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">SkillTrade</span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="/skills" className="text-gray-600 hover:text-gray-900 transition-colors">Skills</a>
              <a href="/trades" className="text-gray-600 hover:text-gray-900 transition-colors">Trades</a>
              <a href="/resume" className="text-gray-600 hover:text-gray-900 transition-colors">Resume</a>
              {isAuthenticated && (
                <a href="/feed" className="text-gray-600 hover:text-gray-900 transition-colors">Feed</a>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search skills, people, or opportunities..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Desktop Auth */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                hasProfile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={profile?.profile_picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                            alt={profile?.name || "User"}
                          />
                          <AvatarFallback>
                            {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium">{profile?.name || "User"}</p>
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {profile?.email || "user@example.com"}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleProfileClick}>
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/settings")}>
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    onClick={() => navigate("/create-profile")}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Create Profile
                  </Button>
                )
              ) : (
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate("/signin")}
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => navigate("/signup")}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {/* Mobile Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Mobile Navigation Links */}
            <div className="space-y-2 mb-4">
              <a 
                href="/skills" 
                className="block px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Skills
              </a>
              <a 
                href="/trades" 
                className="block px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Trades
              </a>
              <a 
                href="/resume" 
                className="block px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Resume
              </a>
              {isAuthenticated && (
                <a 
                  href="/feed" 
                  className="block px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Feed
                </a>
              )}
            </div>

            {/* Mobile Auth */}
            <div className="border-t border-gray-200 pt-4">
              {isAuthenticated ? (
                profile ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={profile.profilePicture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                          alt={profile.name || "User"}
                        />
                        <AvatarFallback>
                          {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile.name || "User"}</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.email || "user@example.com"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          window.location.href = "/profile";
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Profile
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          window.location.href = "/settings";
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Settings
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Log out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => {
                      window.location.href = "/create-profile";
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    Create Profile
                  </Button>
                )
              ) : (
                <Button 
                  onClick={() => {
                    window.location.href = "/create-profile";
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
