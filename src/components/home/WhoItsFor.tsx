// components/WhoItsFor.tsx
import React from 'react';
import { Users, Zap, Fingerprint } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

const WhoItsFor: React.FC = () => {
  const cardData = [
    {
      icon: Users,
      title: "Who You'll Meet",
      content: "At BOND, you'll find yourself among a select group of forward-thinking professionals who've chosen to blend island living with impactful work. From founders building their next venture to developers crafting code in paradise, our residents share a common thread: they're creators, innovators, and dreamers."
    },
    {
      icon: Zap,
      title: "How We Connect",
      content: "Life at BOND flows naturally. Connections form over morning coffee, ideas spark during sunset gatherings, and collaborations emerge during focused coworking sessions. We believe in organic moments over forced networking, whether it's a spontaneous dinner or a weekend hike, interaction happens authentically."
    },
    {
      icon: Fingerprint,
      title: "Our Difference",
      content: "With just 5-10 residents, BOND maintains an intimate atmosphere where everyone knows each other, yet there's always space for solitude. Our minimum one-month stays mean you'll become part of a stable community, not a revolving door. We've created an environment where global minds can put down local roots."
    }
  ];

  return (
    <section className="py-32 bg-[#1E1F1E] relative overflow-hidden">
      {/* Subtle Background Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05] pointer-events-none"></div>
      
      {/* Decorative Gradient Blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C5C5B5]/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#C5C5B5]/5 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative z-10">
        
        {/* Header & Manifesto */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <AnimatedSection animation="fadeInUp">
            <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-[#C5C5B5]/20 bg-[#C5C5B5]/5 backdrop-blur-md">
              <span className="text-xs uppercase tracking-[0.25em] text-[#C5C5B5] font-bold">
                Selective by Design
              </span>
            </div>

            <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter leading-[1.1]">
              <span className="text-white">This isn't for everyone.</span>
              <br />
              <span className="text-[#C5C5B5] italic font-serif">And that's the point.</span>
            </h2>

            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#C5C5B5]/50 to-transparent mx-auto mb-8"></div>

            <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-light">
              BOND is for people who want focus <span className="text-[#C5C5B5] font-serif italic">&</span> community. 
              Who value design, independence, and connection. 
              Who prefer shared energy without shared chaos.
            </p>
          </AnimatedSection>
        </div>

        {/* The Three Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {cardData.map((card, index) => {
            const Icon = card.icon;
            return (
              <AnimatedSection 
                key={index} 
                animation="fadeInUp" 
                delay={200 + (index * 150)}
                className="h-full"
              >
                <div className="group h-full p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#C5C5B5]/30 transition-all duration-500 backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-2xl bg-[#1E1F1E] border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-[#C5C5B5]/50 transition-all duration-500 shadow-lg">
                    <Icon className="w-7 h-7 text-[#C5C5B5]" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#C5C5B5] transition-colors">
                    {card.title}
                  </h3>
                  
                  <p className="text-white/60 text-base leading-relaxed group-hover:text-white/80 transition-colors">
                    {card.content}
                  </p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default WhoItsFor;