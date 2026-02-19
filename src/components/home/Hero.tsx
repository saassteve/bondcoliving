import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Coffee, ArrowDown } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-screen min-h-[100svh] flex flex-col justify-center pb-12 overflow-hidden -mt-32 md:-mt-24">
      {/* Background Image & Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/static/foundersbond.png"
          alt="Premium nomad apartments in central Funchal, Madeira"
          className="w-full h-full object-cover"
          loading="eager"
        />
        
        {/* 1. Base Darkening Layer - darkens entire image for contrast */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* 2. Gradient Layer - ensures bottom text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1F1E] via-[#1E1F1E]/50 to-transparent opacity-90"></div>
      </div>

      <div className="container relative z-20 pt-32 md:pt-24">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Typography */}
          <div className="lg:col-span-7">
            <AnimatedSection animation="fadeInUp" delay={200}>
              <h1 className="font-bold text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter mb-6 text-[#C5C5B5] leading-[0.9]">
                Live. Work. <br />
                <span className="text-white italic">Belong.</span>
              </h1>
              <p className="text-lg md:text-xl text-[#C5C5B5]/80 max-w-md leading-relaxed border-l border-[#C5C5B5]/30 pl-4 mb-8">
                Premium nomad living across three buildings in central Funchal, Madeira.
              </p>
            </AnimatedSection>

            {/* Benefit Pills */}
            <AnimatedSection animation="fadeInUp" delay={800}>
              <div className="flex flex-wrap gap-3">
                {['Private Apartments', 'Enterprise WiFi', 'Coworking Included'].map((tag) => (
                  <span key={tag} className="px-4 py-1.5 rounded-full border border-[#C5C5B5]/20 bg-[#C5C5B5]/5 backdrop-blur-md text-[#C5C5B5] text-xs uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* Right: Floating Glass Cards */}
          <div className="lg:col-span-5 w-full">
            <AnimatedSection animation="fadeInUp" delay={500}>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-3xl">
                {/* Grid: 2 columns on mobile (side-by-side), 1 column on desktop (stacked) */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                  
                  {/* Apartment Card - Updated to navigate to external URL */}
                  <button
                    onClick={() => window.location.href = 'https://stayatbond.com/locations'}
                    className="group relative overflow-hidden rounded-2xl bg-[#1E1F1E]/60 hover:bg-[#C5C5B5] transition-all duration-500 p-4 md:p-6 text-left border border-white/5 h-full flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-2 md:mb-4">
                      <div className="p-2 md:p-3 bg-white/10 rounded-xl text-white group-hover:text-[#1E1F1E] transition-colors">
                        <Home className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <ArrowDown className="-rotate-90 w-4 h-4 md:w-5 md:h-5 text-white/50 group-hover:text-[#1E1F1E] transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-[#1E1F1E] mb-1">Apartments</h3>
                      <p className="text-xs md:text-sm text-white/60 group-hover:text-[#1E1F1E]/80">Short & long-term stays available</p>
                    </div>
                  </button>

                  {/* Coworking Card */}
                  <button
                    onClick={() => navigate('/coworking')}
                    className="group relative overflow-hidden rounded-2xl bg-[#1E1F1E]/60 hover:bg-[#C5C5B5] transition-all duration-500 p-4 md:p-6 text-left border border-white/5 h-full flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-2 md:mb-4">
                      <div className="p-2 md:p-3 bg-white/10 rounded-xl text-white group-hover:text-[#1E1F1E] transition-colors">
                        <Coffee className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <ArrowDown className="-rotate-90 w-4 h-4 md:w-5 md:h-5 text-white/50 group-hover:text-[#1E1F1E] transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-[#1E1F1E] mb-1">Coworking</h3>
                      <p className="text-xs md:text-sm text-white/60 group-hover:text-[#1E1F1E]/80">Passes from €10/day</p>
                    </div>
                  </button>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;