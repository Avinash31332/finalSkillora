import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    messages: true,
    trades: true
  });

  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    showEmail: false,
    showLocation: true
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and privacy settings</p>
        </div>

        <div className="grid gap-6">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your.email@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Tell others about yourself..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <Switch 
                  id="email-notifications"
                  checked={notifications.email}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, email: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                </div>
                <Switch 
                  id="push-notifications"
                  checked={notifications.push}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, push: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="message-notifications">New Messages</Label>
                  <p className="text-sm text-gray-500">Get notified of new messages</p>
                </div>
                <Switch 
                  id="message-notifications"
                  checked={notifications.messages}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, messages: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="trade-notifications">Trade Requests</Label>
                  <p className="text-sm text-gray-500">Get notified of skill trade requests</p>
                </div>
                <Switch 
                  id="trade-notifications"
                  checked={notifications.trades}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, trades: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profile-public">Public Profile</Label>
                  <p className="text-sm text-gray-500">Make your profile visible to all users</p>
                </div>
                <Switch 
                  id="profile-public"
                  checked={privacy.profilePublic}
                  onCheckedChange={(checked) => 
                    setPrivacy(prev => ({ ...prev, profilePublic: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-email">Show Email</Label>
                  <p className="text-sm text-gray-500">Display email address on your profile</p>
                </div>
                <Switch 
                  id="show-email"
                  checked={privacy.showEmail}
                  onCheckedChange={(checked) => 
                    setPrivacy(prev => ({ ...prev, showEmail: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-location">Show Location</Label>
                  <p className="text-sm text-gray-500">Display your location on your profile</p>
                </div>
                <Switch 
                  id="show-location"
                  checked={privacy.showLocation}
                  onCheckedChange={(checked) => 
                    setPrivacy(prev => ({ ...prev, showLocation: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input 
                  id="current-password" 
                  type="password" 
                  placeholder="Enter current password"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  placeholder="Enter new password"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  placeholder="Confirm new password"
                  className="mt-1"
                />
              </div>
              <Button variant="outline" className="w-full md:w-auto">
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Save Changes */}
          <div className="flex gap-4">
            <Button className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
            <Button variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
