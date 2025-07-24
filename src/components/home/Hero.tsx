import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';
import BookingBar from '../BookingBar';

const Hero: React.FC = () => {
  return (
    <section className="relative h-screen flex items-center pb-20 md:pb-24 lg:pb-24">
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      <div className="absolute inset-0 bg-[url('https://iili.io/FcOqdX9.png')] bg-cover bg-[center_bottom_20%]"></div>
      <div className="container relative z-20">
        <div className="max-w-3xl mb-2 md:mb-4 lg:mb-4">
          <AnimatedSection animation="fadeInUp" delay={300}>
            <h1 className="font-bold text-5xl md:text-7xl tracking-tight mb-8">
              <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                Live. Work. Belong.
              </span>
            </h1>
          </AnimatedSection>
          
          <AnimatedSection animation="fadeInUp" delay={600}>
            <p className="text-lg md:text-xl lg:text-2xl text-[#C5C5B5] mb-6 md:mb-8 lg:mb-12 leading-relaxed">
              Premium coliving for digital nomads in central Funchal, Madeira. Private apartments with enterprise-grade WiFi, coworking space, and all amenities included. 5 minutes to ocean and city center.
            </p>
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
                  // Trigger the sticky booking bar modal
                  const event = new CustomEvent('openBookingModal');
                  window.dispatchEvent(event);
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