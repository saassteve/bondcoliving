import React from 'react';
import { Sparkles } from 'lucide-react';

const MARQUEE_ITEMS = [
  "Premium Coliving",
  "600Mbps+ Internet",
  "Central Funchal",
  "Curated Community",
  "Private Apartments",
  "Coworking Space",
  "Weekly Cleaning",
  "Laundry Done For You",
];

const Marquee: React.FC = () => {
  return (
    <div className="relative w-full bg-[#1E1F1E] border-y border-white/5 overflow-hidden py-6 md:py-8 z-20">
      {/* Gradient Fade on edges for depth */}
      <div className="absolute top-0 left-0 w-20 md:w-40 h-full bg-gradient-to-r from-[#1E1F1E] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-20 md:w-40 h-full bg-gradient-to-l from-[#1E1F1E] to-transparent z-10 pointer-events-none" />

      <div className="flex items-center gap-0 w-max animate-marquee hover:[animation-play-state:paused]">
        {/* Render loop twice to ensure seamless infinity scroll */}
        {[...Array(2)].map((_, loopIndex) => (
          <div key={loopIndex} className="flex items-center shrink-0">
            {MARQUEE_ITEMS.map((item, index) => (
              <div key={`${loopIndex}-${index}`} className="flex items-center">
                <span className="text-2xl md:text-4xl font-bold text-[#C5C5B5] uppercase tracking-widest px-6 md:px-12 whitespace-nowrap">
                  {item}
                </span>
                <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-white/20" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Inline styles for the custom animation to avoid tailwind.config dependency */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Marquee;