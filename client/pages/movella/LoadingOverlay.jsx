import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const LoadingOverlay = ({
  isVisible,
  message = "Generating your video...",
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval;
    if (isVisible) {
      setSeconds(0); // reset timer
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-[1000] text-white">
      <Loader2 className="w-12 h-12 animate-spin mb-6 text-green-400" />
      <p className="text-xl font-semibold mb-2">{message}</p>
      <p className="text-sm text-gray-300">Time elapsed: {seconds}s</p>
    </div>
  );
};

export default LoadingOverlay;
