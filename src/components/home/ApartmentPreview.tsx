import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { apartmentService, availabilityService, type Apartment } from '../../lib/supabase';
import { getIconComponent } from '../../lib/iconUtils';
import AnimatedSection from '../AnimatedSection';

const ApartmentPreview: React.FC = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const fetchApartments = useCallback(async () => {
    try {
      setLoading(true);
      const apartments = await apartmentService.getAll();

      const apartmentsWithImages = await Promise.all(
        apartments.map(async (apartment) => {
          try {
            const [images, features, nextAvailableDate] = await Promise.all([
              apartmentService.getImages(apartment.id),
              apartmentService.getFeatures(apartment.id),
              availabilityService.getNextAvailableDate(apartment.id)
            ]);

            const featuredImage = images.find(img => img.is_featured);

            return {
              ...apartment,
              image_url: featuredImage?.image_url || apartment.image_url,
              features,
              available_from: nextAvailableDate || apartment.available_from
            };
          } catch (error) {
            console.error(`Error fetching data for apartment ${apartment.id}:`, error);
            return {
              ...apartment,
              features: []
            };
          }
        })
      );

      setApartments(apartmentsWithImages);
      setLastFetch(Date.now());
    } catch (err) {
      setError('Failed to load apartments');
      console.error('Error fetching apartments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);
  
  // Refresh data every 30 seconds to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastFetch > 30000) { // 30 seconds
        fetchApartments();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [lastFetch, fetchApartments]);

  const updateScrollButtons = (container: HTMLElement) => {
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    setScrollPosition(scrollLeft);
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('apartments-scroll');
    if (!container) return;

    const cardWidth = 400; // Approximate card width + gap
    const scrollAmount = cardWidth * 2; // Scroll 2 cards at a time
    
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const container = document.getElementById('apartments-scroll');
    if (!container) return;

    const handleScroll = () => updateScrollButtons(container);
    const handleResize = () => updateScrollButtons(container);

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // Initial check
    updateScrollButtons(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [apartments]);

  if (loading) {
    return (
      <section id="apartments-section" className="py-24 bg-[#C5C5B5]">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-[#1E1F1E]/60 font-medium mb-4">
                Your Space, Your Way
              </p>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-[#1E1F1E] via-[#1E1F1E]/60 to-[#1E1F1E] bg-clip-text text-transparent">
                  Private Apartments
                </span>
              </h2>
            </div>
            <p className="text-xl text-[#1E1F1E]/80">Loading apartments...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="apartments-section" className="py-24 bg-[#C5C5B5]">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-[#1E1F1E]/60 font-medium mb-4">
                Your Space, Your Way
              </p>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-[#1E1F1E] via-[#1E1F1E]/60 to-[#1E1F1E] bg-clip-text text-transparent">
                  Private Apartments
                </span>
              </h2>
            </div>
            <p className="text-xl text-[#1E1F1E]/80">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="apartments-section" className="py-24 bg-[#C5C5B5]">
      <div className="container">
        <AnimatedSection animation="fadeInUp">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-[#1E1F1E]/60 font-medium mb-4">
                Your Space, Your Way
              </p>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-[#1E1F1E] via-[#1E1F1E]/60 to-[#1E1F1E] bg-clip-text text-transparent">
                  Private Apartments
                </span>
              </h2>
            </div>
            <p className="text-xl text-[#1E1F1E]/80">
              Choose from our selection of premium apartments designed specifically for digital nomads. Each space includes enterprise-grade WiFi, all utilities, and everything you need for productive remote work in central Funchal.
            </p>
          </div>
        </AnimatedSection>

        {/* Scroll Controls */}
        <AnimatedSection animation="fadeInUp" delay={200}>
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <div className="flex items-center gap-4">
              <span className="text-[#1E1F1E]/60 text-xs md:text-sm">
                {apartments.length} apartment{apartments.length !== 1 ? 's' : ''} available
              </span>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`p-1.5 md:p-2 rounded-full border-2 transition-all ${
                  canScrollLeft 
                    ? 'border-[#1E1F1E] text-[#1E1F1E] hover:bg-[#1E1F1E] hover:text-[#C5C5B5]' 
                    : 'border-[#1E1F1E]/20 text-[#1E1F1E]/20 cursor-not-allowed'
                }`}
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`p-1.5 md:p-2 rounded-full border-2 transition-all ${
                  canScrollRight 
                    ? 'border-[#1E1F1E] text-[#1E1F1E] hover:bg-[#1E1F1E] hover:text-[#C5C5B5]' 
                    : 'border-[#1E1F1E]/20 text-[#1E1F1E]/20 cursor-not-allowed'
                }`}
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </AnimatedSection>

        {/* Horizontal Scroll Container */}
        <AnimatedSection animation="fadeInUp" delay={400}>
          <div className="relative">
            <div 
              id="apartments-scroll"
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 px-1"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitScrollbar: { display: 'none' }
              }}
            >
              {apartments.map((apartment) => (
                <Link
                  key={apartment.id}
                  to={`/room/${apartmentService.generateSlug(apartment.title)}`}
                  className="flex-none w-80 md:w-96 bg-[#1E1F1E] group card hover:ring-2 hover:ring-[#C5C5B5]/20 transition-all hover:transform hover:-translate-y-1 shadow-lg apartment-card"
                >
                  <div className="aspect-video overflow-hidden">
                    {/* Availability Pill */}
                    {apartment.available_from && (
                      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                          Available {new Date(apartment.available_from).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                    )}
                    <img 
                      src={apartment.image_url} 
                      alt={`${apartment.title} - Premium coliving apartment in central Funchal, Madeira with ${apartment.size} and capacity for ${apartment.capacity}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 md:p-6 card-content">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg md:text-xl font-bold text-[#C5C5B5]">{apartment.title}</h3>
                      <div className="text-right">
                        <div className="text-lg md:text-xl font-bold text-[#C5C5B5]">€{apartment.price.toLocaleString()}</div>
                        <div className="text-xs text-[#C5C5B5]/50">
                          ${Math.round(apartment.price * 1.05).toLocaleString()} • £{Math.round(apartment.price * 0.85).toLocaleString()}
                        </div>
                        <div className="text-sm text-[#C5C5B5]/60">per month</div>
                      </div>
                    </div>
                    
                    {/* Fixed height description container */}
                    <div className="h-16 mb-4">
                      <p className="text-[#C5C5B5]/80 text-sm leading-relaxed line-clamp-3">{apartment.description}</p>
                    </div>
                    
                    {/* Fixed height features container */}
                    <div className="h-16 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-4">
                      {apartment.features?.slice(0, 4).map((feature, index) => {
                        const Icon = getIconComponent(feature.icon);
                        return (
                          <div key={index} className="flex items-center text-[#C5C5B5]/60">
                            <Icon className="w-3 h-3 md:w-4 md:h-4 mr-2 flex-shrink-0" />
                            <span className="text-sm truncate">{feature.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Fixed position for view details button */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-sm text-[#C5C5B5]/60">{apartment.size}</span>
                      </div>
                      <span className="inline-flex items-center text-[#C5C5B5] text-xs md:text-sm uppercase tracking-wide group-hover:text-white transition-colors">
                        View Details
                        <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Coming Soon Teaser Card */}
              <div className="flex-none w-80 md:w-96 bg-gradient-to-br from-[#1E1F1E]/40 to-[#1E1F1E]/20 backdrop-blur-sm group card border-2 border-dashed border-[#1E1F1E]/30 hover:border-[#1E1F1E]/60 transition-all shadow-lg">
                <div className="aspect-video overflow-hidden bg-gradient-to-br from-[#C5C5B5]/10 to-[#C5C5B5]/5 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjMUUxRjFFIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1vcGFjaXR5PSIuMSIvPjwvZz48L3N2Zz4=')] opacity-50"></div>
                  <div className="relative z-10 text-center">
                    <div className="text-6xl mb-2">🏗️</div>
                    <div className="bg-[#1E1F1E]/80 backdrop-blur-sm text-[#C5C5B5] px-4 py-2 rounded-full text-sm font-bold border border-[#C5C5B5]/20">
                      New Location Coming 2026
                    </div>
                  </div>
                </div>
                <div className="p-4 md:p-6 card-content">
                  <div className="mb-4">
                    <h3 className="text-lg md:text-xl font-bold text-[#1E1F1E] mb-2">Second Building</h3>
                    <div className="inline-flex items-center gap-2 bg-[#1E1F1E]/10 px-3 py-1 rounded-full">
                      <span className="text-xs font-semibold text-[#1E1F1E]">3 New Apartments</span>
                      <span className="text-xs text-[#1E1F1E]/60">•</span>
                      <span className="text-xs text-[#1E1F1E]/60">2026</span>
                    </div>
                  </div>

                  <div className="h-16 mb-4">
                    <p className="text-[#1E1F1E]/70 text-sm leading-relaxed">
                      We're expanding! Our new building will feature 3 additional premium apartments, bringing the same quality and community vibe to a second location in Funchal.
                    </p>
                  </div>

                  <div className="h-16 space-y-2 mb-4">
                    <div className="flex items-center text-[#1E1F1E]/60">
                      <span className="text-2xl mr-3">✨</span>
                      <span className="text-sm">Same premium standards</span>
                    </div>
                    <div className="flex items-center text-[#1E1F1E]/60">
                      <span className="text-2xl mr-3">🌍</span>
                      <span className="text-sm">New location in Funchal</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-sm text-[#1E1F1E]/60 font-medium">Opening 2026</span>
                    </div>
                    <span className="inline-flex items-center text-[#1E1F1E] text-xs md:text-sm uppercase tracking-wide opacity-60">
                      Stay Tuned
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Gradient Overlays for Visual Cues */}
            <div className="absolute left-0 top-0 bottom-0 w-4 md:w-8 bg-gradient-to-r from-[#C5C5B5] to-transparent pointer-events-none opacity-50"></div>
            <div className="absolute right-0 top-0 bottom-0 w-4 md:w-8 bg-gradient-to-l from-[#C5C5B5] to-transparent pointer-events-none opacity-50"></div>
          </div>
        </AnimatedSection>

        {/* View All Link */}
        <AnimatedSection animation="fadeInUp" delay={600}>
          <div className="text-center mt-8 md:mt-12">
            <Link 
              to="/apply" 
              className="inline-flex items-center text-[#1E1F1E] hover:text-[#1E1F1E]/80 transition-colors font-medium text-base md:text-lg"
            >
              Ready to join our community?
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ApartmentPreview;