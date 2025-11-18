import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Users, Heart, Coffee, Map, ArrowDown } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';

const values = [
  {
    id: 1,
    title: "Connection",
    description: "We believe meaningful relationships are built through shared experiences and mutual respect for independence.",
    icon: Users
  },
  {
    id: 2,
    title: "Balance",
    description: "Work and life shouldn't compete—they should complement each other in an environment that inspires both.",
    icon: Heart
  },
  {
    id: 3,
    title: "Quality",
    description: "From the spaces we create to the experiences we curate, we believe in doing fewer things exceptionally well.",
    icon: Coffee
  },
  {
    id: 4,
    title: "Place",
    description: "Madeira isn't just our location—it's our inspiration. This island teaches us daily about finding beauty in simplicity.",
    icon: Map
  }
];

const AboutPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>About Bond | The Story of Steve & Rui</title>
        <meta name="description" content="A father and son's journey to creating the ultimate digital nomad sanctuary in Madeira." />
      </Helmet>
      
      {/* --- HERO SECTION --- */}
      <section className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden bg-[#1E1F1E]">
        {/* Background Parallax Illusion */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#1E1F1E] z-10" />
          <img 
            src="https://images.pexels.com/photos/6164986/pexels-photo-6164986.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Madeira Landscape"
            className="w-full h-full object-cover opacity-60 scale-105 animate-slow-zoom"
          />
        </div>

        <div className="container relative z-20 text-center">
          <AnimatedSection animation="fadeInUp">
            <div className="mb-6 inline-block">
              <div className="h-px w-20 bg-[#C5C5B5] mb-4 mx-auto" />
              <p className="text-[#C5C5B5] uppercase tracking-[0.3em] text-sm font-medium">Our Story</p>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 tracking-tight leading-[1.1]">
              It started with a <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] italic font-serif">
                reconnection.
              </span>
            </h1>
            
            <p className="text-xl text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
              A father and son's journey to creating something meaningful in the heart of the Atlantic.
            </p>
          </AnimatedSection>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/30 animate-bounce">
          <ArrowDown className="w-6 h-6" />
        </div>
      </section>
      
      {/* --- NARRATIVE SECTION --- */}
      <section className="py-32 bg-[#1E1F1E]">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Image Side - Sticky on Desktop */}
            <div className="lg:col-span-5 lg:sticky lg:top-32">
               <AnimatedSection animation="scaleIn">
                <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl group">
                  <div className="absolute inset-0 border border-white/10 rounded-[2rem] z-20 pointer-events-none" />
                  <img 
                    src="/Find your Why (5).png" 
                    alt="Steve and Rui Founders"
                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105 grayscale hover:grayscale-0"
                  />
                  <div className="absolute bottom-8 left-8 z-20">
                    <p className="text-white font-bold text-lg">Steve & Rui</p>
                    <p className="text-[#C5C5B5] text-sm uppercase tracking-widest">Founders</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                </div>
              </AnimatedSection>
            </div>

            {/* Text Side */}
            <div className="lg:col-span-7">
              <AnimatedSection animation="fadeInUp" delay={200}>
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-12 leading-tight">
                  Finding <br /><span className="text-[#C5C5B5]">Our Bond.</span>
                </h2>
                
                <div className="space-y-8 text-lg md:text-xl text-white/70 font-light leading-relaxed">
                  <p className="border-l-2 border-[#C5C5B5]/30 pl-6">
                    After years apart, father and son duo Steve and Rui finally found their bond in Madeira.
                  </p>
                  
                  <p>
                    Steve's remote tech work brought him home, but it was their rekindled connection that inspired <strong className="text-white">BOND</strong> — a space where ambitious professionals can discover their own perfect blend of meaningful work and island living.
                  </p>
                  
                  <p>
                    What started as a personal journey became a vision: creating a place where others could find their own balance between independence and community, work and life, ambition and peace.
                  </p>
                  
                  <div className="pt-8">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Signature_sample.svg" 
                      alt="Signatures" 
                      className="h-16 opacity-50 invert filter brightness-0" // Placeholder for actual signature if you have one
                    />
                  </div>
                </div>
              </AnimatedSection>
            </div>

          </div>
        </div>
      </section>
      
      {/* --- MANIFESTO / VALUES SECTION --- */}
      <section className="py-32 bg-[#C5C5B5] text-[#1E1F1E]">
        <div className="container">
          <AnimatedSection animation="fadeInUp">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 border-b border-[#1E1F1E]/10 pb-8">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                What We <br />Believe
              </h2>
              <p className="text-xl text-[#1E1F1E]/60 max-w-md mt-6 md:mt-0">
                The values that guide every decision we make, from the furniture we choose to the community we build.
              </p>
            </div>
          </AnimatedSection>
          
          <div className="flex flex-col">
            {values.map((item, index) => {
              const Icon = item.icon;
              return (
                <AnimatedSection 
                  key={item.id} 
                  animation="fadeInUp" 
                  delay={index * 100}
                >
                  <div className="group border-b border-[#1E1F1E]/10 py-12 md:py-16 transition-colors hover:bg-[#1E1F1E]/5">
                    <div className="grid md:grid-cols-12 gap-8 items-start">
                      
                      {/* Icon & Number */}
                      <div className="md:col-span-3 flex items-center gap-4">
                        <span className="text-xs font-bold border border-[#1E1F1E]/20 rounded-full w-8 h-8 flex items-center justify-center">
                          0{item.id}
                        </span>
                        <Icon className="w-6 h-6 text-[#1E1F1E]/40 group-hover:text-[#1E1F1E] transition-colors" />
                      </div>

                      {/* Title */}
                      <div className="md:col-span-4">
                        <h3 className="text-3xl md:text-4xl font-bold group-hover:translate-x-2 transition-transform duration-300">
                          {item.title}
                        </h3>
                      </div>

                      {/* Description */}
                      <div className="md:col-span-5">
                        <p className="text-lg text-[#1E1F1E]/70 leading-relaxed group-hover:text-[#1E1F1E] transition-colors">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;