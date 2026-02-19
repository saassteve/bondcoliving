import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  MapPin,
  Wifi,
  Coffee,
  Building2,
  Users,
  Clock,
  CalendarDays,
  Bell,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { buildingService, apartmentService } from '../../lib/services';
import type { Building, Apartment } from '../../lib/services/types';
import BentoGallery from '../../components/location/BentoGallery';
import AnimatedSection from '../../components/AnimatedSection';
import { supabase } from '../../lib/supabase';

const LocationDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [building, setBuilding] = useState<Building | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyError, setNotifyError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;

      try {
        const buildingData = await buildingService.getBySlug(slug);
        setBuilding(buildingData);

        if (buildingData) {
          const allApartments = await apartmentService.getAll();
          const buildingApartments = allApartments.filter(
            (apt) => apt.building_id === buildingData.id
          );
          setApartments(buildingApartments);
        }
      } catch (error) {
        console.error('Error loading location data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setNotifyLoading(true);
    setNotifyError('');

    const { error } = await supabase
      .from('location_notify_signups')
      .insert({ email, building_slug: slug });

    setNotifyLoading(false);

    if (error && error.code !== '23505') {
      setNotifyError('Something went wrong. Please try again.');
      return;
    }

    setNotifySubmitted(true);
    setEmail('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E1F1E] flex items-center justify-center">
        <div className="text-[#C5C5B5] animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="min-h-screen bg-[#1E1F1E] flex flex-col items-center justify-center">
        <h1 className="text-2xl text-[#C5C5B5] mb-4">Location not found</h1>
        <Link
          to="/"
          className="text-[#C5C5B5]/60 hover:text-[#C5C5B5] flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  const isComingSoon = building.status === 'coming_soon';
  const isShortTerm = building.stay_type === 'short_term';

  const getGalleryImages = (): string[] => {
    if (building.gallery_images && building.gallery_images.length > 0) {
      return building.gallery_images;
    }
    if (apartments.length > 0) {
      return apartments.map(apt => apt.image_url).filter(url => url && !url.includes('undefined'));
    }
    return [];
  };

  const galleryImages = getGalleryImages();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const amenities = [
    { icon: Wifi, label: 'High-speed WiFi', description: '500 Mbps symmetric fiber' },
    { icon: Coffee, label: building.has_on_site_coworking ? 'Coworking on-site' : 'Coworking access', description: building.has_on_site_coworking ? 'Dedicated workspace in building' : 'Full access at Bond - Carreira' },
    { icon: Users, label: 'Community events', description: 'Weekly dinners and social gatherings' },
    { icon: Clock, label: isShortTerm ? 'Flexible short stays' : 'Monthly contracts', description: isShortTerm ? 'From 2 nights' : 'Minimum 1 month' },
  ];

  return (
    <>
      <Helmet>
        <title>{building.name} | Bond Coliving Funchal</title>
        <meta
          name="description"
          content={`${building.name} - ${building.description || 'Premium coliving in central Funchal, Madeira.'}`}
        />
      </Helmet>

      <div className="min-h-screen bg-[#1E1F1E]">
        <div className="container py-8">
          <Link
            to="/locations"
            className="inline-flex items-center text-[#C5C5B5]/60 hover:text-[#C5C5B5] mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Locations
          </Link>

          <AnimatedSection animation="fadeInUp">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-5xl font-bold text-white">
                    {building.name}
                  </h1>
                  {isComingSoon && (
                    <span className="px-4 py-1.5 bg-amber-500/20 text-amber-300 text-sm font-medium rounded-full border border-amber-500/30">
                      Coming Soon
                    </span>
                  )}
                </div>
                {building.tagline && (
                  <p className="text-lg text-[#C5C5B5]/70 mb-3">{building.tagline}</p>
                )}
                <div className="flex items-center gap-2 text-[#C5C5B5]/60">
                  <MapPin className="w-4 h-4" />
                  <span>{building.address}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    isShortTerm
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-green-500/20 text-green-300 border border-green-500/30'
                  }`}
                >
                  {isShortTerm ? 'Short Stays' : 'Monthly Stays'}
                </span>
                {building.has_on_site_coworking && (
                  <span className="px-4 py-2 bg-[#C5C5B5]/10 text-[#C5C5B5] text-sm font-medium rounded-full border border-[#C5C5B5]/20">
                    Coworking Hub
                  </span>
                )}
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fadeInUp" delay={100}>
            <BentoGallery images={galleryImages} buildingName={building.name} />
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
            <div className="lg:col-span-2">
              <AnimatedSection animation="fadeInUp" delay={200}>
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-white mb-4">About this location</h2>
                  <p className="text-[#C5C5B5]/80 text-lg leading-relaxed">
                    {building.description || 'A premium coliving space in the heart of Funchal, designed for digital nomads and remote workers seeking community and productivity.'}
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection animation="fadeInUp" delay={300}>
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-white mb-6">What's included</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {amenities.map((amenity, index) => {
                      const Icon = amenity.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-4 bg-[#C5C5B5]/5 rounded-xl border border-[#C5C5B5]/10"
                        >
                          <div className="p-2 bg-[#C5C5B5]/10 rounded-lg">
                            <Icon className="w-5 h-5 text-[#C5C5B5]" />
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{amenity.label}</h3>
                            <p className="text-sm text-[#C5C5B5]/60">{amenity.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </AnimatedSection>

              {isComingSoon ? (
                <AnimatedSection animation="fadeInUp" delay={400}>
                  <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl p-8 border border-amber-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-amber-500/20 rounded-xl">
                        <Bell className="w-6 h-6 text-amber-300" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">Get notified when we open</h2>
                    </div>
                    <p className="text-[#C5C5B5]/80 mb-6">
                      Be the first to know when {building.name} becomes available. We'll send you an email as soon as bookings open.
                    </p>

                    {notifySubmitted ? (
                      <div className="flex items-center gap-3 p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                        <CheckCircle className="w-5 h-5 text-green-300" />
                        <span className="text-green-300">Thanks! We'll notify you when this location opens.</span>
                      </div>
                    ) : (
                      <form onSubmit={handleNotifySubmit} className="space-y-3">
                        <div className="flex gap-3">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            disabled={notifyLoading}
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#C5C5B5]/40 focus:outline-none focus:border-amber-500/50 disabled:opacity-60"
                          />
                          <button
                            type="submit"
                            disabled={notifyLoading}
                            className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {notifyLoading ? 'Saving...' : 'Notify Me'}
                          </button>
                        </div>
                        {notifyError && (
                          <p className="text-sm text-red-400">{notifyError}</p>
                        )}
                      </form>
                    )}
                  </div>
                </AnimatedSection>
              ) : (
                <AnimatedSection animation="fadeInUp" delay={400}>
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">Available apartments</h2>
                      <Link
                        to="/book"
                        className="text-[#C5C5B5] hover:text-white transition-colors flex items-center gap-2"
                      >
                        View all
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {apartments.length === 0 ? (
                      <div className="p-8 bg-[#C5C5B5]/5 rounded-2xl border border-[#C5C5B5]/10 text-center">
                        <Building2 className="w-12 h-12 text-[#C5C5B5]/40 mx-auto mb-4" />
                        <p className="text-[#C5C5B5]/60">
                          No apartments currently listed. Check back soon!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {apartments.slice(0, 4).map((apartment) => (
                          <Link
                            key={apartment.id}
                            to={`/room/${apartmentService.generateSlug(apartment.title)}`}
                            className="group bg-[#C5C5B5]/5 rounded-xl border border-[#C5C5B5]/10 overflow-hidden hover:border-[#C5C5B5]/30 transition-all"
                          >
                            <div className="aspect-[16/10] overflow-hidden">
                              <img
                                src={apartment.image_url}
                                alt={apartment.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="font-bold text-white mb-1">{apartment.title}</h3>
                              <p className="text-sm text-[#C5C5B5]/60 mb-3">
                                {apartment.size} &middot; {apartment.capacity}
                              </p>
                              <div className="flex items-baseline justify-between">
                                <div>
                                  <span className="text-xl font-bold text-[#C5C5B5]">
                                    {formatPrice(apartment.price)}
                                  </span>
                                  <span className="text-[#C5C5B5]/60 text-sm">/month</span>
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    apartment.status === 'available'
                                      ? 'bg-green-500/20 text-green-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}
                                >
                                  {apartment.status === 'available' ? 'Available' : 'Occupied'}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </AnimatedSection>
              )}
            </div>

            <div className="lg:col-span-1">
              <AnimatedSection animation="fadeInUp" delay={300}>
                <div className="sticky top-24">
                  {!isComingSoon && apartments.length > 0 && (
                    <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 border border-[#C5C5B5]/10 mb-6">
                      <div className="text-center mb-4">
                        <span className="text-[#C5C5B5]/60 text-sm">Starting from</span>
                        <div className="text-3xl font-bold text-white">
                          {formatPrice(Math.min(...apartments.map((a) => a.price)))}
                          <span className="text-lg text-[#C5C5B5]/60">/mo</span>
                        </div>
                      </div>
                      <Link
                        to="/book"
                        className="block w-full py-3 bg-[#C5C5B5] text-[#1E1F1E] text-center font-bold rounded-xl hover:bg-white transition-colors"
                      >
                        Book Now
                      </Link>
                      <p className="text-center text-[#C5C5B5]/40 text-xs mt-3">
                        All utilities included
                      </p>
                    </div>
                  )}

                  <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 border border-[#C5C5B5]/10">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#C5C5B5]" />
                      Location
                    </h3>
                    <div className="aspect-square rounded-xl overflow-hidden bg-[#C5C5B5]/10 mb-4">
                      {building.latitude && building.longitude ? (
                        <iframe
                          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${building.latitude},${building.longitude}&zoom=15`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title={`Map of ${building.name}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[#C5C5B5]/40">Map loading...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-[#C5C5B5]/60">{building.address}</p>
                    <div className="mt-4 pt-4 border-t border-[#C5C5B5]/10">
                      <div className="flex items-center gap-2 text-sm text-[#C5C5B5]/60">
                        <CalendarDays className="w-4 h-4" />
                        <span>5 min walk to city center</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>

        <AnimatedSection animation="fadeInUp" delay={500}>
          <section className="py-20 bg-gradient-to-b from-[#1E1F1E] to-[#2A2B2A] mt-12">
            <div className="container">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {isComingSoon ? 'Explore our other locations' : 'Ready to call this home?'}
                </h2>
                <p className="text-[#C5C5B5]/70 mb-8">
                  {isComingSoon
                    ? 'Check out our available locations while you wait for this one to open.'
                    : 'Join our community of digital nomads in the heart of Funchal.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {isComingSoon ? (
                    <Link
                      to="/location/carreira"
                      className="px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] font-bold rounded-xl hover:bg-white transition-colors"
                    >
                      View Bond - Carreira
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/book"
                        className="px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] font-bold rounded-xl hover:bg-white transition-colors"
                      >
                        Book Your Stay
                      </Link>
                      <Link
                        to="/about"
                        className="px-8 py-4 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        Learn More About Bond
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>
      </div>
    </>
  );
};

export default LocationDetailPage;
