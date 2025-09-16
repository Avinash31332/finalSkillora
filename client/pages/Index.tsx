import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import ServicesShowcase from "@/components/ServicesShowcase";
import FAQSection from "@/components/FAQSection";
import { motion } from "framer-motion";
import {
  useScrollAnimation,
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  staggerContainer,
} from "@/hooks/use-scroll-animation";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const { isAuthenticated, isEmailVerified } = useAuth();
  const { hasProfile } = useProfile();
  const navigate = useNavigate();

  const handleGetStartedClick = () => {
    if (!isAuthenticated) {
      navigate("/signup");
    } else if (!isEmailVerified) {
      // Show message about email verification
      alert("Please verify your email before creating a profile.");
    } else if (!hasProfile) {
      navigate("/create-profile");
    } else {
      navigate("/feed");
    }
  };

  const handleMessagesClick = () => {
    if (!isAuthenticated) {
      navigate("/signup");
    } else if (!isEmailVerified) {
      alert("Please verify your email before accessing messages.");
    } else if (!hasProfile) {
      navigate("/create-profile");
    } else {
      navigate("/messages");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 lg:py-24">
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Left Content */}
          <motion.div className="space-y-8" variants={fadeInLeft}>
            {/* Success Metric */}
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-primary">✓</span>
              <span className="text-gray-600">
                Join 20,000+ Happy Skills Traders
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
                Transform your{" "}
                <span className="block">digital presence to</span>
                <span className="block">grow your business</span>
              </h1>

              <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                Unlock growth and collaboration with our skill trading platform.
                From seamless skill exchange to cutting-edge collaboration
                tools, we help your talents thrive in a cooperative world. Let's
                build the future together.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleGetStartedClick}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-base"
              >
                {!isAuthenticated ? "Get Started →" : !hasProfile ? "Create Profile →" : "Let's Trade →"}
              </Button>
              <Button
                onClick={handleMessagesClick}
                variant="outline"
                className="border-gray-200 text-gray-700 px-8 py-3 text-base"
              >
                💬 Messages →
              </Button>
            </div>
          </motion.div>

          {/* Right Illustration */}
          <motion.div className="relative" variants={fadeInRight}>
            <div className="flex items-center justify-center">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F5bdae9b2904d4e6f8e00b8c0f2e5670e%2Fc9d4ba38360a440b90b602f6915db14e?format=webp&width=800"
                alt="WorkTrade skill exchange illustration showing people collaborating and trading skills"
                className="w-full h-auto max-w-lg rounded-lg"
              />
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Stats Section */}
      <motion.section
        className="bg-black text-white py-16 lg:py-24"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-6">
          {/* Sliding Text Animation - At top of about us */}
          <div className="overflow-hidden whitespace-nowrap border-b border-gray-800 pb-8 mb-16">
            <div className="animate-slide-left inline-flex space-x-16 text-4xl lg:text-6xl font-bold opacity-30">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 drop-shadow-lg">
                SkillSwap
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 drop-shadow-lg">
                WorkTrade
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 drop-shadow-lg">
                CollabHub
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 drop-shadow-lg">
                TradeSkills
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 drop-shadow-lg">
                ExchangePro
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 drop-shadow-lg">
                SkillSwap
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 drop-shadow-lg">
                WorkTrade
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 drop-shadow-lg">
                CollabHub
              </span>
            </div>
          </div>

          <motion.div
            className="grid lg:grid-cols-2 gap-12 items-center"
            variants={staggerContainer}
          >
            {/* Left Video */}
            <motion.div className="relative" variants={fadeInLeft}>
              <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
                <video
                  className="w-full h-auto rounded-2xl"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source
                    src="https://cdn.builder.io/o/assets%2F53e4fd32dd724f51a2e513f718e61215%2F36d2d06960074999aa6c1d75686fd1a5?alt=media&token=ed6ec426-e811-4392-8730-4b358233ff10&apiKey=53e4fd32dd724f51a2e513f718e61215"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>

            {/* Right Content */}
            <motion.div className="space-y-6" variants={fadeInRight}>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-primary">✓</span>
                <span className="text-gray-300">ABOUT US</span>
              </div>

              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight">
                Innovation and Success in{" "}
                <span className="block">Digital Marketing</span>
              </h2>

              <p className="text-gray-300 text-lg leading-relaxed">
                Where innovation meets strategy. With 25 years of experience, we
                are a forward-thinking digital marketing agency dedicated to
                helping businesses like yours achieve exceptional growth and
                success in the digital landscape. Our team is passionate about
                delivering tailored marketing solutions that drive results,
                leveraging decades of industry expertise to stay ahead of the
                curve.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Join Community Section */}
      <motion.section
        className="bg-black text-white py-16 lg:py-24"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-6">
          <motion.div
            className="grid lg:grid-cols-2 gap-12 items-center"
            variants={staggerContainer}
          >
            {/* Left Content */}
            <motion.div className="space-y-8" variants={fadeInLeft}>
              {/* Success Metric */}
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-primary">✓</span>
                <span className="text-gray-300">
                  Join 20,000+ Active Skill Traders
                </span>
              </div>

              {/* Main Headline */}
              <div className="space-y-6">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                  Connect with professionals{" "}
                  <span className="block">and start trading skills</span>
                </h1>

                <p className="text-lg text-gray-300 max-w-lg leading-relaxed">
                  Join our thriving community where knowledge flows freely.
                  Share your expertise, learn new skills, and build meaningful
                  professional relationships that advance your career.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => {
                    const isAuth = localStorage.getItem("isAuthenticated");
                    if (isAuth === "true") {
                      window.location.href = "/feed";
                    } else {
                      window.location.href = "/create-profile";
                    }
                  }}
                  className="bg-primary hover:bg-primary/90 text-black px-8 py-3 text-base font-semibold"
                >
                  Join the Community →
                </Button>
                <Button
                  onClick={() => {
                    const isAuth = localStorage.getItem("isAuthenticated");
                    if (isAuth === "true") {
                      window.location.href = "/feed";
                    } else {
                      window.location.href = "/create-profile";
                    }
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-3 text-base"
                >
                  Browse Skills →
                </Button>
              </div>
            </motion.div>

            {/* Right Illustration */}
            <motion.div className="relative" variants={fadeInRight}>
              <div className="flex items-center justify-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F5bdae9b2904d4e6f8e00b8c0f2e5670e%2F2a09d0e9c02848efb3eac0ac53678054?format=webp&width=800"
                  alt="Professionals collaborating and sharing skills in a modern workspace"
                  className="w-full h-auto max-w-lg rounded-lg"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Services Showcase Section */}
      <ServicesShowcase />

      {/* AI Trade-Matching Section */}
      <motion.section
        className="bg-black text-white py-16 lg:py-24"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-6">
          <motion.div
            className="grid lg:grid-cols-2 gap-12 items-center"
            variants={staggerContainer}
          >
            {/* Left Image */}
            <motion.div className="relative" variants={fadeInLeft}>
              <div className="flex items-center justify-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F5bdae9b2904d4e6f8e00b8c0f2e5670e%2Fb7836dc880764791bff4469dbed7278b?format=webp&width=800"
                  alt="AI-powered skill matching connecting professionals for seamless collaboration"
                  className="w-full h-auto max-w-lg rounded-lg"
                />
              </div>
            </motion.div>

            {/* Right Content */}
            <motion.div className="space-y-8" variants={fadeInRight}>
              {/* Success Metric */}
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-primary">✓</span>
                <span className="text-gray-300">
                  AI-Powered Smart Matching Technology
                </span>
              </div>

              {/* Main Headline */}
              <div className="space-y-6">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                  Smart AI finds your perfect{" "}
                  <span className="block">trade partners instantly</span>
                </h1>

                <p className="text-lg text-gray-300 max-w-lg leading-relaxed">
                  Connect with professionals and start trading skills with our
                  AI-powered matching system. Our smart algorithm learns from
                  your preferences and instantly connects you with the right
                  people who are looking for your skills or offering exactly
                  what you need.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => {
                    const isAuth = localStorage.getItem("isAuthenticated");
                    if (isAuth === "true") {
                      window.location.href = "/feed";
                    } else {
                      window.location.href = "/create-profile";
                    }
                  }}
                  className="bg-primary hover:bg-primary/90 text-black px-8 py-3 text-base font-semibold"
                >
                  Try AI Matching →
                </Button>
                <Button
                  onClick={() => {
                    const isAuth = localStorage.getItem("isAuthenticated");
                    if (isAuth === "true") {
                      window.location.href = "/feed";
                    } else {
                      window.location.href = "/create-profile";
                    }
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-3 text-base"
                >
                  See How It Works →
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <footer className="bg-white text-gray-900 py-16 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ST</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">
                  SkillTrade
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Connect with professionals and start trading skills. Transform
                your expertise into opportunities.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Quick Links
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a
                    href="/skills"
                    className="hover:text-primary transition-colors"
                  >
                    Browse Skills
                  </a>
                </li>
                <li>
                  <a
                    href="/trades"
                    className="hover:text-primary transition-colors"
                  >
                    Active Trades
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    className="hover:text-primary transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="/feed"
                    className="hover:text-primary transition-colors"
                  >
                    Community
                  </a>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Services</h3>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    Skill Exchange
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    AI Matching
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    Project Trading
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    Mentorship
                  </span>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Email:</span>
                </div>
                <a
                  href="mailto:mohammedzama9024@gmail.com"
                  className="text-primary hover:text-primary/80 transition-colors text-sm break-all"
                >
                  mohammedzama9024@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-200 mt-12 pt-8">
            <div className="text-center space-y-2">
              <div className="text-gray-600 text-sm">
                © 2024 SkillTrade. All rights reserved.
              </div>
              <div className="text-gray-600 text-sm">Mohammed Shahzaman</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
