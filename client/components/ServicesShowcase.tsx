import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const services = [
  {
    id: 1,
    title: "Skill Exchange Optimization",
    description:
      "Climb to the top of skill rankings and attract more trading opportunities with our proven skill matching strategies.",
    highlighted: false,
    hoverType: "green",
  },
  {
    id: 2,
    title: "Project-Based Trading",
    description:
      "Maximize your project success with targeted skill exchanges that deliver high-quality results and collaborations",
    highlighted: true,
    hoverType: "white",
  },
  {
    id: 3,
    title: "Skill Network Marketing",
    description:
      "Engage your audience and grow your skill presence on platforms like LinkedIn, GitHub, and Behance with our skill networking strategies",
    highlighted: false,
    hoverType: "green",
  },
  {
    id: 4,
    title: "Mentorship Trading",
    description:
      "Exchange knowledge and expertise through structured mentorship programs that benefit both mentors and mentees",
    highlighted: false,
    hoverType: "white",
  },
  {
    id: 5,
    title: "Creative Skills Exchange",
    description:
      "Trade design, writing, and creative services with other talented professionals to complete your projects",
    highlighted: false,
    hoverType: "green",
  },
  {
    id: 6,
    title: "Technical Skills Bartering",
    description:
      "Exchange programming, development, and technical expertise within our skilled community network",
    highlighted: false,
    hoverType: "white",
  },
];

const ServicesShowcase: React.FC = () => {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cardIndex = parseInt(
            entry.target.getAttribute("data-index") || "0",
          );
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set([...prev, cardIndex]));
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "-50px",
      },
    );

    // Observe title
    if (titleRef.current) {
      observer.observe(titleRef.current);
    }

    // Observe all service cards
    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-black text-white py-16 lg:py-24 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div
            ref={titleRef}
            data-index="-1"
            className={cn(
              "space-y-8 transition-all duration-1000 ease-out",
              visibleCards.has(-1)
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-12",
            )}
          >
            <div className="mb-4">
              <span className="text-green-400 text-sm font-semibold tracking-wider animate-pulse">
                ⚡ EXPERT SERVICES
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
              Tailored Services for Your
              <br />
              <span className="text-green-400 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent animate-pulse">
                Skill Growth
              </span>
            </h2>
            <div className="flex items-center mt-8 transform hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-4 shadow-lg shadow-green-400/20">
                <span className="text-black font-bold text-lg">ST</span>
              </div>
              <div>
                <div className="text-white font-semibold">SkillTrade</div>
                <div className="text-gray-400 text-sm">
                  Skill Exchange Platform
                </div>
              </div>
            </div>
          </div>

          {/* Right Services Grid */}
          <div className="space-y-4">
            {services.map((service, index) => (
              <div
                key={service.id}
                ref={(el) => (cardRefs.current[index] = el)}
                data-index={index}
                className={cn(
                  "group border-2 rounded-lg p-6 transition-all duration-700 ease-out cursor-pointer relative overflow-hidden",
                  // Base styles with stylish white borders
                  service.highlighted
                    ? "border-white bg-gray-900/50 shadow-lg shadow-white/10"
                    : "border-white/60 bg-gray-900/30 shadow-md shadow-white/5",
                  // Hover styles alternating between white and green
                  service.hoverType === "green"
                    ? "hover:border-green-400 hover:shadow-xl hover:shadow-green-400/30 hover:bg-gray-900/60 hover:scale-105"
                    : "hover:border-white hover:shadow-xl hover:shadow-white/30 hover:bg-gray-900/60 hover:scale-105",
                  // Animation based on visibility
                  visibleCards.has(index)
                    ? "opacity-100 translate-x-0 scale-100"
                    : "opacity-0 translate-x-8 scale-95",
                  // Staggered delay
                  `delay-[${index * 100}ms]`,
                )}
                style={{
                  transitionDelay: visibleCards.has(index)
                    ? `${index * 150}ms`
                    : "0ms",
                }}
              >
                {/* Animated background glow */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    service.hoverType === "green"
                      ? "bg-gradient-to-r from-green-400/5 to-green-600/5"
                      : "bg-gradient-to-r from-white/5 to-gray-300/5",
                  )}
                />

                {/* Content */}
                <div className="relative z-10 flex items-start space-x-4">
                  <div
                    className={cn(
                      "text-xl transition-all duration-300 group-hover:scale-110",
                      service.hoverType === "green"
                        ? "group-hover:text-green-400"
                        : "group-hover:text-white",
                    )}
                  >
                    ⚙️
                  </div>
                  <div className="flex-1">
                    <h3
                      className={cn(
                        "font-semibold text-lg mb-2 transition-colors duration-300",
                        service.hoverType === "green"
                          ? "text-white group-hover:text-green-400"
                          : "text-white group-hover:text-white",
                      )}
                    >
                      {service.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                      {service.description}
                    </p>
                  </div>
                </div>

                {/* Animated border effect with stylish glow */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-lg border-2 border-transparent opacity-0 group-hover:opacity-100 transition-all duration-500",
                    service.hoverType === "green"
                      ? "border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                      : "border-white/70 shadow-[0_0_20px_rgba(255,255,255,0.2)]",
                  )}
                />

                {/* Inner stylish border glow */}
                <div className="absolute inset-[1px] rounded-lg border border-white/20 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesShowcase;
