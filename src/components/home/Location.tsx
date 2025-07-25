import React from 'react';
import { Coffee, Palmtree, Bus, ShoppingBag, Utensils, Building, Waves, Mountain, MapPin, Clock } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

const nearbyHighlights = [
  {
    icon: Coffee,
    title: 'Cafes',
    description: '2 min walk',
    distance: '150m'
  },
  {
    icon: Utensils,
    title: 'Restaurants',
    description: '5 min walk',
    distance: '400m'
  },
  {
    icon: Waves,
    title: 'Ocean & Promenade',
    description: '5 min walk',
    distance: '450m'
  },
  {
    icon: Bus,
    title: 'Bus Station',
    description: '7 min walk',
    distance: '600m'
  },
  {
    icon: Building,
    title: 'City Center',
    description: '10 min walk',
    distance: '800m'
  },
  {
    icon: Mountain,
    title: 'Cable Car',
    description: '12 min walk',
    distance: '1km'
  },
  {
    icon: ShoppingBag,
    title: 'Shopping',
    description: '8 min walk',
    distance: '650m'
  },
  {
    icon: Palmtree,
    title: 'City Gardens',
    description: '6 min walk',
    distance: '500m'
  },
];

const Location: React.FC = () => {
  return (
    <section className="py-24 bg-[#1E1F1E]">
      <div className="container">
        <AnimatedSection animation="fadeInUp">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-[#C5C5B5]/60 font-medium mb-4">
                Prime Location
              </p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                  The Heart of Funchal
                </span>
              </h2>
            </div>
            <p className="text-xl text-[#C5C5B5]/80">
              Experience the perfect location for digital nomads - central Funchal puts you minutes from the ocean, cafes, restaurants, and all city amenities. Work productively while living in paradise.
            </p>
          </div>
        </AnimatedSection>
        
        {/* Hero Image */}
        <AnimatedSection animation="scaleIn" delay={200}>
          <div className="mb-16">
            <div className="aspect-video bg-[#C5C5B5]/5 rounded-3xl overflow-hidden relative">
              <img 
                src="https://iili.io/Fceo0du.png"
                alt="Funchal cityscape panorama showing mountains, ocean, and central location of Bond coliving space in Madeira"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex items-center text-white mb-2">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="font-medium">Funchal, Madeira</span>
                </div>
                <p className="text-white/80 text-lg">
                  Where Atlantic beauty meets Portuguese charm
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Location Benefits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          <AnimatedSection animation="fadeInLeft" delay={400}>
            <div>
              <h3 className="text-2xl font-bold mb-8 flex items-center">
                <Clock className="w-6 h-6 mr-3 text-[#C5C5B5]" />
                Everything Within Reach
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nearbyHighlights.map((highlight, index) => {
                  const Icon = highlight.icon;
                  return (
                    <AnimatedSection
                      key={index}
                      animation="fadeInUp"
                      delay={600 + (index * 100)}
                      className="benefit-item group hover:bg-[#C5C5B5]/10 transition-all duration-300"
                    >
                      <div className="relative mr-4 flex-shrink-0">
                        <div className="absolute -inset-1 bg-gradient-to-br from-[#C5C5B5]/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                          <Icon className="w-5 h-5 text-[#C5C5B5]" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold mb-1 truncate">{highlight.title}</h4>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#C5C5B5]/60">{highlight.description}</span>
                          <span className="text-[#C5C5B5]/40 ml-2">{highlight.distance}</span>
                        </div>
                      </div>
                    </AnimatedSection>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>
          
          <AnimatedSection animation="fadeInRight" delay={600}>
            <div>
              <h3 className="text-2xl font-bold mb-8">Why Funchal?</h3>
              <div className="space-y-6">
                <AnimatedSection animation="fadeInUp" delay={800}>
                  <div className="p-6 bg-[#C5C5B5]/5 rounded-2xl">
                    <h4 className="font-bold mb-3 text-[#C5C5B5]">Year-Round Paradise</h4>
                    <p className="text-[#C5C5B5]/80">
                      Enjoy subtropical climate with temperatures between 16-25°C year-round. 
                      Perfect for outdoor activities and a healthy lifestyle.
                    </p>
                  </div>
                </AnimatedSection>
                
                <AnimatedSection animation="fadeInUp" delay={1000}>
                  <div className="p-6 bg-[#C5C5B5]/5 rounded-2xl">
                    <h4 className="font-bold mb-3 text-[#C5C5B5]">Digital Nomad Hub</h4>
                    <p className="text-[#C5C5B5]/80">
                      Growing community of remote workers, excellent internet infrastructure, 
                      and EU timezone convenience for global collaboration.
                    </p>
                  </div>
                </AnimatedSection>
                
                <AnimatedSection animation="fadeInUp" delay={1200}>
                  <div className="p-6 bg-[#C5C5B5]/5 rounded-2xl">
                    <h4 className="font-bold mb-3 text-[#C5C5B5]">Adventure & Culture</h4>
                    <p className="text-[#C5C5B5]/80">
                      From levada walks to wine tastings, surfing to historic exploration. 
                      Work-life balance has never been more inspiring.
                    </p>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </AnimatedSection>
        </div>
        
        {/* Quick Stats */}
        <AnimatedSection animation="fadeInUp" delay={1400}>
          <div className="bg-[#C5C5B5]/5 rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <AnimatedSection animation="scaleIn" delay={1600}>
                <div>
                  <div className="text-3xl font-bold text-[#C5C5B5] mb-2">25°C</div>
                  <div className="text-[#C5C5B5]/60 text-sm uppercase tracking-wide">Avg Temperature</div>
                </div>
              </AnimatedSection>
              <AnimatedSection animation="scaleIn" delay={1700}>
                <div>
                  <div className="text-3xl font-bold text-[#C5C5B5] mb-2">300+</div>
                  <div className="text-[#C5C5B5]/60 text-sm uppercase tracking-wide">Sunny Days</div>
                </div>
              </AnimatedSection>
              <AnimatedSection animation="scaleIn" delay={1800}>
                <div>
                  <div className="text-3xl font-bold text-[#C5C5B5] mb-2">5 min</div>
                  <div className="text-[#C5C5B5]/60 text-sm uppercase tracking-wide">To Ocean</div>
                </div>
              </AnimatedSection>
              <AnimatedSection animation="scaleIn" delay={1900}>
                <div>
                  <div className="text-3xl font-bold text-[#C5C5B5] mb-2">GMT</div>
                  <div className="text-[#C5C5B5]/60 text-sm uppercase tracking-wide">Time Zone</div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Location;