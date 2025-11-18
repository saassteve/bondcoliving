// components/ApartmentPreview.tsx
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

const GBP_PER_EUR = 0.85;
const USD_PER_EUR = 1.05;

const formatMoney = (amount: number, currency: 'EUR' | 'GBP' | 'USD') =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

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
    <div className="absolute top-4 right-4 z-20">
      <div
        className={[
          'px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border shadow-lg',
          soon 
            ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' 
            : 'bg-black/40 text-white border-white/10',
        ].join(' ')}
      >
        {copy}
      </div>
    </div>
  );
};

const SkeletonCard: React.FC = () => (
  <div className="flex-none snap-center w-80 md:w-[400px] aspect-[4/5] rounded-3xl overflow-hidden bg-[#2A2B2A] ring-1 ring-white/5 relative">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
    <div className="absolute bottom-0 left-0 right-0 p-6">
      <div className="h-8 w-48 bg-white/10 rounded mb-4 animate-pulse" />
      <div className="flex gap-2 mb-6">
        <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
        <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="h-10 w-full bg-white/5 rounded animate-pulse" />
    </div>
  </div>
);

const ApartmentPreview: React.FC = () => {
  const [apartments, setApartments] = useState<ApartmentWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'soonest' | 'priceAsc'>('soonest');
  const [lastFetch, setLastFetch] = useState<number>(0);

  const railRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

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

  // Refresh on tab visibility
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

  const scroll = (dir: 'left' | 'right') => {
    const el = railRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.9);
    el.scrollBy({ left: dir === 'left' ? -delta : delta, behavior: 'smooth' });
  };

  // Loading State
  if (loading) {
    return (
      <section id="apartments-section" className="py-24 bg-[#1E1F1E]">
        <div className="container overflow-hidden">
          <div className="mb-12 pl-4 border-l-2 border-[#C5C5B5]/20">
             <h2 className="text-4xl md:text-5xl font-bold text-white">Loading Spaces...</h2>
          </div>
          <div className="flex gap-6 overflow-hidden px-1">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </section>
    );
  }

  // Error State
  if (error) {
    return (
      <section id="apartments-section" className="py-24 bg-[#1E1F1E] text-center">
        <div className="container">
          <h2 className="text-3xl text-white mb-4">Something went wrong</h2>
          <p className="text-[#C5C5B5] mb-6">{error}</p>
          <button onClick={fetchAll} className="px-6 py-2 bg-[#C5C5B5] text-[#1E1F1E] rounded-full">
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="apartments-section" className="py-24 bg-[#1E1F1E] relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C5C5B5]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container relative z-10">
        
        {/* Section Header & Controls */}
        <AnimatedSection animation="fadeInUp">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-[#C5C5B5]/60 font-medium mb-4">
                Your Space, Your Way
              </p>
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                Private Apartments
              </h2>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-1.5 rounded-2xl border border-white/10">
              <div className="relative">
                <select
                  id="apt-sort"
                  value={sort}
                  onChange={e => setSort(e.target.value as 'soonest' | 'priceAsc')}
                  className="appearance-none bg-transparent text-[#C5C5B5] text-sm pl-4 pr-8 py-2 rounded-xl focus:outline-none focus:bg-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <option value="soonest" className="bg-[#1E1F1E]">Soonest availability</option>
                  <option value="priceAsc" className="bg-[#1E1F1E]">Price: Low to High</option>
                </select>
                {/* Custom chevron for select */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#C5C5B5]/50">
                   <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>

              <div className="w-px h-6 bg-white/10" />

              <button
                onClick={fetchAll}
                className="p-2 text-[#C5C5B5] hover:text-white hover:bg-white/10 rounded-xl transition-all"
                title="Refresh list"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </AnimatedSection>

        {/* Horizontal Scroll Rail */}
        <AnimatedSection animation="fadeInUp" delay={200}>
          <div className="relative -mx-4 md:-mx-0 group/rail">
            
            {/* Navigation Buttons - Visible on hover of rail area */}
            {canLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-[#C5C5B5] text-[#1E1F1E] flex items-center justify-center shadow-lg shadow-black/20 hover:scale-110 transition-all opacity-0 group-hover/rail:opacity-100 translate-x-[-10px] group-hover/rail:translate-x-0 duration-300"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            
            {canRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-4 top-1/2 -translate