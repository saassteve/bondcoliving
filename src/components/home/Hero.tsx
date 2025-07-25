import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';
import BookingBar from '../BookingBar';

const Hero: React.FC = () => {
  return (
    <section className="relative h-screen flex items-center pb-20 md:pb-24 lg:pb-24">
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      <div className="absolute inset-0 bg-[url('https://iili.io/FcOqdX9.png')] bg-cover bg-[center_bottom_20%]">
        <img 
          src="https://iili.io/FcOqdX9.png" 
          alt="Modern coliving space in central Funchal, Madeira with ocean views and contemporary design"
          className="w-full h-full object-cover opacity-0"
          loading="eager"
        />
      </div>
      <div className="container relative z-20">
        <div className="max-w-3xl mb-2 md:mb-4 lg:mb-4 text-center lg:text-left">
          <AnimatedSection animation="fadeInUp" delay={300}>
            <h1 className="font-bold text-5xl md:text-7xl tracking-tight mb-8">
              <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                Live. Work. Belong.
              </span>
            </h1>
          </AnimatedSection>
          
          <AnimatedSection animation="fadeInUp" delay={600}>
            <div className="mb-6 md:mb-8 lg:mb-12">
              <p className="text-lg md:text-xl lg:text-2xl text-[#C5C5B5] mb-6 leading-relaxed">
                Premium coliving for digital nomads in central Funchal, Madeira.
              </p>
              
              {/* Benefits with checkmarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
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
      <div className="absolute bottom-4 md:bottom-6 lg:bottom-12 left-0 right-0 z-30 px-4">
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