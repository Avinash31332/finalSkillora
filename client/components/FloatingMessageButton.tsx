import React from "react";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const FloatingMessageButton: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (isAuth === "true") {
      navigate("/messages");
    } else {
      navigate("/create-profile");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
      title="Open Messages"
    >
      <MessageCircle className="w-6 h-6" />
      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        2
      </div>
    </button>
  );
};
