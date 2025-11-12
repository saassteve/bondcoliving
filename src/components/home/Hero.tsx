// components/Hero.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedSection from '../AnimatedSection';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[80vh] flex items-center pb-14 md:pb-20">
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      <div className="absolute inset-0 bg-[url('https://ucarecdn.com/958a4400-0486-4ba2-8e75-484d692d7df9/foundersbond.png')] bg-cover bg-[center_bottom_20%]">
        <img
          src="https://ucarecdn.com/958a4400-0486-4ba2-8e75-484d692d7df9/foundersbond.png"
          alt="Modern coliving space in central Funchal, Madeira"
          className="w-full h-full object-cover opacity-0"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>

      <div className="container relative z-20">
        <div className="max-w-3xl text-center lg:text-left">
          <AnimatedSection animation="fadeInUp" delay={200}>
            <h1 className="font-bold text-4xl md:text-6xl tracking-tight mb-4">
              <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                Live. Work. Belong.
              </span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-[#C5C5B5] leading-relaxed">
              Premium coliving for digital nomads in central Funchal, Madeira.
            </p>
          </AnimatedSection>

          {/* Primary and secondary actions */}
          <AnimatedSection animation="fadeInUp" delay={500}>
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openBookingModal'))}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl bg-[#C5C5B5] text-[#1E1F1E] px-6 py-3 font-semibold hover:bg-white transition"
              >
                Check availability
              </button>

              <div className="flex items-center gap-5 text-[#C5C5B5]/90">
                <button
                  onClick={() => document.getElementById('apartments-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm underline underline-offset-4 hover:text-white"
                >
                  View apartments
                </button>
                <button
                  onClick={() => navigate('/coworking')}
                  className="text-sm underline underline-offset-4 hover:text-white"
                >
                  Explore coworking
                </button>
              </div>
            </div>
          </AnimatedSection>

          {/* Compact benefit pills */}
          <AnimatedSection animation="fadeInUp" delay={800}>
            <ul className="mt-6 flex flex-wrap gap-2 max-w-2xl">
              {[
                'Private apartments with all amenities',
                'Enterprise-grade Wi-Fi and coworking',
                '5 minutes to ocean and centre',
                'Curated nomad community',
              ].map(x => (
                <li key={x} className="text-xs md:text-sm text-[#C5C5B5] bg-[#C5C5B5]/10 border border-[#C5C5B5]/20 rounded-full px-3 py-1">
                  {x}
                </li>
              ))}
            </ul>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default Hero;