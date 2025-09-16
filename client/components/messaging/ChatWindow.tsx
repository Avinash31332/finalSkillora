import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MessageRow, ProfileRow } from "@/lib/messaging.service";

type Props = {
  currentUserId: string;
  otherProfile: ProfileRow | null;
  messages: MessageRow[];
};

export const ChatWindow: React.FC<Props> = ({ currentUserId, otherProfile, messages }) => {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b">
        <img
          src={otherProfile?.profile_picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
          alt={otherProfile?.name || "User"}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-semibold">{otherProfile?.name || "User"}</p>
          <p className="text-xs text-gray-500">Active now</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          const own = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={cn("flex", own ? "justify-end" : "justify-start")}> 
              <div className={cn("max-w-xs lg:max-w-md px-3 py-2 rounded-2xl", own ? "bg-green-600 text-white" : "bg-gray-100 text-gray-900")}> 
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                <div className={cn("text-[10px] mt-1 text-right", own ? "text-green-100" : "text-gray-500")}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
};


