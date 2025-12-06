import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

const FinalCTA: React.FC = () => {
  return (
    <section className="py-32 bg-[#C5C5B5] relative overflow-hidden">
      {/* Background elements for visual interest */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#1E1F1E] rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#1E1F1E] rounded-full blur-3xl"></div>
      </div>
      
      <div className="container text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection animation="fadeInUp">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-[#1E1F1E]/60 font-medium mb-6">
                Ready to Begin?
              </p>
              <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-[#1E1F1E] via-[#1E1F1E]/60 to-[#1E1F1E] bg-clip-text text-transparent">
                  Looking for more than
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#1E1F1E]/80 via-[#1E1F1E] to-[#1E1F1E]/80 bg-clip-text text-transparent">
                  a place to sleep?
                </span>
              </h2>
            </div>
          </AnimatedSection>
          
          <AnimatedSection animation="scaleIn" delay={300}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#1E1F1E]/5 via-transparent to-[#1E1F1E]/5 rounded-2xl"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-[#1E1F1E]/10">
                <p className="text-xl md:text-2xl text-[#1E1F1E]/90 mb-12 leading-relaxed font-medium">
                  Let's see if Bond is right for you.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Link
                    to="/book"
                    className="relative bg-gradient-to-r from-[#1E1F1E] to-[#1E1F1E]/80 text-[#C5C5B5] px-8 py-4 rounded-full font-semibold text-lg uppercase tracking-wide transition-all duration-300 hover:shadow-xl hover:scale-105 group overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      Book Your Place
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1E1F1E]/80 to-[#1E1F1E] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  
                  <Link 
                    to="/about" 
                    className="text-[#1E1F1E]/70 hover:text-[#1E1F1E] transition-colors font-medium text-lg underline underline-offset-4 decoration-2 decoration-[#1E1F1E]/30 hover:decoration-[#1E1F1E]"
                  >
                    Learn About Our Story
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;