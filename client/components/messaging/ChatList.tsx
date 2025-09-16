import React from "react";
import { cn } from "@/lib/utils";
import { ConversationPreview } from "@/lib/messaging.service";

type Props = {
  items: ConversationPreview[];
  currentUserId: string;
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
};

export const ChatList: React.FC<Props> = ({ items, currentUserId, selectedUserId, onSelect }) => {
  return (
    <div className="flex-1 overflow-y-auto">
      {items.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No conversations yet</div>
      ) : (
        items.map((c) => (
          <div
            key={c.user_id}
            onClick={() => onSelect(c.user_id)}
            className={cn(
              "flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50",
              selectedUserId === c.user_id && "bg-gray-50"
            )}
          >
            <img
              src={c.profile?.profile_picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
              alt={c.profile?.name || "User"}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={cn("text-sm font-medium truncate", c.unread_count > 0 ? "text-gray-900" : "text-gray-700")}>{c.profile?.name || "User"}</p>
                {c.last_message && (
                  <span className="text-xs text-gray-500">{new Date(c.last_message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                )}
              </div>
              <p className={cn("text-xs truncate", c.unread_count > 0 ? "font-semibold text-gray-900" : "text-gray-500")}>{c.last_message?.content || "Start chatting"}</p>
            </div>
            {c.unread_count > 0 && (
              <span className="ml-2 text-xs bg-red-500 text-white rounded-full px-2 py-0.5">{c.unread_count > 9 ? "9+" : c.unread_count}</span>
            )}
          </div>
        ))
      )}
    </div>
  );
};


