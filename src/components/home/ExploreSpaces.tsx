import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';
import { buildingService, apartmentService } from '../../lib/services';
import type { Building, Apartment } from '../../lib/services/types';
import AnimatedSection from '../AnimatedSection';

interface BuildingWithCount extends Building {
  apartmentCount: number;
  availableCount: number;
  firstApartmentImage: string | null;
}

const ExploreSpaces: React.FC = () => {
  const [buildings, setBuildings] = useState<BuildingWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [buildingsData, apartmentsData] = await Promise.all([
          buildingService.getAll(),
          apartmentService.getAll(),
        ]);

        const buildingsWithCounts: BuildingWithCount[] = buildingsData.map((building) => {
          const buildingApartments = apartmentsData.filter(
            (apt) => apt.building_id === building.id
          );
          const availableApartments = buildingApartments.filter(
            (apt) => apt.status === 'available'
          );
          const firstApartmentImage = buildingApartments.length > 0
            ? buildingApartments[0].image_url
            : null;

          return {
            ...building,
            apartmentCount: buildingApartments.length,
            availableCount: availableApartments.length,
            firstApartmentImage,
          };
        });

        setBuildings(buildingsWithCounts);
      } catch (error) {
        console.error('Error loading buildings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return null;
  }

  const placeholderImages: Record<string, string> = {
    carreira: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    sao_joao: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800',
    pretas: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800',
  };

  return (
    <section className="py-20 bg-[#1E1F1E]">
      <div className="container">
        <AnimatedSection animation="fadeInUp">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Find Your Space
            </h2>
            <p className="text-lg text-[#C5C5B5]/70 max-w-2xl mx-auto">
              Three buildings in central Funchal. Choose your adventure.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {buildings.map((building, index) => {
            const isComingSoon = building.status === 'coming_soon';
            const imageUrl = building.hero_image_url || building.image_url || building.firstApartmentImage || placeholderImages[building.slug] || placeholderImages.carreira;

            return (
              <AnimatedSection
                key={building.id}
                animation="fadeInUp"
                delay={200 + index * 100}
              >
                <Link
                  to={`/location/${building.slug}`}
                  className="group block relative overflow-hidden rounded-2xl bg-[#C5C5B5]/5 border border-[#C5C5B5]/10 hover:border-[#C5C5B5]/30 transition-all h-full"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={imageUrl}
                      alt={building.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="absolute top-4 left-4 flex gap-2">
                      {isComingSoon ? (
                        <span className="px-3 py-1 bg-amber-500/30 text-amber-200 text-xs font-medium rounded-full backdrop-blur-md border border-amber-400/30">
                          Coming Soon
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-500/30 text-green-200 text-xs font-medium rounded-full backdrop-blur-md border border-green-400/30">
                          Available
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {building.name}
                      </h3>
                      {building.tagline && (
                        <p className="text-sm text-white/70 line-clamp-1">
                          {building.tagline}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      {!isComingSoon && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="w-4 h-4 text-[#C5C5B5]/60" />
                          <span className="text-[#C5C5B5]">
                            {building.availableCount > 0
                              ? `${building.availableCount} available`
                              : 'Check availability'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#C5C5B5] group-hover:text-white transition-colors font-medium flex items-center gap-2">
                        {isComingSoon ? 'Get notified' : 'Explore'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>

                      {building.has_on_site_coworking && (
                        <span className="text-xs text-[#C5C5B5]/50 border border-[#C5C5B5]/20 px-2 py-1 rounded-full">
                          Coworking Hub
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            );
          })}
        </div>

        <AnimatedSection animation="fadeInUp" delay={600}>
          <div className="text-center mt-12">
            <p className="text-[#C5C5B5]/50 text-sm mb-6">
              All buildings located in central Funchal &middot; 5-10 minute walk between locations
            </p>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] font-bold rounded-full hover:bg-white transition-colors"
            >
              Browse All Apartments
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ExploreSpaces;
