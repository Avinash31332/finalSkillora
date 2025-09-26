import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ChatList } from "@/components/messaging/ChatList";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { InputBox } from "@/components/messaging/InputBox";
import { ConversationPreview, MessageRow, ProfileRow, fetchConversations, fetchMessages, sendMessage, subscribeToIncoming } from "@/lib/messaging.service";
import { supabase } from "@/lib/supabase";

const Messages: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const currentUserId = user?.id || "";

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [otherProfile, setOtherProfile] = useState<ProfileRow | null>(null);

  // Demo data for showcasing the chat system
  const demoConversations: ConversationPreview[] = [
    {
      user_id: "demo-user-1",
      profile: {
        id: "demo-profile-1",
        user_id: "demo-user-1",
        name: "Sarah Chen",
        profile_picture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces"
      },
      last_message: {
        id: "demo-msg-1",
        sender_id: "demo-user-1",
        receiver_id: currentUserId,
        content: "Hey! I saw your React skills on your profile. Would you be interested in collaborating on a project?",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      unread_count: 2
    },
    {
      user_id: "demo-user-2",
      profile: {
        id: "demo-profile-2",
        user_id: "demo-user-2",
        name: "Alex Rodriguez",
        profile_picture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces"
      },
      last_message: {
        id: "demo-msg-2",
        sender_id: currentUserId,
        receiver_id: "demo-user-2",
        content: "Thanks for the opportunity! I'll send you my portfolio link.",
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
      },
      unread_count: 0
    },
    {
      user_id: "demo-user-3",
      profile: {
        id: "demo-profile-3",
        user_id: "demo-user-3",
        name: "Emma Wilson",
        profile_picture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces"
      },
      last_message: {
        id: "demo-msg-3",
        sender_id: "demo-user-3",
        receiver_id: currentUserId,
        content: "The design mockups look amazing! When can we schedule a call to discuss the next steps?",
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      unread_count: 1
    },
    {
      user_id: "demo-user-4",
      profile: {
        id: "demo-profile-4",
        user_id: "demo-user-4",
        name: "Michael Park",
        profile_picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces"
      },
      last_message: {
        id: "demo-msg-4",
        sender_id: currentUserId,
        receiver_id: "demo-user-4",
        content: "Perfect! I'll have the backend API ready by Friday.",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      unread_count: 0
    }
  ];

  const demoMessages: { [userId: string]: MessageRow[] } = {
    "demo-user-1": [
      {
        id: "demo-msg-1-1",
        sender_id: "demo-user-1",
        receiver_id: currentUserId,
        content: "Hi! I came across your profile and I'm really impressed with your React and TypeScript skills.",
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "demo-msg-1-2",
        sender_id: currentUserId,
        receiver_id: "demo-user-1",
        content: "Thank you! I'd love to hear more about your project.",
        created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "demo-msg-1-3",
        sender_id: "demo-user-1",
        receiver_id: currentUserId,
        content: "We're building a skill trading platform similar to this one, but focused on creative professionals. Would you be interested in joining as a frontend developer?",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "demo-msg-1-4",
        sender_id: "demo-user-1",
        receiver_id: currentUserId,
        content: "The project timeline is 3 months and we're offering competitive rates. Let me know if you'd like to see the full project brief!",
        created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
      }
    ],
    "demo-user-2": [
      {
        id: "demo-msg-2-1",
        sender_id: "demo-user-2",
        receiver_id: currentUserId,
        content: "Hey! I saw your post about looking for a UI/UX designer. I have 5+ years of experience with Figma and Adobe Creative Suite.",
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "demo-msg-2-2",
        sender_id: currentUserId,
        receiver_id: "demo-user-2",
        content: "That sounds perfect! Do you have a portfolio I can check out?",
        created_at: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "demo-msg-2-3",
        sender_id: "demo-user-2",
        receiver_id: currentUserId,
        content: "Absolutely! Here's my portfolio: alexrodriguez.design. I specialize in mobile app design and have worked with several startups.",
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "demo-msg-2-4",
        sender_id: currentUserId,
        receiver_id: "demo-user-2",
        content: "Thanks for the opportunity! I'll send you my portfolio link.",
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      }
    ],
    "demo-user-3": [
      {
        id: "demo-msg-3-1",
        sender_id: "demo-user-3",
        receiver_id: currentUserId,
        content: "Hi! I'm looking for a developer to help with my e-commerce website. I saw your skills in JavaScript and React.",
        created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "demo-msg-3-2",
        sender_id: currentUserId,
        receiver_id: "demo-user-3",
        content: "I'd be happy to help! What kind of features are you looking to implement?",
        created_at: new Date(Date.now() - 24.5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "demo-msg-3-3",
        sender_id: "demo-user-3",
        receiver_id: currentUserId,
        content: "I need a shopping cart, payment integration, and user authentication. The design mockups look amazing! When can we schedule a call to discuss the next steps?",
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    "demo-user-4": [
      {
        id: "demo-msg-4-1",
        sender_id: "demo-user-4",
        receiver_id: currentUserId,
        content: "Hey! I'm working on a mobile app and need a backend developer. Your Node.js skills caught my attention.",
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "demo-msg-4-2",
        sender_id: currentUserId,
        receiver_id: "demo-user-4",
        content: "Sounds interesting! What's the tech stack you're planning to use?",
        created_at: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "demo-msg-4-3",
        sender_id: "demo-user-4",
        receiver_id: currentUserId,
        content: "We're using Express.js with MongoDB. The app is for food delivery with real-time tracking.",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "demo-msg-4-4",
        sender_id: currentUserId,
        receiver_id: "demo-user-4",
        content: "Perfect! I'll have the backend API ready by Friday.",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  };

  useEffect(() => {
    if (!currentUserId) return;
    setLoading(true);
    
    // For demo purposes, combine real conversations with demo data
    fetchConversations(currentUserId).then((list) => {
      // Combine real conversations with demo conversations
      const combinedConversations = [...list, ...demoConversations];
      setConversations(combinedConversations);
      setLoading(false);
      const openWith: string | undefined = location?.state?.openWithUserId;
      if (openWith) {
        setSelectedUserId(openWith);
      }
    });
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const unsub = subscribeToIncoming(currentUserId, (m) => {
      // Optimistically append if in selected conversation
      if (selectedUserId && (m.sender_id === selectedUserId || m.receiver_id === selectedUserId)) {
        setMessages((prev) => [...prev, m]);
      }
      // Update list previews (refetch light)
      fetchConversations(currentUserId).then(setConversations);
    });
    return unsub;
  }, [currentUserId, selectedUserId]);

  useEffect(() => {
    if (!currentUserId || !selectedUserId) return;
    
    // Check if it's a demo user
    if (selectedUserId.startsWith("demo-user-")) {
      setMessages(demoMessages[selectedUserId] || []);
      const profile = conversations.find((c) => c.user_id === selectedUserId)?.profile || null;
      setOtherProfile(profile);
    } else {
      // Real user - fetch from database
      fetchMessages(currentUserId, selectedUserId).then(setMessages);
      const profile = conversations.find((c) => c.user_id === selectedUserId)?.profile || null;
      setOtherProfile(profile);
      if (!profile) {
        // fetch profile if not in conversations yet (new chat)
        supabase
          .from("profiles")
          .select("id,user_id,name,profile_picture")
          .eq("user_id", selectedUserId)
          .single()
          .then(({ data }) => {
            if (data) setOtherProfile(data as ProfileRow);
          });
      }
    }
    
    // Clear unread badge locally for opened conversation
    setConversations((prev) => prev.map((c) => (c.user_id === selectedUserId ? { ...c, unread_count: 0 } : c)));
  }, [currentUserId, selectedUserId, conversations]);

  if (!currentUserId) {
    navigate("/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto h-[calc(100vh-2rem)] mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border overflow-hidden flex flex-col">
          <div className="p-4 border-b text-sm font-semibold">Conversations</div>
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : (
            <ChatList
              items={conversations}
              currentUserId={currentUserId}
              selectedUserId={selectedUserId}
              onSelect={(uid) => setSelectedUserId(uid)}
            />
          )}
        </div>

        <div className="bg-white rounded-xl border overflow-hidden md:col-span-2 flex flex-col">
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Select a conversation</div>
          ) : (
            <>
              <ChatWindow currentUserId={currentUserId} otherProfile={otherProfile} messages={messages} />
              <InputBox
                onSend={async (text) => {
                  const temp: MessageRow = {
                    id: `temp-${Date.now()}`,
                    sender_id: currentUserId,
                    receiver_id: selectedUserId,
                    content: text,
                    created_at: new Date().toISOString(),
                  };
                  setMessages((prev) => [...prev, temp]);
                  try {
                    const saved = await sendMessage(currentUserId, selectedUserId, text);
                    setMessages((prev) => prev.map((m) => (m.id === temp.id ? saved : m)));
                    // ensure the conversation preview appears/updates
                    fetchConversations(currentUserId).then(setConversations);
                  } catch (e) {
                    // rollback optimistic
                    setMessages((prev) => prev.filter((m) => m.id !== temp.id));
                    // optional: surface error
                    console.error("Failed to send message", e);
                    alert("Failed to send message. Please ensure you are signed in and have permissions.");
                  }
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;


