// components/Intro.tsx
import React from 'react';
import { ArrowRight, Users, Wifi, Key, Star } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

const Intro: React.FC = () => {
  return (
    <section className="py-24 bg-[#1E1F1E] text-[#C5C5B5]">
      <div className="container">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Left Side: Sticky Content */}
          <div className="lg:w-1/3 lg:sticky lg:top-24 lg:h-fit z-10">
            <AnimatedSection animation="fadeInUp">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5C5B5]/50 mb-4 block">
                The Bond Difference
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
                Where Independence <br />
                <span className="text-[#C5C5B5]/50">Meets Connection.</span>
              </h2>
              <p className="text-lg text-[#C5C5B5]/80 mb-8 leading-relaxed">
                We combine the privacy of your own apartment with the energy of a curated community. No forced fun, just organic connection.
              </p>
              
              <button 
                onClick={() => document.getElementById('apartments-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="group flex items-center gap-4 text-white font-medium hover:gap-6 transition-all"
              >
                <span className="border-b border-white pb-1">Find your apartment</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </AnimatedSection>
          </div>

          {/* Right Side: Bento Grid */}
          <div className="lg:w-2/3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Large Image Tile */}
              <AnimatedSection animation="fadeInUp" delay={100} className="md:col-span-2">
                <div className="relative aspect-[2/1] rounded-3xl overflow-hidden group">
                   <img 
                    src="https://ucarecdn.com/bf59726e-44a3-459e-91aa-3ae94ffbc465/friends_laughing_Madiera.png"
                    alt="Community"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                   />
                   <div className="absolute bottom-0 left-0 p-8 bg-gradient-to-t from-black/80 to-transparent w-full">
                      <h3 className="text-2xl font-bold text-white mb-1">Curated Community</h3>
                      <p className="text-white/70">Connect with founders and creators.</p>
                   </div>
                </div>
              </AnimatedSection>

              {/* Feature Tile 1 */}
              <AnimatedSection animation="fadeInUp" delay={200}>
                <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/10 rounded-3xl p-8 h-full hover:bg-[#C5C5B5]/10 transition-colors">
                  <div className="w-12 h-12 bg-[#C5C5B5] rounded-full flex items-center justify-center mb-6 text-[#1E1F1E]">
                    <Key className="w-5 h-5" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">Private Living</h4>
                  <p className="text-[#C5C5B5]/60 text-sm leading-relaxed">
                    Your own kitchen, bathroom, and workspace. The sanctuary you need to recharge.
                  </p>
                </div>
              </AnimatedSection>

              {/* Feature Tile 2 */}
              <AnimatedSection animation="fadeInUp" delay={300}>
                <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/10 rounded-3xl p-8 h-full hover:bg-[#C5C5B5]/10 transition-colors">
                  <div className="w-12 h-12 bg-[#C5C5B5] rounded-full flex items-center justify-center mb-6 text-[#1E1F1E]">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">Enterprise WiFi</h4>
                  <p className="text-[#C5C5B5]/60 text-sm leading-relaxed">
                    Fiber optic speeds in every room and dedicated coworking areas.
                  </p>
                </div>
              </AnimatedSection>

              {/* Stat/Review Tile */}
              <AnimatedSection animation="fadeInUp" delay={400} className="md:col-span-2">
                 <div className="bg-[#C5C5B5] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[#1E1F1E]">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-4">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-12 h-12 rounded-full border-2 border-[#C5C5B5] bg-gray-300 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="flex text-[#1E1F1E] gap-1">
                          <Star className="w-4 h-4 fill-current" />
                          <Star className="w-4 h-4 fill-current" />
                          <Star className="w-4 h-4 fill-current" />
                          <Star className="w-4 h-4 fill-current" />
                          <Star className="w-4 h-4 fill-current" />
                        </div>
                        <p className="text-sm font-semibold mt-1">Loved by nomads</p>
                      </div>
                    </div>
                    <p className="text-lg md:text-xl font-serif italic max-w-xs text-center md:text-right">
                      "Feels like a boutique hotel with a soul."
                    </p>
                 </div>
              </AnimatedSection>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Intro;