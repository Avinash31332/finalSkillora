import { motion } from "framer-motion";
import { useState, useRef } from "react";

export default function VideoShowcase() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const videoVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-20 lg:py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse"></div>
      </div>

      <motion.div
        className="container mx-auto px-6 relative z-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div className="space-y-8" variants={itemVariants}>
            <motion.div 
              className="flex items-center space-x-2 text-sm"
              variants={itemVariants}
            >
              <span className="text-primary animate-pulse">⚡</span>
              <span className="text-gray-300 font-semibold tracking-wider uppercase">
                Experience WorkTrade
              </span>
            </motion.div>

            <motion.div className="space-y-6" variants={itemVariants}>
              <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                Watch the{" "}
                <span className="bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
                  Future
                </span>{" "}
                <span className="block">of Collaboration</span>
              </h2>

              <p className="text-xl text-gray-300 max-w-lg leading-relaxed">
                See how our platform transforms the way professionals connect, 
                collaborate, and trade skills. This is not just skill exchange - 
                this is the evolution of professional networking.
              </p>
            </motion.div>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              variants={itemVariants}
            >
              <motion.button
                onClick={handlePlayPause}
                className="group bg-primary hover:bg-primary/90 text-black px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg shadow-primary/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {isPlaying ? "⏸️" : "▶️"}
                </span>
                <span>{isPlaying ? "Pause Video" : "Watch Demo"}</span>
              </motion.button>
              
              <motion.button
                className="border-2 border-gray-600 hover:border-primary text-gray-300 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More →
              </motion.button>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div 
              className="grid grid-cols-2 gap-6 pt-8"
              variants={itemVariants}
            >
              <div className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="text-2xl font-bold text-primary mb-1">Real-time</div>
                <div className="text-gray-400 text-sm">Collaboration</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="text-2xl font-bold text-primary mb-1">AI-Powered</div>
                <div className="text-gray-400 text-sm">Matching</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Video */}
          <motion.div 
            className="relative"
            variants={videoVariants}
          >
            <div className="relative group">
              {/* Video Container with Glow Effect */}
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 shadow-2xl shadow-primary/20 border border-gray-700">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-green-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 group-hover:opacity-75"></div>
                
                <div className="relative bg-black rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-auto rounded-xl"
                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23111827'/%3E%3Ctext x='400' y='300' text-anchor='middle' fill='%2322c55e' font-size='24' font-family='system-ui'%3ECollaborative Animation Generation%3C/text%3E%3C/svg%3E"
                    controls
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    <source 
                      src="https://cdn.builder.io/o/assets%2F53e4fd32dd724f51a2e513f718e61215%2F36d2d06960074999aa6c1d75686fd1a5?alt=media&token=ed6ec426-e811-4392-8730-4b358233ff10&apiKey=53e4fd32dd724f51a2e513f718e61215" 
                      type="video/mp4" 
                    />
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Play Overlay */}
                  {!isPlaying && (
                    <motion.div
                      className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                      onClick={handlePlayPause}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: isPlaying ? 0 : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/50 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-3xl text-black ml-1">▶️</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                className="absolute -top-4 -left-4 w-8 h-8 bg-primary rounded-full shadow-lg shadow-primary/50"
                animate={{
                  y: [0, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute -bottom-4 -right-4 w-6 h-6 bg-green-400 rounded-full shadow-lg shadow-green-400/50"
                animate={{
                  y: [0, 10, 0],
                  scale: [1, 0.9, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
