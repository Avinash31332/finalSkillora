import React from "react";
import { cn } from "@/lib/utils";
import { ConversationPreview } from "@/lib/messaging.service";
import { MessageCircle, Clock, Check, CheckCheck } from "lucide-react";

type Props = {
  items: ConversationPreview[];
  currentUserId: string;
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
};

export const ChatList: React.FC<Props> = ({ items, currentUserId, selectedUserId, onSelect }) => {
  const formatTime = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 168) { // 7 days
      return messageDate.toLocaleDateString([], { weekday: "short" });
    } else {
      return messageDate.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {items.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No conversations yet</p>
          <p className="text-xs text-gray-400 mt-1">Start a conversation from someone's profile</p>
        </div>
      ) : (
        items.map((c) => (
          <div
            key={c.user_id}
            onClick={() => onSelect(c.user_id)}
            className={cn(
              "flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-2",
              selectedUserId === c.user_id 
                ? "bg-indigo-50 border-indigo-500" 
                : "border-transparent hover:border-gray-200"
            )}
          >
            <div className="relative">
              <img
                src={c.profile?.profile_picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                alt={c.profile?.name || "User"}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
              />
              {/* Online indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className={cn(
                  "text-sm font-semibold truncate", 
                  c.unread_count > 0 ? "text-gray-900" : "text-gray-700"
                )}>
                  {c.profile?.name || "User"}
                </p>
                <div className="flex items-center gap-1">
                  {c.last_message && (
                    <span className="text-xs text-gray-500">{formatTime(c.last_message.created_at)}</span>
                  )}
                  {c.unread_count > 0 && (
                    <span className="text-xs bg-indigo-500 text-white rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {c.unread_count > 9 ? "9+" : c.unread_count}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className={cn(
                  "text-xs truncate flex-1", 
                  c.unread_count > 0 ? "font-semibold text-gray-900" : "text-gray-500"
                )}>
                  {c.last_message?.content || "Start chatting"}
                </p>
                {c.last_message && c.last_message.sender_id === currentUserId && (
                  <div className="flex-shrink-0">
                    {c.unread_count > 0 ? (
                      <Check className="w-3 h-3 text-gray-400" />
                    ) : (
                      <CheckCheck className="w-3 h-3 text-indigo-500" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};


