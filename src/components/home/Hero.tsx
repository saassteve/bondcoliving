import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Home, Coffee } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';
import BookingBar from '../BookingBar';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[85vh] flex items-center pb-16 md:pb-20 lg:pb-20">
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      <div className="absolute inset-0 bg-[url('https://ucarecdn.com/958a4400-0486-4ba2-8e75-484d692d7df9/foundersbond.png')] bg-cover bg-[center_bottom_20%]">
        <img 
          src="https://ucarecdn.com/958a4400-0486-4ba2-8e75-484d692d7df9/foundersbond.png" 
          alt="Modern coliving space in central Funchal, Madeira with ocean views and contemporary design"
          className="w-full h-full object-cover opacity-0"
          loading="eager"
        />
      </div>
      <div className="container relative z-20">
        <div className="max-w-3xl mb-2 md:mb-4 lg:mb-4 text-center lg:text-left">
          <AnimatedSection animation="fadeInUp" delay={300}>
            <h1 className="font-bold text-4xl md:text-6xl tracking-tight mb-6">
              <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                Live. Work. Belong.
              </span>
            </h1>
          </AnimatedSection>

          <AnimatedSection animation="fadeInUp" delay={600}>
            <div className="mb-4 md:mb-6 lg:mb-8">
              <p className="text-base md:text-lg lg:text-xl text-[#C5C5B5] mb-4 leading-relaxed">
                Premium coliving for digital nomads in central Funchal, Madeira.
              </p>

              {/* Quick Navigation */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-2xl">
                <button
                  onClick={() => {
                    const apartmentsSection = document.getElementById('apartments-section');
                    apartmentsSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex-1 group bg-[#C5C5B5]/10 hover:bg-[#C5C5B5]/20 border-2 border-[#C5C5B5]/30 hover:border-[#C5C5B5] text-[#C5C5B5] px-5 py-3 rounded-xl transition-all duration-300 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Home className="w-5 h-5" />
                    <span className="font-semibold text-sm uppercase tracking-wide">Accommodation</span>
                  </div>
                  <span className="block text-xs text-[#C5C5B5]/70 mt-1">Private apartments from €1,600/mo</span>
                </button>
                <button
                  onClick={() => navigate('/coworking')}
                  className="flex-1 group bg-[#C5C5B5]/10 hover:bg-[#C5C5B5]/20 border-2 border-[#C5C5B5]/30 hover:border-[#C5C5B5] text-[#C5C5B5] px-5 py-3 rounded-xl transition-all duration-300 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Coffee className="w-5 h-5" />
                    <span className="font-semibold text-sm uppercase tracking-wide">Coworking</span>
                  </div>
                  <span className="block text-xs text-[#C5C5B5]/70 mt-1">Flexible passes from €15/day</span>
                </button>
              </div>

              {/* Benefits with checkmarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
                <div className="flex items-center text-[#C5C5B5]/90">
                  <div className="w-5 h-5 bg-[#C5C5B5] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-3 h-3 text-[#1E1F1E]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm md:text-base">Private apartments with all amenities</span>
                </div>
                
                <div className="flex items-center text-[#C5C5B5]/90">
                  <div className="w-5 h-5 bg-[#C5C5B5] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-3 h-3 text-[#1E1F1E]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm md:text-base">Enterprise-grade WiFi & coworking</span>
                </div>
                
                <div className="flex items-center text-[#C5C5B5]/90">
                  <div className="w-5 h-5 bg-[#C5C5B5] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-3 h-3 text-[#1E1F1E]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm md:text-base">5 minutes to ocean & city center</span>
                </div>
                
                <div className="flex items-center text-[#C5C5B5]/90">
                  <div className="w-5 h-5 bg-[#C5C5B5] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-3 h-3 text-[#1E1F1E]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm md:text-base">Curated digital nomad community</span>
                </div>
              </div>
            </div>
          </AnimatedSection>
          
        </div>
      </div>
      
      {/* Booking Bar */}
      <div className="absolute bottom-3 md:bottom-4 lg:bottom-8 left-0 right-0 z-30 px-4">
        <div className="container">
          <AnimatedSection animation="fadeInUp" delay={1200}>
            {/* Desktop: Show full booking bar */}
            <div className="hidden lg:block">
              <BookingBar />
            </div>
            
            {/* Mobile/Tablet: Show find a place button */}
            <div className="lg:hidden">
              <button
                onClick={() => {
                  // Scroll down a bit and then open the modal
                  window.scrollTo({
                    top: window.innerHeight * 0.3,
                    behavior: 'smooth'
                  });
                  
                  // Open modal after scroll animation
                  setTimeout(() => {
                    const event = new CustomEvent('openBookingModal');
                    window.dispatchEvent(event);
                  }, 500);
                }}
                className="w-full bg-[#C5C5B5]/10 hover:bg-[#C5C5B5]/20 text-[#C5C5B5] px-6 py-4 rounded-2xl transition-all duration-300 border border-[#C5C5B5]/20 hover:border-[#C5C5B5]/40 text-left backdrop-blur-sm"
              >
                <span className="text-lg font-medium">Find your place</span>
                <span className="block text-sm text-[#C5C5B5]/60 mt-1">Search available apartments</span>
              </button>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default Hero;