import React from 'react';
import { ArrowRight, Users, Coffee, Home } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

const benefits = [
  {
    icon: Users,
    title: 'Private Living',
    description: 'Your own space with everything you need, thoughtfully designed for comfort and productivity.',
  },
  {
    icon: Coffee,
    title: 'Focused Work',
    description: 'Professional workspace with enterprise-grade internet and all the tools for success.',
  },
  {
    icon: Home,
    title: 'Real Community',
    description: 'Connect with like-minded professionals who value both independence and collaboration.',
  },
];

const Intro: React.FC = () => {
  return (
    <>
      <section className="py-24 bg-[#1E1F1E]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <AnimatedSection animation="fadeInLeft">
              <div>
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#C5C5B5]/5 text-[#C5C5B5]/80 text-sm uppercase tracking-wide mb-8">
                  Welcome to Bond
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8">
                  <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                    Where Independence<br />Meets Connection
                  </span>
                </h2>
                <div className="mb-8">
                  <p className="text-sm uppercase tracking-[0.2em] text-[#C5C5B5]/60 font-medium">
                    The Bond Difference
                  </p>
                </div>
                <p className="text-xl text-[#C5C5B5] mb-12 leading-relaxed">
                  Bond is premium coliving designed specifically for digital nomads and remote workers. 
                  Located in central Funchal, we combine private apartments with enterprise-grade WiFi, 
                  dedicated coworking space, and a curated community. Everything you need to work 
                  productively while living in paradise.
                </p>
                
                <button 
                  onClick={() => {
                    const apartmentsSection = document.getElementById('apartments-section');
                    apartmentsSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-primary"
                >
                  See Available Apartments
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </AnimatedSection>
            
            <AnimatedSection animation="fadeInRight" delay={200}>
              <div className="aspect-square bg-[#C5C5B5]/5 rounded-3xl overflow-hidden">
                <img 
                  src="https://ucarecdn.com/bf59726e-44a3-459e-91aa-3ae94ffbc465/friends_laughing_Madiera.png"
                  alt="Modern apartment interior at Bond coliving space in Funchal, Madeira featuring contemporary design and natural lighting"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
        
        {/* Benefits Grid - Simplified Animation */}
        <div className="container mt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <AnimatedSection
                  key={index}
                  animation="fadeInUp"
                  delay={400 + (index * 150)}
                  className="text-center group"
                >
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-[#C5C5B5]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#C5C5B5]/20 transition-colors">
                      <Icon className="h-8 w-8 text-[#C5C5B5]" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[#C5C5B5]">{benefit.title}</h3>
                  <p className="text-[#C5C5B5]/70 leading-relaxed">{benefit.description}</p>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default Intro;