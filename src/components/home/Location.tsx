// components/Location.tsx
import React from 'react';
import { 
  Coffee, Palmtree, Bus, ShoppingBag, Utensils, 
  Building, Waves, Mountain, MapPin, Clock, 
  ThermometerSun, Sun, Globe, Navigation 
} from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

const nearbyHighlights = [
  { icon: Coffee, title: 'Cafes', description: '2 min walk', distance: '150m' },
  { icon: Utensils, title: 'Restaurants', description: '5 min walk', distance: '400m' },
  { icon: Waves, title: 'Ocean & Promenade', description: '5 min walk', distance: '450m' },
  { icon: Palmtree, title: 'City Gardens', description: '6 min walk', distance: '500m' },
  { icon: Bus, title: 'Bus Station', description: '7 min walk', distance: '600m' },
  { icon: ShoppingBag, title: 'Shopping', description: '8 min walk', distance: '650m' },
  { icon: Building, title: 'City Center', description: '10 min walk', distance: '800m' },
  { icon: Mountain, title: 'Cable Car', description: '12 min walk', distance: '1km' },
];

const Location: React.FC = () => {
  return (
    <section className="py-24 bg-[#1E1F1E] relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-[#C5C5B5]/5 to-transparent rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2" />

      <div className="container relative z-10">
        
        {/* Header */}
        <AnimatedSection animation="fadeInUp">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-[#C5C5B5] mb-4">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Prime Location</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">
                The Heart of <br />
                <span className="text-[#C5C5B5]">Funchal.</span>
              </h2>
            </div>
            <p className="text-lg text-white/60 max-w-md leading-relaxed">
              Central Funchal puts you minutes from the ocean, cafes, and city amenities. Work productively while living in paradise.
            </p>
          </div>
        </AnimatedSection>

        {/* Map & Stats Dashboard */}
        <AnimatedSection animation="scaleIn" delay={200} className="mb-24">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#2A2B2A] shadow-2xl group">
            
            {/* Map Image */}
            <div className="aspect-[16/9] md:aspect-[21/9] relative">
              <img 
                src="https://ucarecdn.com/91ae305f-9593-43fa-91e3-54d21cb31b81/bondmap.png"
                alt="Map of Funchal showing Bond location"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[2s]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E1F1E] via-transparent to-transparent opacity-90" />
              
              {/* Center Map Marker Visualization */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="relative">
                  <div className="w-4 h-4 bg-[#C5C5B5] rounded-full animate-ping absolute inset-0" />
                  <div className="w-4 h-4 bg-[#C5C5B5] rounded-full relative shadow-[0_0_20px_rgba(197,197,181,0.5)]" />
                </div>
                <div className="mt-4 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-xs font-bold text-white uppercase tracking-widest">
                  You are here
                </div>
              </div>
            </div>

            {/* HUD Stats Overlay (Floating Bar) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#C5C5B5]">
                    <ThermometerSun className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">25°C</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider">Avg Temp</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#C5C5B5]">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">300+</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider">Sunny Days</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#C5C5B5]">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">5 min</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider">To Ocean</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#C5C5B5]">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">GMT</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider">Time Zone</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Split Layout: Highlights vs Context */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left: Walking Distances */}
          <div className="lg:col-span-7">
            <AnimatedSection animation="fadeInUp" delay={300}>
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <Clock className="w-6 h-6 text-[#C5C5B5]" />
                Walking Distance
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nearbyHighlights.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={idx}
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-[#C5C5B5]/10 hover:border-[#C5C5B5]/20 transition-all duration-300"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#1E1F1E] flex items-center justify-center text-[#C5C5B5] group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="text-white font-medium truncate">{item.title}</h4>
                          <span className="text-xs text-[#C5C5B5] font-mono">{item.distance}</span>
                        </div>
                        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#C5C5B5] h-full rounded-full opacity-50" 
                            style={{ width: `${Math.max(10, 100 - (idx * 10))}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AnimatedSection>
          </div>

          {/* Right: Why Funchal Cards */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              <AnimatedSection animation="fadeInRight" delay={400}>
                <h3 className="text-2xl font-bold text-white mb-8">Why Funchal?</h3>
                
                {/* Card 1 */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-[#C5C5B5]/30 transition-colors">
                  <h4 className="text-lg font-bold text-[#C5C5B5] mb-2">Year-Round Paradise</h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Enjoy subtropical climate with temperatures between 16-25°C year-round. Perfect for outdoor activities and a healthy lifestyle.
                  </p>
                </div>

                {/* Card 2 */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-[#C5C5B5]/30 transition-colors">
                  <h4 className="text-lg font-bold text-[#C5C5B5] mb-2">Digital Nomad Hub</h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Growing community of remote workers, excellent internet infrastructure, and EU timezone convenience for global collaboration.
                  </p>
                </div>

                {/* Card 3 */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-[#C5C5B5]/30 transition-colors">
                  <h4 className="text-lg font-bold text-[#C5C5B5] mb-2">Adventure & Culture</h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    From levada walks to wine tastings, surfing to historic exploration. Work-life balance has never been more inspiring.
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

export default Location;