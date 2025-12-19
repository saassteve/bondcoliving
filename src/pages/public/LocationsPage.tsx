import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, Clock, CalendarDays, Building2, MapPin, Users, Wifi } from 'lucide-react';
import { buildingService, apartmentService } from '../../lib/services';
import type { Building, Apartment } from '../../lib/services/types';
import AnimatedSection from '../../components/AnimatedSection';

interface BuildingWithData extends Building {
  apartments: Apartment[];
  availableCount: number;
  featuredImage: string;
}

const LocationsPage: React.FC = () => {
  const [buildings, setBuildings] = useState<BuildingWithData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [buildingsData, apartmentsData] = await Promise.all([
          buildingService.getAll(),
          apartmentService.getAll(),
        ]);

        const buildingsWithData: BuildingWithData[] = buildingsData.map((building) => {
          const buildingApartments = apartmentsData.filter(
            (apt) => apt.building_id === building.id
          );
          const availableApartments = buildingApartments.filter(
            (apt) => apt.status === 'available'
          );

          const featuredImage = building.hero_image_url ||
            building.image_url ||
            (buildingApartments[0]?.image_url) ||
            'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800';

          return {
            ...building,
            apartments: buildingApartments,
            availableCount: availableApartments.length,
            featuredImage,
          };
        });

        setBuildings(buildingsWithData);
      } catch (error) {
        console.error('Error loading locations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E1F1E] flex items-center justify-center">
        <div className="text-[#C5C5B5] animate-pulse">Loading locations...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Our Locations | Bond Coliving Funchal, Madeira</title>
        <meta
          name="description"
          content="Explore Bond's three coliving locations in central Funchal, Madeira. Monthly stays and short-term accommodations for digital nomads."
        />
      </Helmet>

      <div className="min-h-screen bg-[#1E1F1E]">
        <div className="container py-8">
          <Link
            to="/"
            className="inline-flex items-center text-[#C5C5B5]/60 hover:text-[#C5C5B5] mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <AnimatedSection animation="fadeInUp">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Our Locations
              </h1>
              <p className="text-lg text-[#C5C5B5]/70 max-w-2xl mx-auto">
                Three buildings in central Funchal, all within walking distance. Choose the space that fits your style.
              </p>
            </div>
          </AnimatedSection>

          <div className="space-y-8 max-w-5xl mx-auto">
            {buildings.map((building, index) => {
              const isComingSoon = building.status === 'coming_soon';
              const isShortTerm = building.stay_type === 'short_term';
              const lowestPrice = building.apartments.length > 0
                ? Math.min(...building.apartments.map((a) => a.price))
                : null;

              return (
                <AnimatedSection
                  key={building.id}
                  animation="fadeInUp"
                  delay={100 + index * 100}
                >
                  <Link
                    to={`/location/${building.slug}`}
                    className="group block bg-[#C5C5B5]/5 rounded-2xl border border-[#C5C5B5]/10 overflow-hidden hover:border-[#C5C5B5]/30 transition-all"
                  >
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="aspect-[4/3] md:aspect-auto overflow-hidden relative">
                        <img
                          src={building.featuredImage}
                          alt={building.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:bg-gradient-to-r" />

                        <div className="absolute top-4 left-4 flex gap-2">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full backdrop-blur-md ${
                              isShortTerm
                                ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
                                : 'bg-green-500/30 text-green-200 border border-green-400/30'
                            }`}
                          >
                            {isShortTerm ? 'Short Stays' : 'Monthly'}
                          </span>
                          {isComingSoon && (
                            <span className="px-3 py-1 bg-amber-500/30 text-amber-200 text-xs font-medium rounded-full backdrop-blur-md border border-amber-400/30">
                              Coming Soon
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-6 md:p-8 flex flex-col justify-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-[#C5C5B5] transition-colors">
                          {building.name}
                        </h2>

                        {building.tagline && (
                          <p className="text-[#C5C5B5]/70 mb-4">{building.tagline}</p>
                        )}

                        <div className="flex items-center gap-2 text-[#C5C5B5]/60 text-sm mb-4">
                          <MapPin className="w-4 h-4" />
                          <span>{building.address}</span>
                        </div>

                        <div className="flex flex-wrap gap-3 mb-6">
                          <div className="flex items-center gap-2 text-sm text-[#C5C5B5]/70">
                            {isShortTerm ? (
                              <>
                                <Clock className="w-4 h-4" />
                                <span>From 2 nights</span>
                              </>
                            ) : (
                              <>
                                <CalendarDays className="w-4 h-4" />
                                <span>Min. 1 month</span>
                              </>
                            )}
                          </div>

                          {building.has_on_site_coworking && (
                            <div className="flex items-center gap-2 text-sm text-[#C5C5B5]/70">
                              <Wifi className="w-4 h-4" />
                              <span>Coworking on-site</span>
                            </div>
                          )}

                          {!isComingSoon && building.apartments.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-[#C5C5B5]/70">
                              <Building2 className="w-4 h-4" />
                              <span>{building.apartments.length} units</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-[#C5C5B5]/10">
                          {!isComingSoon && lowestPrice ? (
                            <div>
                              <span className="text-[#C5C5B5]/60 text-sm">From </span>
                              <span className="text-xl font-bold text-white">
                                {formatPrice(lowestPrice)}
                              </span>
                              <span className="text-[#C5C5B5]/60 text-sm">/mo</span>
                            </div>
                          ) : (
                            <span className="text-amber-400 text-sm font-medium">
                              Get notified when available
                            </span>
                          )}

                          <span className="text-[#C5C5B5] group-hover:text-white transition-colors flex items-center gap-2 font-medium">
                            {isComingSoon ? 'Learn more' : 'View location'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>

          <AnimatedSection animation="fadeInUp" delay={500}>
            <div className="text-center mt-16">
              <p className="text-[#C5C5B5]/50 text-sm mb-6">
                All buildings located in central Funchal &middot; 5-10 minute walk between locations
              </p>
              <Link
                to="/book"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] font-bold rounded-full hover:bg-white transition-colors"
              >
                Browse All Apartments
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </>
  );
};

export default LocationsPage;
