import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Users, MapPin, ChevronLeft, ChevronRight,
  Share2, Star, Check, Wifi, Maximize2, Calendar
} from 'lucide-react';
import { apartmentService, availabilityService, type Apartment } from '../../lib/supabase';
import { getIconComponent } from '../../lib/iconUtils';
import CalendarAvailability from '../../components/CalendarAvailability';
import AnimatedSection from '../../components/AnimatedSection';
import OptimizedImage from '../../components/OptimizedImage';

const formatMoney = (amount: number, currency: 'EUR' | 'GBP' | 'USD') =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

const RoomDetailPage: React.FC = () => {
  const { roomSlug } = useParams<{ roomSlug: string }>();
  const navigate = useNavigate();

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchApartment = async () => {
      if (!roomSlug) {
        setError('Room slug not provided');
        setLoading(false);
        return;
      }

      try {
        let apartmentData = await apartmentService.getBySlug(roomSlug);
        if (!apartmentData) apartmentData = await apartmentService.getById(roomSlug);

        if (apartmentData) {
          const [features, images, nextAvailableDate] = await Promise.all([
            apartmentService.getFeatures(apartmentData.id),
            apartmentService.getImages(apartmentData.id),
            availabilityService.getNextAvailableDate(apartmentData.id),
          ]);

          const sortedImages = images.sort((a, b) => {
            if (a.is_featured && !b.is_featured) return -1;
            if (!a.is_featured && b.is_featured) return 1;
            return (a.sort_order || 0) - (b.sort_order || 0);
          });

          setApartment({
            ...apartmentData,
            slug: apartmentService.generateSlug(apartmentData.title),
            features,
            images: sortedImages,
            image_url: sortedImages[0]?.image_url || apartmentData.image_url,
            available_from: nextAvailableDate || apartmentData.available_from,
          });
        } else {
          setError('Apartment not found');
        }
      } catch (err) {
        console.error('Error fetching apartment:', err);
        setError('Failed to load apartment details');
      } finally {
        setLoading(false);
      }
    };

    fetchApartment();
  }, [roomSlug]);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (apartment?.images && apartment.images.length > 1) {
      setCurrentImageIndex(prev => (prev === apartment.images.length - 1 ? 0 : prev + 1));
    }
  };

  const previousImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (apartment?.images && apartment.images.length > 1) {
      setCurrentImageIndex(prev => (prev === 0 ? apartment.images.length - 1 : prev - 1));
    }
  };

  const handleBookNow = () => {
    navigate('/book');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E1F1E] flex items-center justify-center">
        <div className="text-[#C5C5B5] animate-pulse text-xl font-medium">Loading sanctuary...</div>
      </div>
    );
  }

  if (error || !apartment) {
    return (
      <div className="min-h-screen bg-[#1E1F1E] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl text-white font-bold mb-4">Sanctuary Not Found</h1>
        <p className="text-white/60 mb-8">We couldn't find the space you're looking for.</p>
        <Link to="/" className="px-8 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-full font-bold hover:bg-white transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  const currentImage = apartment.images && apartment.images.length > 0 ? apartment.images[currentImageIndex] : null;
  const displayImageUrl = currentImage?.image_url || apartment.image_url;
  
  const eur = formatMoney(apartment.price, 'EUR');
  const usd = formatMoney(Math.round(apartment.price * 1.05), 'USD');
  const gbp = formatMoney(Math.round(apartment.price * 0.85), 'GBP');

  return (
    <>
      <Helmet>
        <title>{`${apartment.title} | Bond Coliving`}</title>
        <meta name="description" content={apartment.description} />
      </Helmet>

      <div className="bg-[#1E1F1E] min-h-screen text-white pb-24">
        
        {/* --- TOP NAVIGATION BAR --- */}
        <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-[#1E1F1E]/90 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
          <div className="container flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            
            <div className="flex gap-3">
              <button className="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white/80 hover:bg-white hover:text-[#1E1F1E] transition-all">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* --- HERO IMAGE GALLERY --- */}
        <section className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden group bg-[#1E1F1E]">
          <div className="absolute inset-0 bg-black/20 z-10 group-hover:bg-black/10 transition-colors duration-500" />

          <OptimizedImage
            src={displayImageUrl}
            alt={apartment.title}
            className="transition-transform duration-700 ease-out"
            width={1920}
            height={1280}
            priority={true}
            objectFit="cover"
            objectPosition="center center"
          />

          {/* Navigation Arrows */}
          <div className="absolute inset-0 z-20 flex items-center justify-between px-4 md:px-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <button onClick={previousImage} className="pointer-events-auto p-3 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-white hover:text-black transition-all">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextImage} className="pointer-events-auto p-3 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-white hover:text-black transition-all">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-8 right-8 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium text-white border border-white/10">
            {currentImageIndex + 1} / {apartment.images?.length || 1}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-[#1E1F1E] via-[#1E1F1E]/20 to-transparent z-10 pointer-events-none" />
        </section>

        {/* --- MAIN CONTENT --- */}
        <div className="container relative z-20 -mt-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Details */}
            <div className="lg:col-span-8">
              
              {/* Title Header */}
              <AnimatedSection animation="fadeInUp" className="mb-12">
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="px-3 py-1 rounded-full bg-[#C5C5B5]/10 border border-[#C5C5B5]/20 text-[#C5C5B5] text-xs uppercase tracking-wider font-bold">
                    Premium Apartment
                  </span>
                  {apartment.available_from && new Date(apartment.available_from) <= new Date() && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs uppercase tracking-wider font-bold flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Available Now
                    </span>
                  )}
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                  {apartment.title}
                </h1>
                
                <div className="flex items-center gap-6 text-white/60 text-sm md:text-base">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C5C5B5]" />
                    {apartment.capacity} Guests
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#C5C5B5]" />
                    {apartment.size}
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-[#C5C5B5]" />
                    1Gbps Fiber
                  </div>
                </div>
              </AnimatedSection>

              {/* Description */}
              <AnimatedSection animation="fadeInUp" delay={100} className="mb-16">
                <h2 className="text-2xl font-bold text-white mb-6">About the space</h2>
                <div className="prose prose-invert prose-lg max-w-none text-white/70 leading-relaxed">
                  <p>{apartment.description}</p>
                </div>
              </AnimatedSection>

              {/* Features Grid */}
              <AnimatedSection animation="fadeInUp" delay={200} className="mb-16 border-t border-white/10 pt-12">
                <h2 className="text-2xl font-bold text-white mb-8">Amenities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {apartment.features?.map((feature, idx) => {
                    const Icon = getIconComponent(feature.icon);
                    return (
                      <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#C5C5B5]/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-[#1E1F1E] flex items-center justify-center text-[#C5C5B5] shadow-lg">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-white/80">{feature.label}</span>
                      </div>
                    );
                  })}
                  
                  {/* Always Included Standard Amenities */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-[#1E1F1E] flex items-center justify-center text-[#C5C5B5] shadow-lg">
                       <Star className="w-5 h-5" />
                    </div>
                    <span className="text-white/80">Weekly Cleaning</span>
                  </div>
                </div>
              </AnimatedSection>

              {/* Calendar Section */}
              <AnimatedSection animation="fadeInUp" delay={300} className="mb-16 border-t border-white/10 pt-12">
                <h2 className="text-2xl font-bold text-white mb-2">Availability</h2>
                <p className="text-white/50 mb-8">Select check-in date to view detailed availability.</p>
                <div className="bg-[#2A2B2A] rounded-3xl p-2 md:p-8 border border-white/5 shadow-2xl">
                   <CalendarAvailability apartmentId={apartment.id} apartmentTitle={apartment.title} />
                </div>
              </AnimatedSection>

            </div>

            {/* Right Column: Sticky Booking Card */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-32 space-y-6">
                
                {/* Pricing Card */}
                <AnimatedSection animation="fadeInLeft" delay={400}>
                  <div className="bg-[#252625] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    {/* Glow effect */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#C5C5B5]/10 rounded-full blur-[60px] pointer-events-none" />

                    <div className="mb-6">
                       <p className="text-sm text-white/50 mb-1 uppercase tracking-widest font-bold">Monthly Rate</p>
                       <div className="flex items-baseline gap-2">
                         <span className="text-4xl md:text-5xl font-bold text-white tracking-tight">{eur}</span>
                         <span className="text-white/40">/ mo</span>
                       </div>
                       <div className="text-xs text-white/30 mt-2 flex gap-2">
                          <span>≈ {usd}</span> • <span>≈ {gbp}</span>
                       </div>
                    </div>

                    <div className="space-y-4 mb-8">
                       <div className="flex items-center gap-3 text-sm text-white/70">
                          <div className="w-6 h-6 rounded-full bg-[#C5C5B5]/20 flex items-center justify-center text-[#C5C5B5]">
                             <Check className="w-3 h-3" />
                          </div>
                          <span>All utilities included</span>
                       </div>
                       <div className="flex items-center gap-3 text-sm text-white/70">
                          <div className="w-6 h-6 rounded-full bg-[#C5C5B5]/20 flex items-center justify-center text-[#C5C5B5]">
                             <Check className="w-3 h-3" />
                          </div>
                          <span>No hidden fees</span>
                       </div>
                       <div className="flex items-center gap-3 text-sm text-white/70">
                          <div className="w-6 h-6 rounded-full bg-[#C5C5B5]/20 flex items-center justify-center text-[#C5C5B5]">
                             <Check className="w-3 h-3" />
                          </div>
                          <span>Flexible monthly contracts</span>
                       </div>
                    </div>

                    <button 
                      onClick={handleBookNow}
                      className="w-full py-4 bg-[#C5C5B5] hover:bg-white text-[#1E1F1E] rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-[#C5C5B5]/25 flex items-center justify-center gap-2"
                    >
                      Book Now <ArrowRight className="w-5 h-5" />
                    </button>
                    
                    <p className="text-center text-white/30 text-xs mt-4">
                       Minimum stay 30 days
                    </p>
                  </div>
                </AnimatedSection>

                {/* Need Help Card */}
                <AnimatedSection animation="fadeInLeft" delay={500}>
                   <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center">
                      <h3 className="text-white font-bold mb-2">Questions?</h3>
                      <p className="text-white/50 text-sm mb-4">
                         Not sure if this is the right fit? We are here to help.
                      </p>
                      <a href="mailto:hello@stayatbond.com" className="text-[#C5C5B5] text-sm font-bold hover:underline">
                         Contact Team
                      </a>
                   </div>
                </AnimatedSection>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- MOBILE STICKY BAR --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1E1F1E]/90 backdrop-blur-xl border-t border-white/10 p-4 z-50 lg:hidden pb-8">
         <div className="flex items-center justify-between">
            <div>
               <span className="block text-xs text-white/50 uppercase">Total per month</span>
               <span className="text-xl font-bold text-white">{eur}</span>
            </div>
            <button 
              onClick={handleBookNow}
              className="px-8 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-xl font-bold hover:bg-white transition-colors"
            >
               Book Now
            </button>
         </div>
      </div>

    </>
  );
};

export default RoomDetailPage;