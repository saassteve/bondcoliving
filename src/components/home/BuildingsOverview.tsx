import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Wifi, ArrowRight, Clock, CalendarDays } from 'lucide-react';
import { buildingService } from '../../lib/services';
import type { Building } from '../../lib/services/types';
import AnimatedSection from '../AnimatedSection';

const BuildingsOverview: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const data = await buildingService.getAll();
        setBuildings(data);
      } catch (error) {
        console.error('Error loading buildings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadBuildings();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-[#1E1F1E] to-[#2A2B2A]">
      <div className="container">
        <AnimatedSection animation="fadeInUp">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Three Buildings, One Community
            </h2>
            <p className="text-lg text-[#C5C5B5]/80 max-w-2xl mx-auto">
              All our locations are within walking distance in central Funchal, giving you flexibility and choice while staying connected to the Bond community.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {buildings.map((building, index) => {
            const isComingSoon = building.status === 'coming_soon';
            const isShortTerm = building.stay_type === 'short_term';

            return (
              <AnimatedSection
                key={building.id}
                animation="fadeInUp"
                delay={200 + index * 100}
              >
                <Link
                  to={`/location/${building.slug}`}
                  className="block bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-[#C5C5B5]/10 rounded-xl">
                      <Building2 className="w-6 h-6 text-[#C5C5B5]" />
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          isShortTerm
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-green-500/20 text-green-300 border border-green-500/30'
                        }`}
                      >
                        {isShortTerm ? 'Short Stays' : 'Monthly'}
                      </span>
                      {isComingSoon && (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-medium rounded-full border border-amber-500/30">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#C5C5B5] transition-colors">
                    {building.name}
                  </h3>

                  <div className="flex items-start gap-2 mb-4 text-[#C5C5B5]/70">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                    <p className="text-sm">{building.address}</p>
                  </div>

                  {building.description && (
                    <p className="text-[#C5C5B5]/60 text-sm mb-4 line-clamp-2">
                      {building.description}
                    </p>
                  )}

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#C5C5B5]/80 text-sm">
                      {building.has_on_site_coworking ? (
                        <>
                          <Wifi className="w-4 h-4" />
                          <span>Coworking on-site</span>
                        </>
                      ) : isShortTerm ? (
                        <>
                          <Clock className="w-4 h-4" />
                          <span>From 2 nights</span>
                        </>
                      ) : (
                        <>
                          <CalendarDays className="w-4 h-4" />
                          <span>Coworking access</span>
                        </>
                      )}
                    </div>
                    <span className="text-[#C5C5B5] group-hover:text-white transition-colors flex items-center gap-1 text-sm font-medium">
                      View
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </AnimatedSection>
            );
          })}
        </div>

        <AnimatedSection animation="fadeInUp" delay={600}>
          <div className="text-center mt-12">
            <p className="text-[#C5C5B5]/60 text-sm">
              All buildings located in central Funchal &middot; 5-10 minute walk between locations
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default BuildingsOverview;
