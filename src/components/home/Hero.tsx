import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';
import BookingBar from '../BookingBar';

const Hero: React.FC = () => {
  return (
    <section className="relative h-screen flex items-center pb-32 md:pb-32 lg:pb-24">
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      <div className="absolute inset-0 bg-[url('https://iili.io/FcOqdX9.png')] bg-cover bg-[center_bottom_20%]"></div>
      <div className="container relative z-20">
        <div className="max-w-3xl mb-8 md:mb-8 lg:mb-4">
          <AnimatedSection animation="fadeInUp" delay={300}>
            <h1 className="font-bold text-5xl md:text-7xl tracking-tight mb-8">
              <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                Live. Work. Belong.
              </span>
            </h1>
          </AnimatedSection>
          
          <AnimatedSection animation="fadeInUp" delay={600}>
            <p className="text-xl md:text-2xl text-[#C5C5B5] mb-12 leading-relaxed">
              Premium coliving for digital nomads in central Funchal, Madeira. Private apartments with enterprise-grade WiFi, coworking space, and all amenities included. 5 minutes to ocean and city center.
            </p>
          </AnimatedSection>
          
        </div>
      </div>
      
      {/* Booking Bar */}
      <div className="absolute bottom-4 md:bottom-4 lg:bottom-12 left-0 right-0 z-30 px-4">
        <div className="container">
          <AnimatedSection animation="fadeInUp" delay={1200}>
            <BookingBar />
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default Hero;