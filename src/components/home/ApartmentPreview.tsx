import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, RefreshCw, Sparkles, GripHorizontal } from 'lucide-react';
import { apartmentService, availabilityService, type Apartment } from '../../lib/supabase';
import AnimatedSection from '../AnimatedSection';
import OptimizedImage from '../OptimizedImage';

type ApartmentWithExtras = Apartment & {
  image_url?: string;
  features?: { icon: string; label: string }[];
  available_from?: string | null;
};

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
          'px-3 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-xl border shadow-xl transition-all duration-500',
          soon 
            ? 'bg-[#1E1F1E]/80 text-emerald-400 border-emerald-500/30' 
            : 'bg-[#1E1F1E]/60 text-white border-white/10',
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
    <div className="absolute bottom-0 left-0 right-0 p-8">
      <div className="h-8 w-48 bg-white/10 rounded mb-4 animate-pulse" />
      <div className="flex gap-2 mb-6">
        <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
        <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse" />
    </div>
  </div>
);

const ApartmentPreview: React.FC = () => {
  const [apartments, setApartments] = useState<ApartmentWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'soonest' | 'priceAsc'>('soonest');
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Drag Scroll State
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

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

  // Scroll & Drag Handlers
  const updateScrollState = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    
    const eps = 2;
    setCanLeft(el.scrollLeft > eps);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - eps);

    // Calculate progress 0-100
    const maxScroll = el.scrollWidth - el.clientWidth;
    const progress = maxScroll > 0 ? (el.scrollLeft / maxScroll) * 100 : 0;
    setScrollProgress(progress);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    updateScrollState();
    
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [sorted, updateScrollState]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!railRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - railRef.current.offsetLeft);
    setScrollLeftPos(railRef.current.scrollLeft);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !railRef.current) return;
    e.preventDefault();
    const x = e.pageX - railRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Multiplier for scroll speed
    railRef.current.scrollLeft = scrollLeftPos - walk;
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = railRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: dir === 'left' ? -delta : delta, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section id="apartments-section" className="py-32 bg-[#1E1F1E]">
        <div className="container">
          <div className="mb-12 flex items-end gap-4">
             <h2 className="text-4xl md:text-6xl font-bold text-white/20 animate-pulse">Loading Spaces...</h2>
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

  if (error) {
    return (
      <section id="apartments-section" className="py-32 bg-[#1E1F1E] text-center">
        <div className="container">
          <h2 className="text-3xl text-white mb-4">Unable to load spaces</h2>
          <p className="text-[#C5C5B5] mb-8">{error}</p>
          <button onClick={fetchAll} className="px-8 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-full font-bold hover:bg-white transition-colors">
            Refresh
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="apartments-section" className="py-32 bg-[#1E1F1E] relative overflow-hidden border-t border-white/5">
      {/* Ambient Glow */}
      <div className="absolute bottom-0 left-1/4 w-[800px] h-[800px] bg-[#C5C5B5]/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container relative z-10">
        
        {/* Header */}
        <AnimatedSection animation="fadeInUp">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-4">
                Select Your <br /><span className="text-[#C5C5B5]">Sanctuary.</span>
              </h2>
              <p className="text-white/60 text-lg max-w-md">
                Private apartments designed for deep work and easy living in the centre of Funchal.
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
               <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/50">
                  <GripHorizontal className="w-4 h-4" />
                  <span>Drag to explore</span>
               </div>

              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
                <select
                  id="apt-sort"
                  value={sort}
                  onChange={e => setSort(e.target.value as 'soonest' | 'priceAsc')}
                  className="appearance-none bg-transparent text-[#C5C5B5] text-sm pl-4 pr-8 py-2.5 rounded-xl focus:outline-none focus:bg-white/5 hover:bg-white/5 transition-colors cursor-pointer font-medium"
                >
                  <option value="soonest" className="bg-[#1E1F1E]">Availability</option>
                  <option value="priceAsc" className="bg-[#1E1F1E]">Price: Low to High</option>
                </select>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button
                  onClick={fetchAll}
                  className="p-2.5 text-[#C5C5B5] hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Carousel Rail */}
        <AnimatedSection animation="fadeInUp" delay={200}>
          <div className="relative group/rail">
            
            {/* Draggable Container */}
            <div
              ref={railRef}
              className={`flex gap-6 overflow-x-auto pb-16 pt-4 px-4 md:px-0 cursor-grab active:cursor-grabbing scrollbar-hide ${
                 isDragging ? 'snap-none' : 'snap-x snap-mandatory scroll-smooth'
              }`}
              onMouseDown={onMouseDown}
              onMouseLeave={onMouseLeave}
              onMouseUp={onMouseUp}
              onMouseMove={onMouseMove}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`#apartments-scroll::-webkit-scrollbar{display:none}`}</style>

              {sorted.map((a) => (
                <Link
                  key={a.id}
                  to={`/room/${apartmentService.generateSlug(a.title)}`}
                  draggable="false" // Prevent native drag behavior on links
                  className="group relative flex-none w-[85vw] md:w-[420px] snap-center focus:outline-none select-none"
                >
                  <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-[#1E1F1E] border border-white/10 shadow-2xl transition-all duration-500 group-hover:shadow-[0_20px_50px_-12px_rgba(197,197,181,0.1)] group-hover:border-[#C5C5B5]/30">
                    
                    <AvailabilityBadge iso={a.available_from} />
                    
                    {/* Image */}
                    <div className="absolute inset-0 overflow-hidden">
                      <OptimizedImage
                        src={a.image_url}
                        alt={a.title}
                        className="transition-transform duration-1000 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100"
                        width={800}
                        height={1000}
                        objectFit="cover"
                        objectPosition="center 40%"
                        draggable={false}
                      />
                    </div>
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E1F1E] via-[#1E1F1E]/20 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-500" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]">
                      
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-3xl font-bold text-white mb-1">{a.title}</h3>
                          <p className="text-sm text-white/50 line-clamp-1">{a.description.split('.')[0]}</p>
                        </div>
                        <div className="text-right bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                          <div className="text-lg font-bold text-[#C5C5B5]">{formatMoney(a.price, 'EUR')}</div>
                        </div>
                      </div>

                      {/* Feature Pills (Animated Reveal) */}
                      <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 opacity-0 group-hover:opacity-100">
                         <div className="overflow-hidden">
                            <div className="flex flex-wrap gap-2 mb-6 pt-1">
                              {a.features?.slice(0, 3).map((f, idx) => (
                                <span key={idx} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">
                                  {f.label}
                                </span>
                              ))}
                            </div>
                         </div>
                      </div>

                      {/* Button */}
                      <div className="flex items-center gap-3 text-white font-bold tracking-wide text-sm uppercase group-hover:gap-5 transition-all duration-300">
                        View Details 
                        <div className="w-8 h-8 rounded-full bg-[#C5C5B5] text-[#1E1F1E] flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                        </div>
                      </div>

                    </div>
                  </div>
                </Link>
              ))}

              {/* Coming Soon Card */}
              <div className="flex-none w-[85vw] md:w-[420px] snap-center aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-[#1E1F1E] border border-dashed border-white/20 relative group flex flex-col items-center justify-center text-center p-10 opacity-60 hover:opacity-100 transition-opacity select-none">
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 text-5xl grayscale">
                    🏗️
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Expanding Soon</h3>
                  <p className="text-white/50 mb-8 max-w-xs">
                    Three new premium units are currently under development in Funchal.
                  </p>
                  <span className="px-4 py-2 rounded-full border border-white/10 text-xs text-[#C5C5B5] uppercase tracking-widest">
                    Coming 2026
                  </span>
              </div>

            </div>

            {/* Navigation & Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 md:px-0 py-4 pointer-events-none">
               {/* Progress Line */}
               <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden max-w-xs mx-auto md:mx-0">
                  <div 
                    className="h-full bg-[#C5C5B5] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${scrollProgress}%` }}
                  />
               </div>

               {/* Buttons */}
               <div className="hidden md:flex gap-2 pointer-events-auto">
                 <button 
                    onClick={() => scroll('left')} 
                    disabled={!canLeft}
                    className="w-12 h-12 rounded-full border border-white/10 bg-[#1E1F1E] text-white flex items-center justify-center hover:bg-white hover:text-[#1E1F1E] hover:border-white disabled:opacity-30 disabled:hover:bg-[#1E1F1E] disabled:hover:text-white transition-all"
                 >
                    <ChevronLeft className="w-5 h-5" />
                 </button>
                 <button 
                    onClick={() => scroll('right')} 
                    disabled={!canRight}
                    className="w-12 h-12 rounded-full border border-white/10 bg-[#1E1F1E] text-white flex items-center justify-center hover:bg-white hover:text-[#1E1F1E] hover:border-white disabled:opacity-30 disabled:hover:bg-[#1E1F1E] disabled:hover:text-white transition-all"
                 >
                    <ChevronRight className="w-5 h-5" />
                 </button>
               </div>
            </div>

          </div>
        </AnimatedSection>

        <AnimatedSection animation="fadeInUp" delay={400}>
           <div className="flex justify-center mt-20">
              <Link to="/book" className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-[#1E1F1E] transition-all duration-300 bg-[#C5C5B5] rounded-full hover:scale-105 hover:shadow-[0_0_40px_rgba(197,197,181,0.4)]">
                <span>Book Your Stay</span>
                <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
           </div>
        </AnimatedSection>

      </div>
    </section>
  );
};

export default ApartmentPreview;