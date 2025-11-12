import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Users, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { apartmentService, availabilityService, type Apartment } from '../../lib/supabase';
import { getIconComponent } from '../../lib/iconUtils';
import CalendarAvailability from '../../components/CalendarAvailability';

const formatMoney = (amount: number, currency: 'EUR' | 'GBP' | 'USD') =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);

const humanAvailability = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (d <= today) return 'Available now';
  return `Available ${d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
};

const RoomDetailPage: React.FC = () => {
  const { roomSlug } = useParams<{ roomSlug: string }>();
  const navigate = useNavigate();

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const nextImage = () => {
    if (apartment?.images && apartment.images.length > 1) {
      setCurrentImageIndex(prev => (prev === apartment.images.length - 1 ? 0 : prev + 1));
    }
  };

  const previousImage = () => {
    if (apartment?.images && apartment.images.length > 1) {
      setCurrentImageIndex(prev => (prev === 0 ? apartment.images.length - 1 : prev - 1));
    }
  };

  const goToImage = (index: number) => setCurrentImageIndex(index);

  const handleBookNow = () => {
    if (!apartment) return;
    try {
      const evt = new CustomEvent('openBookingModal', {
        detail: {
          apartmentId: apartment.id,
          apartmentTitle: apartment.title,
          // prefill can be added later if your modal supports it
        },
      });
      window.dispatchEvent(evt);
      // Fallback to booking page in case no modal listener exists
      setTimeout(() => {
        navigate('/apply'); // this is your booking page route
      }, 50);
    } catch {
      navigate('/apply');
    }
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading... - Bond Coliving</title>
        </Helmet>
        <div className="container py-16 text-center">
          <div className="text-xl">Loading apartment details...</div>
        </div>
      </>
    );
  }

  if (error || !apartment) {
    return (
      <>
        <Helmet>
          <title>Apartment Not Found - Bond Coliving</title>
        </Helmet>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Apartment not found</h1>
          <p className="mb-6">{error || "Sorry, we couldn't find the apartment you're looking for."}</p>
          <Link to="/" className="btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Home
          </Link>
        </div>
      </>
    );
  }

  const currentImage =
    apartment.images && apartment.images.length > 0 ? apartment.images[currentImageIndex] : null;
  const displayImageUrl = currentImage?.image_url || apartment.image_url;
  const availCopy = humanAvailability(apartment.available_from);

  const eur = formatMoney(apartment.price, 'EUR');
  const usd = formatMoney(Math.round(apartment.price * 1.05), 'USD');
  const gbp = formatMoney(Math.round(apartment.price * 0.85), 'GBP');

  return (
    <>
      <Helmet>
        <title>{`${apartment.title} — Book Your Stay | Bond Coliving Funchal`}</title>
        <meta
          name="description"
          content={`${apartment.description} Located in Funchal, Madeira. ${eur}/month. ${apartment.size} • ${apartment.capacity}. Book your stay at Bond.`}
        />
        <link rel="canonical" href={`https://stayatbond.com/room/${apartment.slug}`} />

        {/* Open Graph */}
        <meta property="og:title" content={`${apartment.title} — Book Your Stay | Bond Coliving Funchal`} />
        <meta property="og:description" content={`${apartment.description} ${eur}/month in Funchal, Madeira.`} />
        <meta property="og:url" content={`https://stayatbond.com/room/${apartment.slug}`} />
        <meta property="og:image" content={displayImageUrl} />

        {/* Twitter */}
        <meta name="twitter:title" content={`${apartment.title} — Book Your Stay | Bond Coliving Funchal`} />
        <meta name="twitter:description" content={`${apartment.description} ${eur}/month in Funchal, Madeira.`} />
        <meta name="twitter:image" content={displayImageUrl} />
      </Helmet>

      {/* Hero */}
      <section className="relative py-28 md:py-32">
        <div className="absolute inset-0 bg-black/60 z-10"></div>

        {availCopy && (
          <div className="absolute top-8 right-8 z-20 opacity-90 hover:opacity-100 transition-opacity duration-300">
            <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium border border-white/20 shadow-lg">
              {availCopy}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${displayImageUrl})` }} />
        <div className="container relative z-20">
          <Link to="/" className="inline-flex items-center text-[#C5C5B5]/70 hover:text-[#C5C5B5] mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-5xl md:text-7xl font-bold mb-4">{apartment.title}</h1>
          <p className="text-lg md:text-2xl text-[#C5C5B5] max-w-3xl">{apartment.description}</p>
        </div>
      </section>

      {/* Details */}
      <section className="py-20 bg-[#1E1F1E]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Gallery and calendar */}
            <div className="space-y-6">
              <div className="relative aspect-square bg-[#C5C5B5]/5 rounded-2xl overflow-hidden group">
                <img
                  src={displayImageUrl}
                  alt={`${apartment.title} interior`}
                  className="w-full h-full object-cover transition-transform duration-300"
                />

                {apartment.images && apartment.images.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {currentImageIndex + 1} / {apartment.images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Live Availability */}
              <div className="hidden lg:block">
                <h2 className="text-2xl font-bold mb-6">Live availability</h2>
                <CalendarAvailability apartmentId={apartment.id} apartmentTitle={apartment.title} />
              </div>
            </div>

            {/* Booking panel */}
            <div>
              <div className="mb-12 p-8 bg-[#C5C5B5]/5 rounded-2xl">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="block text-3xl md:text-4xl font-bold">{eur}</span>
                    <div className="text-sm text-[#C5C5B5]/60 mt-1">
                      {usd} • {gbp}
                    </div>
                    <span className="text-[#C5C5B5]/70 text-sm">per month</span>
                  </div>
                </div>

                {/* Key facts */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-[#C5C5B5] mr-3" />
                    <span>{apartment.capacity}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-[#C5C5B5] mr-3" />
                    <span>{apartment.size}</span>
                  </div>
                </div>

                {/* Included */}
                <div className="mb-8 p-6 bg-[#1E1F1E]/30 rounded-xl border border-[#C5C5B5]/10">
                  <h3 className="text-lg font-bold text-[#C5C5B5] mb-4">What is included</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'All utilities',
                      'Enterprise Wi-Fi',
                      'Bi-weekly cleaning',
                      'Weekly laundry',
                      'Coworking access',
                      'Community events',
                      'Fresh linens and towels',
                      'No hidden fees',
                    ].map(item => (
                      <div key={item} className="flex items-center text-[#C5C5B5]/80">
                        <div className="w-2 h-2 bg-[#C5C5B5] rounded-full mr-3" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Book now */}
                <div className="p-6 bg-[#C5C5B5]/10 rounded-xl border border-[#C5C5B5]/20">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-[#C5C5B5] mb-2">Ready to book</h3>
                    <p className="text-[#C5C5B5]/80 mb-6">
                      Select your dates in the next step and confirm your booking
                    </p>
                    <button
                      onClick={handleBookNow}
                      className="inline-flex items-center px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-semibold text-lg tracking-wide shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      Book this apartment
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                    <div className="mt-3 text-xs text-[#C5C5B5]/60">Minimum stay 30 nights</div>
                  </div>
                </div>
              </div>

              {/* Features and info */}
              <div className="space-y-12">
                {apartment.features && apartment.features.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Features</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {apartment.features.map((feature, index) => {
                        const Icon = getIconComponent(feature.icon);
                        return (
                          <li key={index} className="flex items-center text-[#C5C5B5]/80">
                            <Icon className="w-4 h-4 mr-3 text-[#C5C5B5]" />
                            {feature.label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="lg:hidden">
                  <h2 className="text-2xl font-bold mb-6">Live availability</h2>
                  <CalendarAvailability apartmentId={apartment.id} apartmentTitle={apartment.title} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-6">About your stay</h2>
                  <div className="space-y-4 text-[#C5C5B5]/80">
                    <p>
                      Your private apartment includes access to our coworking space and community events. Utilities,
                      cleaning and high speed internet are included in the monthly price.
                    </p>
                    <p>Minimum stay is one month. Longer commitments may be eligible for discounts.</p>
                    <div className="mt-6 p-4 bg-[#C5C5B5]/10 rounded-xl border border-[#C5C5B5]/20">
                      <h4 className="text-lg font-bold text-[#C5C5B5] mb-2">Questions</h4>
                      <p className="text-[#C5C5B5]/80 text-sm mb-3">
                        Answers about inclusions, cleaning, Wi-Fi and more
                      </p>
                      <a
                        href="/#faq"
                        className="inline-flex items-center text-[#C5C5B5] hover:text-white transition-colors text-sm font-medium"
                      >
                        View FAQ
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky mobile booking bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1E1F1E]/95 backdrop-blur border-t border-[#C5C5B5]/20">
              <div className="container py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#C5C5B5]/70">From</div>
                  <div className="text-lg font-bold text-[#C5C5B5]">{eur} <span className="text-sm font-normal text-[#C5C5B5]/70">per month</span></div>
                </div>
                <button
                  onClick={handleBookNow}
                  className="px-5 py-3 rounded-full bg-[#C5C5B5] text-[#1E1F1E] font-semibold hover:bg-white transition"
                >
                  Book now
                </button>
              </div>
            </div>
            <div className="lg:hidden h-16" aria-hidden="true" />
          </div>
        </div>
      </section>
    </>
  );
};

export default RoomDetailPage;