import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, RefreshCw, Sparkles } from 'lucide-react';
import { apartmentService, availabilityService, type Apartment } from '../../lib/supabase';
import { getIconComponent } from '../../lib/iconUtils';
import AnimatedSection from '../AnimatedSection';

type ApartmentWithExtras = Apartment & {
  image_url?: string;
  features?: { icon: string; label: string }[];
  available_from?: string | null;
};

const GBP_PER_EUR = 0.85; // keep in sync with your pricing util
const USD_PER_EUR = 1.05;

const formatMoney = (amount: number, currency: 'EUR' | 'GBP' | 'USD') =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);

const humanAvailability = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (d <= today) return 'Available now';
  return `Available ${d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
};

const AvailabilityBadge: React.FC<{ iso?: string | null }> = ({ iso }) => {
  const copy = humanAvailability(iso);
  if (!copy) return null;

  const soon = (() => {
    if (!iso) return false;
    const d = new Date(iso).getTime();
    const days = (d - Date.now()) / 86_400_000;
    return days <= 30;
  })();

  return (
    <div className="absolute top-3 right-3 z-10">
      <div
        className={[
          'px-3 py-1 rounded-full text-xs font-medium backdrop-blur border',
          soon ? 'bg-emerald-900/50 text-emerald-100 border-emerald-400/20' : 'bg-black/55 text-white border-white/10',
        ].join(' ')}
      >
        {copy}
      </div>
    </div>
  );
};

const SkeletonCard: React.FC = () => (
  <div className="flex-none snap-center w-80 md:w-[28rem] rounded-2xl overflow-hidden bg-[#1E1F1E] ring-1 ring-black/10">
    <div className="aspect-video bg-[#2A2B2A] animate-pulse" />
    <div className="p-5">
      <div className="h-6 w-48 bg-[#2A2B2A] rounded mb-3 animate-pulse" />
      <div className="h-4 w-24 bg-[#2A2B2A] rounded mb-5 animate-pulse" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-[#2A2B2A] rounded animate-pulse" />
        ))}
      </div>
      <div className="h-4 w-40 bg-[#2A2B2A] rounded animate-pulse" />
    </div>
  </div>
);

const PriceBlock: React.FC<{ eur: number }> = ({ eur }) => {
  const gbp = Math.round(eur * GBP_PER_EUR);
  const usd = Math.round(eur * USD_PER_EUR);
  return (
    <div className="text-right">
      <div className="text-lg md:text-xl font-bold text-[#C5C5B5]">{formatMoney(eur, 'EUR')}</div>
      <div className="text-xs text-[#C5C5B5]/60">
        {formatMoney(usd, 'USD')} • {formatMoney(gbp, 'GBP')}
      </div>
      <div className="text-xs text-[#C5C5B5]/60">per month</div>
    </div>
  );
};

const ApartmentPreview: React.FC = () => {
  const [apartments, setApartments] = useState<ApartmentWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'soonest' | 'priceAsc'>('soonest');
  const [lastFetch, setLastFetch] = useState<number>(0);

  const railRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const enrich = async (a: Apartment): Promise<ApartmentWithExtras> => {
    try {
      const [images, features, nextDate] = await Promise.all([
        apartmentService.getImages(a.id),
        apartmentService.getFeatures(a.id),
        availabilityService.getNextAvailableDate(a.id),
      ]);
      const featured = images.find((i: any) => i.is_featured);
      return {
        ...a,
        image_url: featured?.image_url || a.image_url,
        features,
        available_from: nextDate || a.available_from,
      };
    } catch (e) {
      console.error('Enrich failed', e);
      return { ...a, features: [] };
    }
  };

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const base = await apartmentService.getAll();
      const full = await Promise.all(base.map(enrich));
      setApartments(full);
      setLastFetch(Date.now());
    } catch (e) {
      console.error(e);
      setError('Could not load apartments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Refresh on tab visibility if stale for more than 60s
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetch > 60_000) {
        fetchAll();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [lastFetch, fetchAll]);

  const sorted = useMemo(() => {
    const arr = [...apartments];
    if (sort === 'priceAsc') return arr.sort((a, b) => a.price - b.price);
    return arr.sort((a, b) => {
      const ad = a.available_from ? new Date(a.available_from).getTime() : Infinity;
      const bd = b.available_from ? new Date(b.available_from).getTime() : Infinity;
      return ad - bd;
    });
  }, [apartments, sort]);

  // Scroll helpers
  const updateScrollState = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const eps = 2;
    setCanLeft(el.scrollLeft > eps);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - eps);

    // Active card: closest to rail centre
    const children = Array.from(el.children) as HTMLElement[];
    const railRect = el.getBoundingClientRect();
    const centre = railRect.left + railRect.width / 2;
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    children.forEach((node, i) => {
      const r = node.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      const d = Math.abs(mid - centre);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    setActiveIdx(bestIdx);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const onScroll = () => updateScrollState();
    const ro = new ResizeObserver(updateScrollState);
    el.addEventListener('scroll', onScroll, { passive: true });
    ro.observe(el);
    updateScrollState();
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [sorted, updateScrollState]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') scroll('left');
      if (e.key === 'ArrowRight') scroll('right');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    const el = railRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.9);
    el.scrollBy({ left: dir === 'left' ? -delta : delta, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section id="apartments-section" className="py-24 bg-[#C5C5B5]">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-sm uppercase tracking-[0.2em] text-[#1E1F1E]/60 font-medium mb-3">Your Space, Your Way</p>
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-[#1E1F1E] via-[#1E1F1E]/60 to-[#1E1F1E] bg-clip-text text-transparent">
                Private Apartments
              </span>
            </h2>
            <p className="mt-4 text-lg text-[#1E1F1E]/80">Loading apartments...</p>
          </div>

          <div className="relative">
            <div
              ref={railRef}
              id="apartments-scroll"
              className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`#apartments-scroll::-webkit-scrollbar{display:none}`}</style>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="apartments-section" className="py-24 bg-[#C5C5B5]">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-sm uppercase tracking-[0.2em] text-[#1E1F1E]/60 font-medium mb-4">Your Space, Your Way</p>
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-[#1E1F1E] via-[#1E1F1E]/60 to-[#1E1F1E] bg-clip-text text-transparent">
                Private Apartments
              </span>
            </h2>
            <p className="text-lg text-[#1E1F1E]/80">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="apartments-section" className="py-16 bg-[#C5C5B5]">
      <div className="container">
        <AnimatedSection animation="fadeInUp">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-sm uppercase tracking-[0.2em] text-[#1E1F1E]/60 font-medium mb-3">Your Space, Your Way</p>
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

        <AnimatedSection animation="fadeInUp" delay={120}>
          <div className="mb-5 md:mb-7 flex items-center justify-between gap-3">
            <div className="text-[#1E1F1E]/70 text-sm">
              {`${sorted.length} apartment${sorted.length !== 1 ? 's' : ''} available`}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[#1E1F1E]/70 text-sm" htmlFor="apt-sort">Sort</label>
              <select
                id="apt-sort"
                value={sort}
                onChange={e => setSort(e.target.value as 'soonest' | 'priceAsc')}
                className="text-sm bg-white/80 text-[#1E1F1E] border border-[#1E1F1E]/20 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#1E1F1E]/30"
              >
                <option value="soonest">Soonest availability</option>
                <option value="priceAsc">Price low to high</option>
              </select>

              <button
                onClick={fetchAll}
                aria-label="Refresh apartments"
                className="inline-flex items-center justify-center rounded-md border border-[#1E1F1E]/20 bg-white/80 text-[#1E1F1E] p-2 hover:bg-white"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fadeInUp" delay={220}>
          <div className="relative">
            {/* Edge fades */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-[#C5C5B5] to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-l from-[#C5C5B5] to-transparent" />

            {/* Rail */}
            <div
              ref={railRef}
              id="apartments-scroll"
              className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`#apartments-scroll::-webkit-scrollbar{display:none}`}</style>

              {sorted.map((a, i) => {
                const availCopy = humanAvailability(a.available_from);
                const active = i === activeIdx;

                return (
                  <Link
                    key={a.id}
                    to={`/room/${apartmentService.generateSlug(a.title)}`}
                    className="outline-none focus:ring-2 focus:ring-[#1E1F1E]/40 rounded-2xl"
                    aria-label={`View ${a.title}`}
                  >
                    <div
                      className={[
                        'flex-none snap-center w-80 md:w-[28rem] rounded-2xl overflow-hidden bg-[#1E1F1E] ring-1 transition-all',
                        active ? 'ring-[#C5C5B5]/30 scale-[1.02] opacity-100' : 'ring-white/5 opacity-95',
                      ].join(' ')}
                    >
                      <div className="relative aspect-video overflow-hidden group">
                        <AvailabilityBadge iso={a.available_from} />
                        <img
                          src={a.image_url}
                          alt={a.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/0 via-black/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute left-3 bottom-3">
                          <div className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#C5C5B5]/90 text-[#1E1F1E] shadow">
                            {formatMoney(a.price, 'EUR')} pm
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-lg md:text-xl font-bold text-[#C5C5B5]">{a.title}</h3>
                          <PriceBlock eur={a.price} />
                        </div>

                        <p className="text-[#C5C5B5]/80 text-sm leading-relaxed line-clamp-3 min-h-[3.5rem]">
                          {a.description}
                        </p>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                          {a.features?.slice(0, 4).map((f, idx) => {
                            const Icon = getIconComponent(f.icon);
                            return (
                              <div key={idx} className="flex items-center text-[#C5C5B5]/70">
                                <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="text-sm truncate">{f.label}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-sm text-[#C5C5B5]/70">{a.size}</span>
                          <span className="inline-flex items-center text-[#C5C5B5] text-xs md:text-sm uppercase tracking-wide group-hover:text-white">
                            View details
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </span>
                        </div>

                        {availCopy && (
                          <div className="mt-3 text-xs text-[#C5C5B5]/70 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> {availCopy}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* Teaser card */}
              <div className="flex-none snap-center w-80 md:w-[28rem] rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E1F1E]/40 to-[#1E1F1E]/20 ring-1 ring-[#1E1F1E]/20">
                <div className="aspect-video grid place-items-center relative">
                  <div className="text-6xl">🏗️</div>
                  <div className="absolute bottom-3 right-3 bg-[#1E1F1E]/80 text-[#C5C5B5] px-3 py-1 rounded-full text-xs border border-[#C5C5B5]/20">
                    New location 2026
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg md:text-xl font-bold text-[#1E1F1E] mb-1">Second building</h3>
                  <p className="text-[#1E1F1E]/70 text-sm leading-relaxed">
                    Three new premium apartments bringing the Bond experience to a second address in Funchal.
                  </p>
                  <div className="mt-4 text-sm text-[#1E1F1E]/70">Opening 2026</div>
                </div>
              </div>
            </div>

            {/* Arrows */}
            {canLeft && (
              <button
                onClick={() => scroll('left')}
                aria-label="Scroll apartments left"
                className="absolute -left-2 md:-left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 text-[#1E1F1E] p-2 shadow hover:bg-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {canRight && (
              <button
                onClick={() => scroll('right')}
                aria-label="Scroll apartments right"
                className="absolute -right-2 md:-right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 text-[#1E1F1E] p-2 shadow hover:bg-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fadeInUp" delay={320}>
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