import React from 'react';
import AnimatedSection from '../AnimatedSection';

const WhoItsFor: React.FC = () => {
  const cardData = [
    {
      title: "Who You'll Meet",
      content: "At BOND, you'll find yourself among a select group of forward- thinking professionals who've chosen to blend island living with impactful work. From founders building their next venture to developers crafting code in paradise, our residents share a common thread: they're creators, innovators, and dreamers who value both meaningful connection and independent growth."
    },
    {
      title: "How We Connect",
      content: "Life at BOND flows naturally. Connections form over morning coffee in the communal table, ideas spark during sunset gatherings on the rooftop, and collaborations emerge during focused coworking sessions. We believe in organic moments over forced networking, whether it's a spontaneous family-style dinner or a weekend hike, every interaction happens authentically."
    },
    {
      title: "Our Difference",
      content: "With just 5-10 residents at any time, BOND maintains an intimate atmosphere where everyone knows each other, yet there's always space for solitude. Our minimum one-month stays mean you'll become part of a stable community, not a revolving door of faces. We've created an environment where global minds can put down local roots, where privacy is respected, and where genuine connections flourish naturally."
    }
  ];

  return (
    <section className="py-32 bg-[#C5C5B5] relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#1E1F1E] rounded-full -translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#1E1F1E] rounded-full translate-x-48 translate-y-48"></div>
      </div>
      
      <div className="container">
        <div className="max-w-4xl mx-auto text-center relative">
          <AnimatedSection animation="fadeInUp">
            <div className="mb-12">
              <p className="text-sm uppercase tracking-[0.2em] text-[#1E1F1E]/60 font-medium mb-6">
                Selective by Design
              </p>
              <h2 className="text-5xl md:text-6xl font-bold mb-8">
                <span className="bg-gradient-to-r from-[#1E1F1E] via-[#1E1F1E]/60 to-[#1E1F1E] bg-clip-text text-transparent leading-tight">
                  This isn't for everyone.
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#1E1F1E]/80 via-[#1E1F1E] to-[#1E1F1E]/80 bg-clip-text text-transparent">
                  And that's the point.
                </span>
              </h2>
            </div>
          </AnimatedSection>
          
          <AnimatedSection animation="scaleIn" delay={300}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#1E1F1E]/5 via-transparent to-[#1E1F1E]/5 rounded-2xl"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-[#1E1F1E]/10">
                <p className="text-xl md:text-2xl text-[#1E1F1E]/90 leading-relaxed font-medium mb-12">
                  BOND is for people who want focus and community. Who value design, independence, 
                  and connection. Who prefer shared energy without shared chaos.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {cardData.map((card, index) => (
                    <AnimatedSection
                      key={index}
                      animation="fadeInUp"
                      delay={600 + (index * 200)}
                      className="p-6 bg-white/20 backdrop-blur-sm rounded-xl border border-[#1E1F1E]/10 hover:bg-white/30 transition-all duration-300"
                    >
                      <h3 className="text-xl font-bold text-[#1E1F1E] mb-4">{card.title}</h3>
                      <p className="text-[#1E1F1E]/80 leading-relaxed">{card.content}</p>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default WhoItsFor;