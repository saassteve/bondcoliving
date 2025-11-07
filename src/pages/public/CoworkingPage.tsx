import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, Wifi, Coffee, Users, Calendar, MapPin, Moon, Clock, ArrowRight, Star, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedSection from '../../components/AnimatedSection';
import { coworkingPassService, type CoworkingPass, type PassAvailabilityCheck } from '../../lib/supabase';

const amenities = [
  { icon: Wifi, name: 'Enterprise WiFi', description: 'Fiber internet with 1Gbps speeds for seamless video calls' },
  { icon: Coffee, name: 'Specialty Coffee', description: 'Premium specialty coffee and organic teas available throughout the day' },
  { icon: MapPin, name: 'Central Location', description: '5 minutes to ocean, cafes, restaurants, and transport' },
];

const CoworkingPage: React.FC = () => {
  const [passes, setPasses] = useState<CoworkingPass[]>([]);
  const [passAvailability, setPassAvailability] = useState<Record<string, PassAvailabilityCheck>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPasses();
  }, []);

  const fetchPasses = async () => {
    try {
      const data = await coworkingPassService.getActive();
      setPasses(data);

      const today = new Date().toISOString().split('T')[0];
      const availabilityMap: Record<string, PassAvailabilityCheck> = {};

      await Promise.all(
        data.map(async (pass) => {
          try {
            const availability = await coworkingPassService.checkAvailability(pass.id, today);
            availabilityMap[pass.id] = availability;
          } catch (error) {
            console.error(`Error checking availability for pass ${pass.id}:`, error);
          }
        })
      );

      setPassAvailability(availabilityMap);
    } catch (error) {
      console.error('Error fetching passes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDurationLabel = (pass: CoworkingPass) => {
    if (pass.duration_days === 1) return 'per day';
    if (pass.duration_days === 7) return 'per week';
    if (pass.duration_days === 30) return 'per month';
    return `${pass.duration_days} days`;
  };

  return (
    <>
      <Helmet>
        <title>Coworking Funchal Madeira | Professional Workspace for Digital Nomads | Bond Coworking</title>
        <meta name="description" content="Bond Coworking Funchal: Premium coworking space in central Madeira for digital nomads & remote workers. Enterprise WiFi 500+ Mbps, flexible day & monthly passes from €15. Opening November 2025." />
        <meta name="keywords" content="coworking Funchal, coworking Madeira, coworking space Funchal, coworking space Madeira, digital nomad workspace Funchal, remote work space Madeira, office space Funchal, flexible workspace Madeira, hot desk Funchal, dedicated desk Madeira, coworking passes Funchal, day pass coworking Madeira, monthly coworking Funchal" />
        <link rel="canonical" href="https://stayatbond.com/coworking" />

        {/* Open Graph */}
        <meta property="og:title" content="Coworking Funchal Madeira | Professional Workspace for Digital Nomads | Bond" />
        <meta property="og:description" content="Premium coworking space in central Funchal, Madeira. Enterprise WiFi, vibrant community. Day, weekly & monthly passes for digital nomads. Opening November 2025." />
        <meta property="og:url" content="https://stayatbond.com/coworking" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" />
        <meta property="og:site_name" content="Bond Coliving Funchal" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Coworking Funchal | Professional Workspace Madeira" />
        <meta name="twitter:description" content="Premium coworking space in central Funchal, Madeira. Enterprise WiFi, flexible passes from €15. Perfect for digital nomads." />
        <meta name="twitter:image" content="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" />
      </Helmet>
      
      {/* Hero */}
      <section className="relative py-32 md:py-40">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center"></div>
        <div className="container relative z-20">
          <div className="max-w-5xl mx-auto text-center">
            <AnimatedSection animation="fadeInUp">
              <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                  Your Productive Paradise
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white mb-10 leading-relaxed font-light">
                Premium coworking in the heart of Funchal. Enterprise WiFi, specialty coffee, and ocean views.
              </p>
              <button
                onClick={() => {
                  const pricingSection = document.querySelector('#pricing-section');
                  pricingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="inline-flex items-center px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-bold text-base uppercase tracking-wide shadow-2xl hover:shadow-[#C5C5B5]/50 hover:scale-105 transform"
              >
                View Pricing
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* Intro */}
      <section className="py-20 bg-[#1E1F1E]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection animation="fadeInLeft">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                  <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                    More Than Just a Desk
                  </span>
                </h2>
                <div className="space-y-6 text-lg text-[#C5C5B5]/90 leading-relaxed">
                  <p className="text-xl">
                    Bond's coworking space is designed for focus and connection. With enterprise-grade WiFi,
                    ergonomic workstations, and stunning natural light, it's the perfect
                    environment for getting things done.
                  </p>
                  <p>
                    Whether you need a quiet space for deep work or want to network with fellow digital nomads,
                    our flexible space adapts to your workflow and schedule. Book by the day, week, or month.
                  </p>
                </div>
              </div>
            </AnimatedSection>
            
            <AnimatedSection animation="fadeInRight" delay={200}>
              <div className="aspect-square bg-[#C5C5B5]/5 rounded-3xl overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                  alt="Modern coworking space interior with natural lighting and contemporary design"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* Pricing */}
      <section id="pricing-section" className="py-20 bg-[#C5C5B5]">
        <div className="container">
          <AnimatedSection animation="fadeInUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#1E1F1E] mb-6">
                Flexible Workspace Options
              </h2>
              <p className="text-xl text-[#1E1F1E]/80 max-w-3xl mx-auto leading-relaxed">
                Choose the plan that fits your work style and schedule. All plans include our full range of amenities.
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {loading ? (
              <div className="col-span-full text-center py-12 text-[#C5C5B5]">
                Loading pricing...
              </div>
            ) : passes.length === 0 ? (
              <div className="col-span-full text-center py-12 text-[#C5C5B5]">
                No passes available at the moment
              </div>
            ) : (
              passes.map((pass, index) => {
                const isHighlight = pass.slug === 'monthly-hot-desk';
                const availability = passAvailability[pass.id];
                const isAvailable = !availability || availability.available;
                const capacityPercentage = pass.max_capacity
                  ? Math.round((pass.current_capacity / pass.max_capacity) * 100)
                  : 0;

                return (
                  <AnimatedSection
                    key={pass.id}
                    animation="fadeInUp"
                    delay={200 + (index * 100)}
                    className={`bg-[#1E1F1E] rounded-2xl overflow-hidden transition-all duration-300 ${
                      isHighlight
                        ? 'ring-2 ring-[#C5C5B5] transform hover:-translate-y-2 shadow-2xl'
                        : 'hover:ring-1 hover:ring-[#C5C5B5]/50 hover:-translate-y-1 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isHighlight && (
                      <div className="bg-[#C5C5B5] text-[#1E1F1E] text-center py-2.5 text-sm font-bold uppercase tracking-wide">
                        {pass.description}
                      </div>
                    )}

                    <div className="p-6 lg:p-8 flex flex-col">
                      <div className="text-center mb-6">
                        <h3 className="text-xl lg:text-2xl font-bold mb-2 text-[#C5C5B5]">{pass.name}</h3>
                        {!isHighlight && (
                          <p className="text-[#C5C5B5]/60 text-sm min-h-[40px] flex items-center justify-center">{pass.description}</p>
                        )}
                      </div>

                      <div className="text-center mb-8">
                        <div className="flex items-baseline justify-center mb-2">
                          <span className="text-4xl lg:text-5xl font-bold text-[#C5C5B5]">€{pass.price}</span>
                          <span className="text-[#C5C5B5]/60 ml-2 text-base">{getDurationLabel(pass)}</span>
                        </div>
                      </div>

                      <ul className="space-y-4 mb-8 flex-grow">
                        {pass.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <Check className="w-5 h-5 text-[#C5C5B5] mr-3 flex-shrink-0 mt-0.5" />
                            <span className="text-[#C5C5B5]/80 text-sm leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto pt-4">
                        {!isAvailable ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              <span className="text-sm text-yellow-300">
                                {availability?.reason === 'not_yet_available' && availability.next_available_date
                                  ? `Available from ${new Date(availability.next_available_date).toLocaleDateString()}`
                                  : availability?.reason === 'at_capacity'
                                  ? 'Fully booked'
                                  : 'Currently unavailable'}
                              </span>
                            </div>
                            {availability?.reason === 'at_capacity' && availability.next_available_date && (
                              <p className="text-xs text-center text-gray-400">
                                Next available: {new Date(availability.next_available_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            {pass.is_capacity_limited && pass.max_capacity && (
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-[#C5C5B5]/60">
                                    {pass.max_capacity - pass.current_capacity} spots remaining
                                  </span>
                                  <span className="text-xs font-bold text-[#C5C5B5]">
                                    {100 - capacityPercentage}% available
                                  </span>
                                </div>
                                <div className="w-full bg-[#1E1F1E]/50 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full bg-[#C5C5B5] transition-all duration-300"
                                    style={{ width: `${100 - capacityPercentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            <Link
                              to={`/coworking/book?pass=${pass.slug}`}
                              className={`block w-full px-6 py-3.5 rounded-full text-sm font-semibold uppercase tracking-wide transition-all text-center break-words ${
                                isHighlight
                                  ? 'bg-[#C5C5B5] text-[#1E1F1E] hover:bg-white hover:shadow-lg'
                                  : 'bg-[#C5C5B5]/10 text-[#C5C5B5] hover:bg-[#C5C5B5]/20 border border-[#C5C5B5]/20'
                              }`}
                            >
                              Book Now
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })
            )}
          </div>
          
          <AnimatedSection animation="fadeInUp" delay={800}>
            <div className="text-center mt-16">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-10 border border-[#1E1F1E]/10 max-w-2xl mx-auto shadow-xl">
                <h3 className="text-2xl font-bold text-[#1E1F1E] mb-4">Already Have a Booking?</h3>
                <p className="text-[#1E1F1E]/80 mb-6 text-lg">
                  Look up your booking to view your access code and booking details.
                </p>
                <Link
                  to="/coworking/booking/lookup"
                  className="inline-flex items-center px-8 py-4 bg-[#1E1F1E] text-[#C5C5B5] rounded-full hover:bg-[#1E1F1E]/90 transition-all font-semibold text-base uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Lookup Booking
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
      
      {/* Amenities */}
      <section className="py-20 bg-[#1E1F1E]">
        <div className="container">
          <AnimatedSection animation="fadeInUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                  Everything You Need to Thrive
                </span>
              </h2>
              <p className="text-xl text-[#C5C5B5]/80 max-w-3xl mx-auto leading-relaxed">
                Our space is designed with remote workers in mind, providing all the tools and environment you need for productive work.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {amenities.map((amenity, index) => {
              const Icon = amenity.icon;
              return (
                <AnimatedSection
                  key={index}
                  animation="fadeInUp"
                  delay={200 + (index * 150)}
                  className="bg-[#C5C5B5]/5 rounded-3xl p-8 border border-[#C5C5B5]/10 group hover:bg-[#C5C5B5]/10 transition-all duration-500 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:border-[#C5C5B5]/30"
                >
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-[#C5C5B5]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#C5C5B5]/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <Icon className="h-6 w-6 text-[#C5C5B5]" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[#C5C5B5] group-hover:text-white transition-colors">{amenity.name}</h3>
                  <p className="text-[#C5C5B5]/80 leading-relaxed text-base">{amenity.description}</p>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Bond Coworking */}
      <section className="py-20 bg-[#C5C5B5]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection animation="fadeInLeft">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-10 text-[#1E1F1E] leading-tight">
                  Why Bond Coworking?
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-5 group">
                    <div className="w-10 h-10 bg-[#1E1F1E]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-[#1E1F1E]/20 transition-all">
                      <Users className="w-5 h-5 text-[#1E1F1E]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1E1F1E] mb-2">Curated Community</h3>
                      <p className="text-[#1E1F1E]/80 text-base leading-relaxed">
                        Work alongside vetted professionals who share your values of quality work and meaningful connections.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-5 group">
                    <div className="w-12 h-12 bg-[#1E1F1E]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-[#1E1F1E]/20 transition-all">
                      <MapPin className="w-6 h-6 text-[#1E1F1E]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#1E1F1E] mb-3">Perfect Location</h3>
                      <p className="text-[#1E1F1E]/80 text-lg leading-relaxed">
                        Central Funchal location puts you steps away from cafes, restaurants, and the ocean promenade.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-5 group">
                    <div className="w-12 h-12 bg-[#1E1F1E]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-[#1E1F1E]/20 transition-all">
                      <Coffee className="w-6 h-6 text-[#1E1F1E]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#1E1F1E] mb-3">Island Lifestyle</h3>
                      <p className="text-[#1E1F1E]/80 text-lg leading-relaxed">
                        Work productively during the day, then explore levadas, beaches, and local culture in your free time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
            
            <AnimatedSection animation="fadeInRight" delay={200}>
              <div className="aspect-square bg-[#1E1F1E]/5 rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
                <img
                  src="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                  alt="Modern coworking space interior with natural lighting and contemporary design"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-28 bg-gradient-to-b from-[#1E1F1E] to-black relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C5C5B5] rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#C5C5B5] rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="container text-center relative z-10">
          <AnimatedSection animation="fadeInUp">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                  Start Working in Paradise Today
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-[#C5C5B5]/90 mb-12 leading-relaxed font-light">
                Choose your pass and experience Funchal's premier coworking space.
                Flexible options for every work style.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => {
                    const pricingSection = document.querySelector('#pricing-section');
                    pricingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="inline-flex items-center px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-bold text-base uppercase tracking-wide shadow-2xl hover:shadow-[#C5C5B5]/50 hover:scale-105 transform"
                >
                  Book Your Pass
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>

                <Link
                  to="/apply"
                  className="inline-flex items-center px-8 py-4 bg-transparent text-[#C5C5B5] rounded-full hover:bg-[#C5C5B5]/10 transition-all font-bold text-base uppercase tracking-wide border-2 border-[#C5C5B5] hover:border-white hover:text-white"
                >
                  Explore Accommodation
                </Link>
              </div>

              <div className="mt-10 text-[#C5C5B5]/70">
                <p className="text-base">
                  Questions? Email us at{' '}
                  <a
                    href="mailto:hello@stayatbond.com"
                    className="text-[#C5C5B5] hover:text-white transition-colors underline font-semibold"
                  >
                    hello@stayatbond.com
                  </a>
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
};

export default CoworkingPage;