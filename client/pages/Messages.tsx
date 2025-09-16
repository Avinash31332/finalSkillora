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

  useEffect(() => {
    if (!currentUserId) return;
    setLoading(true);
    fetchConversations(currentUserId).then((list) => {
      setConversations(list);
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
    // Clear unread badge locally for opened conversation
    setConversations((prev) => prev.map((c) => (c.user_id === selectedUserId ? { ...c, unread_count: 0 } : c)));
  }, [currentUserId, selectedUserId]);

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


