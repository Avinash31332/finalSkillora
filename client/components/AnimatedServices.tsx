import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const services: Service[] = [
  {
    id: 1,
    title: "Skill Exchange",
    description:
      "Trade your expertise for services you need. Connect with professionals across all industries and skill levels.",
    icon: "🔄",
  },
  {
    id: 2,
    title: "Project Collaboration",
    description:
      "Find team members for your projects by offering your skills in exchange for others' contributions.",
    icon: "🤝",
  },
  {
    id: 3,
    title: "Mentorship Trading",
    description:
      "Offer mentoring in your field while receiving guidance in areas where you want to grow.",
    icon: "🎓",
  },
  {
    id: 4,
    title: "Creative Services",
    description:
      "Exchange design, writing, development, and creative skills with other talented creators.",
    icon: "🎨",
  },
  {
    id: 5,
    title: "Professional Development",
    description:
      "Swap training sessions, workshops, and professional skills to advance your career.",
    icon: "📈",
  },
  {
    id: 6,
    title: "Technical Support",
    description:
      "Trade technical expertise, coding help, and IT services within our skilled community.",
    icon: "⚙️",
  },
];

const AnimatedServices: React.FC = () => {
  const [currentServices, setCurrentServices] = useState<
    Array<Service & { position: number; opacity: number; id: string }>
  >([]);

  useEffect(() => {
    let animationId: number;
    let startTime: number;
    const duration = 13000; // 13 seconds
    const serviceInterval = 2000; // New service every 2 seconds
    let serviceIndex = 0;
    let nextServiceTime = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Add new services at intervals
      while (elapsed >= nextServiceTime && serviceIndex < services.length * 3) {
        const service = services[serviceIndex % services.length];
        const newService = {
          ...service,
          id: `${service.id}-${serviceIndex}`,
          position: 100, // Start from right edge
          opacity: 1,
        };
        setCurrentServices((prev) => [...prev, newService]);
        serviceIndex++;
        nextServiceTime += serviceInterval;
      }

      // Update positions and opacity
      setCurrentServices((prev) =>
        prev
          .map((service) => {
            let newPosition = service.position - 100 / (duration / 16); // Move left
            let newOpacity = service.opacity;

            // Start fading when reaching middle (position 50)
            if (newPosition <= 50) {
              newOpacity = Math.max(0, newPosition / 50);
            }

            return {
              ...service,
              position: newPosition,
              opacity: newOpacity,
            };
          })
          .filter((service) => service.position > -20),
      ); // Remove services that have exited

      // Loop animation
      if (elapsed >= duration) {
        startTime = timestamp;
        serviceIndex = 0;
        nextServiceTime = 0;
        setCurrentServices([]);
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-l from-gray-900 via-gray-950 to-black">
      {/* Left side content */}
      <div className="absolute left-8 top-1/2 transform -translate-y-1/2 z-10">
        <div className="mb-4">
          <span className="text-green-400 text-sm font-semibold tracking-wider">
            ⚡ EXPERT SERVICES
          </span>
        </div>
        <h1 className="text-white text-5xl font-bold leading-tight">
          Tailored Services for Your
          <br />
          <span className="text-green-400">Skill Growth</span>
        </h1>
        <div className="mt-8 flex items-center">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-4">
            <span className="text-black font-bold text-lg">ST</span>
          </div>
          <div>
            <div className="text-white font-semibold">SkillTrade</div>
            <div className="text-gray-400 text-sm">Skill Exchange Platform</div>
          </div>
        </div>
      </div>

      {/* Animated services */}
      <div className="absolute inset-0">
        {currentServices.map((service) => (
          <div
            key={service.id}
            className="absolute top-1/2 transform -translate-y-1/2"
            style={{
              left: `${service.position}%`,
              opacity: service.opacity,
              filter: `blur(${(1 - service.opacity) * 2}px)`,
              transition: "filter 0.3s ease-out",
            }}
          >
            <div
              className={cn(
                "bg-gray-900/80 border border-gray-700 rounded-lg p-6 w-80 backdrop-blur-sm",
                service.opacity < 0.7 && "border-green-400/60",
              )}
            >
              <div className="flex items-start space-x-4">
                <div className="text-2xl">{service.icon}</div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "absolute inset-0 rounded-lg border-2 border-transparent",
                  service.opacity < 0.7 &&
                    "border-green-400/40 shadow-lg shadow-green-400/20",
                )}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation dots indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-colors duration-300",
                i === 0 ? "bg-green-400" : "bg-gray-600",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimatedServices;
