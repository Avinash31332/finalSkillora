import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "What services do you offer?",
    answer:
      "We provide Skill Exchange Optimization, Project-Based Trading, Skill Network Marketing, Mentorship Trading, Creative Skills Exchange, and Technical Skills Bartering.",
  },
  {
    id: 2,
    question: "How do I choose the right skill exchange for my needs?",
    answer:
      "Our platform analyzes your skills, goals, and project requirements to match you with the most suitable trading opportunities. We consider your expertise level, time availability, and desired learning outcomes.",
  },
  {
    id: 3,
    question: "How long does it take to see results from skill trading?",
    answer:
      "Results vary depending on your engagement level and the type of skills being exchanged. Most users see meaningful collaborations within 2-4 weeks of active participation.",
  },
  {
    id: 4,
    question: "Can I combine multiple skill exchanges?",
    answer:
      "Absolutely! You can participate in multiple skill exchanges simultaneously. Our platform helps you manage different trading relationships and ensures you can balance your commitments effectively.",
  },
  {
    id: 5,
    question: "Is there a cost to join the skill trading platform?",
    answer:
      "Our basic skill trading features are completely free. We offer premium features for advanced matching, priority support, and enhanced project management tools.",
  },
];

const FAQSection: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(1); // First FAQ open by default

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <section className="bg-black text-white py-16 lg:py-24">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div className="space-y-8 lg:sticky lg:top-8">
            <div className="flex justify-center lg:justify-start">
              <div className="w-20 h-20 bg-green-400/10 rounded-2xl flex items-center justify-center border border-green-400/20">
                <div className="w-12 h-12 bg-green-400 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-black"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="text-center lg:text-left space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                You have different
                <br />
                <span className="text-green-400">questions?</span>
              </h2>

              <p className="text-gray-300 text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                Our team will answer all your questions. We ensure a quick
                response.
              </p>

              <Button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 px-8 py-3 rounded-lg font-semibold">
                Book a Call →
              </Button>
            </div>
          </div>

          {/* Right FAQ Content */}
          <div className="space-y-6">
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-green-400 text-sm font-semibold tracking-wider">
                  📋 FAQs
                </span>
              </div>
              <h3 className="text-3xl lg:text-4xl font-bold leading-tight">
                Let us address your{" "}
                <span className="text-green-400">questions</span> today!
              </h3>
            </div>

            <div className="space-y-4">
              {faqData.map((faq) => (
                <div
                  key={faq.id}
                  className={cn(
                    "border-2 rounded-lg transition-all duration-300 cursor-pointer overflow-hidden",
                    openFAQ === faq.id
                      ? "border-green-400 bg-gray-900/50 shadow-lg shadow-green-400/20"
                      : "border-white/20 bg-gray-900/30 hover:border-white/40",
                  )}
                  onClick={() => toggleFAQ(faq.id)}
                >
                  {/* Question */}
                  <div className="p-6 flex items-center justify-between">
                    <h4 className="text-white font-semibold text-lg pr-4">
                      {faq.question}
                    </h4>
                    <div
                      className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                        openFAQ === faq.id
                          ? "bg-green-400 text-black rotate-45"
                          : "bg-gray-700 text-white hover:bg-gray-600",
                      )}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Answer */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-500 ease-in-out",
                      openFAQ === faq.id
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0",
                    )}
                  >
                    <div className="px-6 pb-6">
                      <div
                        className={cn(
                          "text-gray-300 leading-relaxed transition-all duration-300 delay-100",
                          openFAQ === faq.id
                            ? "translate-y-0"
                            : "translate-y-2",
                        )}
                      >
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
