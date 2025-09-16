import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  userId: string;
  userName?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
};

export const MessageButton: React.FC<Props> = ({ userId, userName, className, variant = "outline" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isInvalidTarget = !userId || userId === "current-user";

  return (
    <Button
      onClick={() => {
        if (!user) {
          navigate("/signin");
          return;
        }
        if (isInvalidTarget || userId === user.id) return;
        navigate("/messages", { state: { openWithUserId: userId } });
      }}
      variant={variant}
      className={cn("text-sm", className)}
      disabled={isInvalidTarget || (!!user && userId === user.id)}
      title={userName ? `Message ${userName}` : "Message"}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Message
    </Button>
  );
};


