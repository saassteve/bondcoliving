import React from 'react';
import { Check, X } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

const comparisonFeatures = [
  { name: 'Private Kitchen & Bath', typical: true, bond: true },
  { name: 'Utilities Included', typical: true, bond: true },
  { name: 'WiFi Included', typical: true, bond: true },
  { name: 'Bi-Weekly Cleaning', typical: false, bond: true },
  { name: 'Weekly Laundry Service', typical: false, bond: true },
  { name: 'Professional Workspace', typical: false, bond: true },
  { name: 'Community & Events', typical: false, bond: true },
  { name: 'Monthly Rates', typical: false, bond: true },
];

const ValueComparison: React.FC = () => {
  return (
    <section className="py-24 bg-[#1E1F1E]">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection animation="fadeInUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                  The Bond Difference
                </span>
              </h2>
              <p className="text-sm uppercase tracking-[0.2em] text-[#C5C5B5]/60 font-medium">
                More than just a place to stay
              </p>
            </div>
          </AnimatedSection>
          
          <AnimatedSection animation="scaleIn" delay={200}>
            <div className="relative">
              <div className="absolute -inset-px bg-gradient-to-br from-[#C5C5B5]/20 to-transparent rounded-3xl"></div>
              <div className="relative grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden">
                <AnimatedSection animation="fadeInLeft" delay={400}>
                  <div className="p-12 border-b md:border-b-0 md:border-r border-[#C5C5B5]/20">
                    <div className="text-center mb-12">
                      <h3 className="text-2xl font-bold mb-2">Short-term Rentals</h3>
                      <p className="text-[#C5C5B5]/60">Airbnb & similar platforms</p>
                    </div>
                    <ul className="space-y-6">
                      {comparisonFeatures.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className={`w-8 h-8 flex items-center justify-center mr-4 rounded-full ${
                            feature.typical 
                              ? 'bg-[#C5C5B5]/10 text-[#C5C5B5]' 
                              : 'bg-[#C5C5B5]/5 text-[#C5C5B5]/40'
                          }`}>
                            {feature.typical ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </span>
                          <span className={feature.typical ? 'text-[#C5C5B5]' : 'text-[#C5C5B5]/40'}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedSection>
                
                <AnimatedSection animation="fadeInRight" delay={600}>
                  <div className="p-12 bg-[#C5C5B5]/5">
                    <div className="text-center mb-12">
                      <h3 className="text-2xl font-bold mb-2">Bond</h3>
                      <p className="text-[#C5C5B5]/60">Purpose-built for longer stays</p>
                    </div>
                    <ul className="space-y-6">
                      {comparisonFeatures.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-8 h-8 bg-[#C5C5B5]/10 text-[#C5C5B5] flex items-center justify-center mr-4 rounded-full">
                            <Check className="w-4 h-4" />
                          </span>
                          <span className="text-[#C5C5B5]">{feature.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </AnimatedSection>
          
          {/* Conclusion */}
          <AnimatedSection animation="fadeInUp" delay={800}>
            <div className="text-center mt-12">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-4 text-[#C5C5B5]">
                  Better value for longer stays.
                </h3>
                <p className="text-[#C5C5B5]/80 text-lg leading-relaxed">
                  While short-term rentals charge €70-100+ per night (€2000+/mo) without amenities, 
                  Bond offers all-inclusive monthly rates from €1,600 in central Funchal. Get enterprise-grade WiFi, 
                  coworking space, cleaning service, and a digital nomad community - all for less than basic Airbnb.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default ValueComparison;