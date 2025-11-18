// components/Hero.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Coffee, ArrowDown } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-screen min-h-[700px] flex flex-col justify-end pb-12 md:pb-24 overflow-hidden">
      {/* Background Image with refined gradient - no full dark overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://ucarecdn.com/958a4400-0486-4ba2-8e75-484d692d7df9/foundersbond.png"
          alt="Modern coliving space in central Funchal, Madeira"
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Gradient only at the bottom to make text readable while keeping top bright */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1F1E] via-[#1E1F1E]/50 to-transparent opacity-90"></div>
      </div>

      <div className="container relative z-20">
        <div className="grid lg:grid-cols-12 gap-8 items-end">
          
          {/* Left: Typography */}
          <div className="lg:col-span-7">
            <AnimatedSection animation="fadeInUp" delay={200}>
              <h1 className="font-bold text-5xl md:text-7xl lg:text-8xl tracking-tighter mb-6 text-[#C5C5B5] leading-[0.9]">
                Live. Work. <br />
                <span className="text-white italic">Belong.</span>
              </h1>
              <p className="text-lg md:text-xl text-[#C5C5B5]/80 max-w-md leading-relaxed border-l border-[#C5C5B5]/30 pl-4 mb-8">
                Premium coliving for digital nomads in central Funchal, Madeira.
              </p>
            </AnimatedSection>

            {/* Benefit Pills */}
            <AnimatedSection animation="fadeInUp" delay={800}>
              <div className="flex flex-wrap gap-3">
                {['Private Apartments', 'Coworking Included', 'Curated Community'].map((tag) => (
                  <span key={tag} className="px-4 py-1.5 rounded-full border border-[#C5C5B5]/20 bg-[#C5C5B5]/5 backdrop-blur-md text-[#C5C5B5] text-xs uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* Right: Floating Glass Cards */}
          <div className="lg:col-span-5">
            <AnimatedSection animation="fadeInUp" delay={500}>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-3xl">
                <div className="grid gap-2">
                  {/* Apartment Card */}
                  <button
                    onClick={() => document.getElementById('apartments-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group relative overflow-hidden rounded-2xl bg-[#1E1F1E]/60 hover:bg-[#C5C5B5] transition-all duration-500 p-6 text-left border border-white/5"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white/10 rounded-xl text-white group-hover:text-[#1E1F1E] transition-colors">
                        <Home className="w-6 h-6" />
                      </div>
                      <ArrowDown className="-rotate-90 w-5 h-5 text-white/50 group-hover:text-[#1E1F1E] transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-[#1E1F1E] mb-1">Apartments</h3>
                      <p className="text-sm text-white/60 group-hover:text-[#1E1F1E]/80">Private units from €1,500/mo</p>
                    </div>
                  </button>

                  {/* Coworking Card */}
                  <button
                    onClick={() => navigate('/coworking')}
                    className="group relative overflow-hidden rounded-2xl bg-[#1E1F1E]/60 hover:bg-[#C5C5B5] transition-all duration-500 p-6 text-left border border-white/5"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white/10 rounded-xl text-white group-hover:text-[#1E1F1E] transition-colors">
                        <Coffee className="w-6 h-6" />
                      </div>
                      <ArrowDown className="-rotate-90 w-5 h-5 text-white/50 group-hover:text-[#1E1F1E] transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-[#1E1F1E] mb-1">Coworking</h3>
                      <p className="text-sm text-white/60 group-hover:text-[#1E1F1E]/80">Passes from €14/day</p>
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