import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { apartmentService, availabilityService, type Apartment } from '../../lib/supabase';
import { getIconComponent } from '../../lib/iconUtils';
import AnimatedSection from '../AnimatedSection';

type ApartmentWithExtras = Apartment & {
  image_url?: string;
  features?: { icon: string; label: string }[];
  available_from?: string | null;
};

const GBP_PER_EUR = 0.85; // update if you wish to fetch live FX centrally
const USD_PER_EUR = 1.05;

const formatMoney = (amount: number, currency: 'EUR' | 'GBP' | 'USD') =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);

const formatAvail = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  // strip time
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (d <= today) return 'Available now';
  return `Available ${d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
};

const SkeletonCard: React.FC = () => (
  <div className="flex-none snap-start w-80 md:w-[28rem] bg-[#1E1F1E] rounded-xl overflow-hidden animate-pulse">
    <div className="aspect-video bg-[#2A2B2A]" />
    <div className="p-4 md:p-6">
      <div className="h-5 w-40 bg-[#2A2B2A] rounded mb-4" />
      <div className="h-4 w-24 bg-[#2A2B2A] rounded mb-6" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="h-4 bg-[#2A2B2A] rounded" />
        <div className="h-4 bg-[#2A2B2A] rounded" />
        <div className="h-4 bg-[#2A2B2A] rounded" />
        <div className="h-4 bg-[#2A2B2A] rounded" />
      </div>
      <div className="h-4 bg-[#2A2B2A] rounded w-28" />
    </div>
  </div>
);

const ApartmentPreview: React.FC = () => {
  const [apartments, setApartments] = useState<ApartmentWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [sort, setSort] = useState<'soonest' | 'priceAsc'>('soonest');

  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const enrich = async (apartment: Apartment): Promise<ApartmentWithExtras> => {
    try {
      const [images, features, nextAvailableDate] = await Promise.all([
        apartmentService.getImages(apartment.id),
        apartmentService.getFeatures(apartment.id),
        availabilityService.getNextAvailableDate(apartment.id),
      ]);
      const featuredImage = images.find(img => img.is_featured);
      return {
        ...apartment,
        image_url: featuredImage?.image_url || apartment.image_url,
        features,
        available_from: nextAvailableDate || apartment.available_from,
      };
    } catch (e) {
      console.error(`Error enriching apartment ${apartment.id}`, e);
      return { ...apartment, features: [] };
    }
  };

  const fetchApartments = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const base = await apartmentService.getAll();
      const withExtras = await Promise.all(base.map(enrich));
      setApartments(withExtras);
      setLastFetch(Date.now());
    } catch (e) {
      console.error(e);
      setError('Failed to load apartments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  // Revalidate on tab focus instead of polling every 30s
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetch > 60_000) {
        fetchApartments();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [lastFetch, fetchApartments]);

  // Scroll controls state
  const updateScrollButtons = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const epsilon = 2;
    setCanScrollLeft(el.scrollLeft > epsilon);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - epsilon);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    updateScrollButtons();
    const onScroll = () => updateScrollButtons();
    const ro = new ResizeObserver(updateScrollButtons);
    el.addEventListener('scroll', onScroll, { passive: true });
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [apartments, updateScrollButtons]);

  const scroll = (dir: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.85);
    el.scrollBy({ left: dir === 'left' ? -delta : delta, behavior: 'smooth' });
  };

  const sorted = [...apartments].sort((a, b) => {
    if (sort === 'priceAsc') return a.price - b.price;
    // soonest: push nulls to end, then ascending date
    const ad = a.available_from ? new Date(a.available_from).getTime() : Number.POSITIVE_INFINITY;
    const bd = b.available_from ? new Date(b.available_from).getTime() : Number.POSITIVE_INFINITY;
    return ad - bd;
  });

  return (
    <section id="apartments-section" className="py-16 bg-[#C5C5B5]">
      <div className="container">
        <AnimatedSection animation="fadeInUp">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-sm uppercase tracking-[0.2em] text-[#1E1F1E]/60 font-medium mb-3">
              Your Space, Your Way
            </p>
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-[#1E1F1E] via-[#1E1F1E]/60 to-[#1E1F1E] bg-clip-text text-transparent">
                Private Apartments
              </span>
            </h2>
            <p className="mt-4 text-lg text-[#1E1F1E]/80">
              Choose a private unit designed for deep work and easy living in the centre of Funchal.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fadeInUp" delay={150}>
          <div className="mb-4 md:mb-6 flex items-center justify-between gap-3">
            <div className="text-[#1E1F1E]/70 text-sm">
              {loading
                ? 'Loading apartments...'
                : `${sorted.length} apartment${sorted.length !== 1 ? 's' : ''} available`}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[#1E1F1E]/70 text-sm" htmlFor="apt-sort">Sort</label>
              <select
                id="apt-sort"
                value={sort}
                onChange={e => setSort(e.target.value as 'soonest' | 'priceAsc')}
                className="text-sm bg-white/70 text-[#1E1F1E] border border-[#1E1F1E]/20 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#1E1F1E]/30"
              >
                <option value="soonest">Soonest availability</option>
                <option value="priceAsc">Price low to high</option>
              </select>

              <button
                onClick={fetchApartments}
                aria-label="Refresh apartments"
                className="ml-1 inline-flex items-center justify-center rounded-md border border-[#1E1F1E]/20 bg-white/70 text-[#1E1F1E] p-2 hover:bg-white"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fadeInUp" delay={250}>
          <div className="relative">
            {/* Scroll container */}
            <div
              ref={containerRef}
              id="apartments-scroll"
              className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 px-1 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* hide webkit scrollbar */}
              <style>{`#apartments-scroll::-webkit-scrollbar{display:none}`}</style>

              {loading && (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              )}

              {!loading && error && (
                <div className="text-[#1E1F1E]/80 p-6">
                  {error}
                </div>
              )}

              {!loading && !error && sorted.map(apartment => {
                const avail = formatAvail(apartment.available_from);
                const eur = formatMoney(apartment.price, 'EUR');
                const gbp = formatMoney(Math.round(apartment.price * GBP_PER_EUR), 'GBP');
                const usd = formatMoney(Math.round(apartment.price * USD_PER_EUR), 'USD');

                return (
                  <Link
                    key={apartment.id}
                    to={`/room/${apartmentService.generateSlug(apartment.title)}`}
                    className="flex-none snap-start w-80 md:w-[28rem] bg-[#1E1F1E] rounded-xl overflow-hidden group ring-1 ring-transparent hover:ring-[#C5C5B5]/30 transition-all"
                    aria-label={`View ${apartment.title}`}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      {avail && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className="bg-black/55 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                            {avail}
                          </div>
                        </div>
                      )}
                      <img
                        src={apartment.image_url}
                        alt={apartment.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    <div className="p-4 md:p-6">
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <h3 className="text-lg md:text-xl font-bold text-[#C5C5B5]">
                          {apartment.title}
                        </h3>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-[#C5C5B5]">{eur}</div>
                          <div className="text-xs text-[#C5C5B5]/60">{usd} • {gbp}</div>
                          <div className="text-xs text-[#C5C5B5]/60">per month</div>
                        </div>
                      </div>

                      <p className="text-[#C5C5B5]/80 text-sm leading-relaxed line-clamp-3 min-h-[3.5rem]">
                        {apartment.description}
                      </p>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                        {apartment.features?.slice(0, 4).map((feature, idx) => {
                          const Icon = getIconComponent(feature.icon);
                          return (
                            <div key={idx} className="flex items-center text-[#C5C5B5]/70">
                              <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="text-sm truncate">{feature.label}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-[#C5C5B5]/70">{apartment.size}</span>
                        <span className="inline-flex items-center text-[#C5C5B5] text-xs md:text-sm uppercase tracking-wide group-hover:text-white">
                          View details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* Teaser card stays at the end */}
              {!loading && !error && (
                <div className="flex-none snap-start w-80 md:w-[28rem] bg-gradient-to-br from-[#1E1F1E]/40 to-[#1E1F1E]/20 rounded-xl overflow-hidden ring-1 ring-[#1E1F1E]/20">
                  <div className="aspect-video bg-[#C5C5B5]/10 grid place-items-center relative">
                    <div className="text-6xl">🏗️</div>
                    <div className="absolute bottom-3 right-3 bg-[#1E1F1E]/80 text-[#C5C5B5] px-3 py-1 rounded-full text-xs border border-[#C5C5B5]/20">
                      New location 2026
                    </div>
                  </div>
                  <div className="p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-[#1E1F1E] mb-2">Second building</h3>
                    <p className="text-[#1E1F1E]/70 text-sm leading-relaxed">
                      Three new premium apartments bringing the Bond experience to a second address in Funchal.
                    </p>
                    <div className="mt-4 text-sm text-[#1E1F1E]/70">Opening 2026</div>
                  </div>
                </div>
              )}
            </div>

            {/* Edge fade for scroll cue */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 md:w-10 bg-gradient-to-r from-[#C5C5B5] to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 md:w-10 bg-gradient-to-l from-[#C5C5B5] to-transparent" />

            {/* Nav arrows */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                aria-label="Scroll apartments left"
                className="absolute -left-2 md:-left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 text-[#1E1F1E] p-2 shadow hover:bg-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                aria-label="Scroll apartments right"
                className="absolute -right-2 md:-right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 text-[#1E1F1E] p-2 shadow hover:bg-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fadeInUp" delay={350}>
          <div className="text-center mt-8 md:mt-12">
            <Link
              to="/apply"
              className="inline-flex items-center text-[#1E1F1E] hover:text-[#1E1F1E]/80 font-medium text-base md:text-lg"
            >
              Ready to join our community?
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ApartmentPreview;