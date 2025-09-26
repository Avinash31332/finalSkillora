import React, { useState, useEffect } from "react";
import { Download, Loader2, CheckCircle, XCircle } from "lucide-react";

const MovellaHero = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [timer, setTimer] = useState(0);

  const API_BASE_URL = "http://3.107.225.46:8000";

  // Timer for generation
  useEffect(() => {
    let interval;
    if (isGenerating) {
      setTimer(0);
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Generate video
  const handleGenerate = async () => {
    if (!prompt.trim()) return alert("Please enter a prompt!");
    setIsGenerating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/generateVideo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Generation failed");
      alert("Video generation started successfully!");
    } catch (error) {
      console.error(error);
      alert("Error generating video.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Download latest video
  const downloadLatestVideo = async () => {
    setIsDownloading(true);
    setDownloadStatus("Downloading latest video...");

    try {
      const response = await fetch(`${API_BASE_URL}/downloadVideo`, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Download failed");

      const contentDisposition = response.headers.get("content-disposition");
      let filename = "generated_video.mp4";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadStatus("Download completed successfully!");
      setTimeout(() => setDownloadStatus(""), 3000);
    } catch (error) {
      console.error("Download error:", error);
      setDownloadStatus(`Download failed: ${error.message}`);
      setTimeout(() => setDownloadStatus(""), 5000);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen px-6 py-16 md:py-24 flex flex-col items-center 
      bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white overflow-hidden"
    >
      {/* Animated gradient background overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#22c55e,_transparent_60%),radial-gradient(circle_at_bottom_right,_#6366f1,_transparent_60%)] opacity-30 animate-pulse"></div>

      {/* Full-page loading overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-[1000] text-white">
          <Loader2 className="w-14 h-14 animate-spin mb-4 text-green-400" />
          <p className="text-2xl font-semibold mb-2">
            Generating your video...
          </p>
          <p className="text-sm text-gray-300">Time elapsed: {timer}s</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative z-10 text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
          Movella
        </h1>
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-6 text-gray-200">
          Your Story, Reimagined for the Screen
        </h2>
        <p className="max-w-2xl mx-auto text-lg text-gray-400">
          Movella is an AI-powered platform that transforms your book into a
          production-ready movie script, complete with character breakdowns,
          scene visualizations, and dialogue generation.
        </p>
      </div>

      {/* Prompt Input */}
      <div className="relative z-10 max-w-xl mx-auto mb-12 w-full bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your story prompt..."
          className="w-full px-4 py-3 rounded-lg bg-black/40 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:outline-none mb-4"
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full px-8 py-3 text-lg font-medium rounded-full transition-all 
            bg-gradient-to-r from-green-500 to-blue-600 
            hover:from-green-600 hover:to-blue-700 
            disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-green-500/30"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Generating...
            </>
          ) : (
            "Start Generating"
          )}
        </button>
      </div>

      {/* Download Section */}
      <div className="relative z-10 max-w-2xl w-full p-8 bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/10">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Download Your Video
        </h2>

        <div className="mb-8 p-5 bg-black/40 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">
            Download Latest Video
          </h3>
          <button
            onClick={downloadLatestVideo}
            disabled={isDownloading}
            className="w-full px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 
              bg-gradient-to-r from-purple-500 to-pink-600 
              hover:from-purple-600 hover:to-pink-700 
              text-white shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Downloading...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" /> Download Latest Video
              </>
            )}
          </button>
        </div>

        {downloadStatus && (
          <div
            className={`p-4 rounded-lg flex items-center gap-2 transition-all ${
              downloadStatus.includes("failed") ||
              downloadStatus.includes("error")
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : downloadStatus.includes("completed")
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            }`}
          >
            {downloadStatus.includes("failed") ||
            downloadStatus.includes("error") ? (
              <XCircle className="w-5 h-5" />
            ) : downloadStatus.includes("completed") ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            <span className="font-medium">{downloadStatus}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovellaHero;
