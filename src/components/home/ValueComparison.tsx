import React from 'react';
import { Check, X, Minus } from 'lucide-react';
// Fixed import: Go up one level to find AnimatedSection in src/components/
import AnimatedSection from '../AnimatedSection';

const features = [
  { name: 'Private Kitchen & Bath', standard: true, bond: true },
  { name: 'Utilities Included', standard: true, bond: true },
  { name: 'WiFi Included', standard: true, bond: true },
  { name: 'Bi-Weekly Cleaning', standard: false, bond: true },
  { name: 'Weekly Laundry Service', standard: false, bond: true },
  { name: 'Professional Workspace', standard: false, bond: true },
  { name: 'Community & Events', standard: false, bond: true },
  { name: 'Monthly Rates', standard: false, bond: true },
];

const ValueComparison: React.FC = () => {
  return (
    <section className="py-32 bg-[#1E1F1E] relative overflow-hidden">
       {/* Background decorations */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C5C5B5]/5 rounded-full blur-[120px] pointer-events-none" />

       <div className="container relative z-10">
          <AnimatedSection animation="fadeInUp">
             {/* Header */}
             <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                  The Bond <span className="text-[#C5C5B5]">Difference.</span>
                </h2>
                <p className="text-xl text-white/60">
                  Why settle for a lonely apartment when you can have it all?
                </p>
             </div>
          </AnimatedSection>

          {/* Comparison Table/Grid */}
          <div className="max-w-5xl mx-auto">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                
                {/* Labels Column (Hidden on mobile, visible on desktop) */}
                <div className="hidden md:block space-y-6 py-8">
                   <div className="h-12"></div> {/* Spacer for headers */}
                   {features.map((f, i) => (
                      <div key={i} className="h-12 flex items-center text-white/50 font-medium text-sm uppercase tracking-wide">
                         {f.name}
                      </div>
                   ))}
                </div>

                {/* Competitor Card */}
                <AnimatedSection animation="fadeInUp" delay={100} className="relative">
                   <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                      <h3 className="text-xl font-bold text-white/60 mb-2">Typical Rental</h3>
                      <p className="text-xs uppercase tracking-widest text-white/30 mb-10">Short-term Platforms</p>
                      
                      <div className="space-y-6 md:space-y-0">
                         {features.map((f, i) => (
                            <div key={i} className="h-12 flex items-center justify-between md:justify-center border-b border-white/5 md:border-none pb-2 md:pb-0">
                               <span className="md:hidden text-white/50 text-sm">{f.name}</span>
                               {f.standard ? (
                                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white/50" />
                                  </div>
                               ) : (
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                    <Minus className="w-4 h-4 text-white/10" />
                                  </div>
                               )}
                            </div>
                         ))}
                      </div>
                   </div>
                </AnimatedSection>

                {/* Bond Card (Highlighted) */}
                <AnimatedSection animation="scaleIn" delay={200} className="relative">
                   {/* Glow effect behind */}
                   <div className="absolute -inset-1 bg-gradient-to-b from-[#C5C5B5]/20 to-transparent rounded-[2.5rem] blur-xl opacity-50 pointer-events-none" />
                   
                   <div className="bg-[#C5C5B5] text-[#1E1F1E] rounded-[2rem] p-8 text-center relative shadow-2xl transform md:scale-105 border border-white/20">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1E1F1E] text-[#C5C5B5] text-xs font-bold uppercase tracking-widest py-2 px-6 rounded-full shadow-lg border border-[#C5C5B5]/50">
                         Best Value
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-2">Bond</h3>
                      <p className="text-xs uppercase tracking-widest text-[#1E1F1E]/60 mb-10">Premium Coliving</p>
                      
                      <div className="space-y-6 md:space-y-0">
                         {features.map((f, i) => (
                            <div key={i} className="h-12 flex items-center justify-between md:justify-center border-b border-[#1E1F1E]/10 md:border-none pb-2 md:pb-0">
                               <span className="md:hidden text-[#1E1F1E]/70 text-sm font-medium">{f.name}</span>
                               {f.bond ? (
                                  <div className="w-8 h-8 bg-[#1E1F1E] rounded-full flex items-center justify-center shadow-md">
                                     <Check className="w-4 h-4 text-[#C5C5B5]" />
                                  </div>
                               ) : (
                                  <X className="w-5 h-5 text-[#1E1F1E]/20" />
                               )}
                            </div>
                         ))}
                      </div>
                   </div>
                </AnimatedSection>

             </div>
          </div>

          {/* Summary Box */}
          <AnimatedSection animation="fadeInUp" delay={400}>
             <div className="mt-24 text-center max-w-3xl mx-auto">
               <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-white/10 shadow-xl">
                  <p className="text-lg md:text-xl text-white/80 leading-relaxed font-light">
                     While short-term rentals charge <span className="text-white font-bold">€70-100+ per night</span> without amenities, 
                     Bond offers all-inclusive monthly rates from <span className="text-[#C5C5B5] font-bold">€1,600</span>. 
                  </p>
                  <div className="mt-6 text-sm text-[#C5C5B5]/70 uppercase tracking-wide font-medium">
                     Enterprise WiFi • Workspace • Cleaning Included
                  </div>
               </div>
             </div>
          </AnimatedSection>

       </div>
    </section>
  );
};

export default ValueComparison;