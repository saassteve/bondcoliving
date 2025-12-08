import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Wifi, Coffee, MapPin, Zap, Monitor,
  Users, ArrowRight, CheckCircle2, AlertCircle,
  CreditCard, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedSection from '../../components/AnimatedSection';
import OptimizedImage from '../../components/OptimizedImage';
import { coworkingPassService, coworkingImageService, type CoworkingPass, type PassAvailabilityCheck, type CoworkingImage } from '../../lib/supabase';

const CoworkingPage: React.FC = () => {
  const [passes, setPasses] = useState<CoworkingPass[]>([]);
  const [passAvailability, setPassAvailability] = useState<Record<string, PassAvailabilityCheck>>({});
  const [images, setImages] = useState<CoworkingImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPasses();
    fetchImages();
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

  const fetchImages = async () => {
    try {
      const data = await coworkingImageService.getActive();
      setImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const getDurationLabel = (pass: CoworkingPass) => {
    if (pass.duration_days === 1) return '/ day';
    if (pass.duration_days === 7) return '/ week';
    if (pass.duration_days === 30) return '/ month';
    return `for ${pass.duration_days} days`;
  };

  return (
    <>
      <Helmet>
        <title>Coworking in Funchal | Bond</title>
        <meta name="description" content="Premium coworking space in Funchal, Madeira. 1Gbps WiFi, ergonomic chairs, and a curated community." />
      </Helmet>
      
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#1E1F1E]">
        {/* Background Image with Cinematic Gradient */}
        <div className="absolute inset-0 z-0 bg-[#1E1F1E]">
          <OptimizedImage
            src="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Coworking Background"
            className="opacity-60"
            width={1920}
            height={1080}
            priority={true}
            objectFit="contain"
            objectPosition="center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E1F1E] via-[#1E1F1E]/80 to-transparent" />
        </div>

        <div className="container relative z-10 pt-20">
          <AnimatedSection animation="fadeInUp">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[#C5C5B5] mb-8 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-widest">Open 8am-8pm Daily</span>
              </div>

              <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-6 leading-[0.9]">
                Work in <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5]">Paradise.</span>
              </h1>

              <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
                Enterprise-grade infrastructure meets island lifestyle. 
                The ultimate workspace for focus, calls, and collaboration in central Funchal.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full font-bold text-lg hover:scale-105 hover:shadow-[0_0_30px_rgba(197,197,181,0.3)] transition-all duration-300"
                >
                  View Passes
                </button>
                <Link 
                  to="/about"
                  className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-all"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* --- BENTO GRID AMENITIES --- */}
      <section className="py-24 bg-[#1E1F1E]">
        <div className="container">
          <AnimatedSection animation="fadeInUp">
            <div className="mb-12 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Engineered for <span className="text-[#C5C5B5] italic font-serif">Focus.</span>
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4 md:h-[600px]">
            
            {/* Large Tile: WiFi */}
            <AnimatedSection animation="scaleIn" delay={100} className="md:col-span-2 md:row-span-2 h-full">
              <div className="group relative h-full p-8 md:p-12 rounded-[2rem] bg-gradient-to-br from-gray-900 to-black border border-white/10 overflow-hidden hover:border-[#C5C5B5]/30 transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5C5B5]/10 rounded-full blur-[100px] group-hover:bg-[#C5C5B5]/20 transition-all duration-500" />
                
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-[#1E1F1E] border border-white/10 flex items-center justify-center mb-6 text-[#C5C5B5]">
                      <Wifi className="w-7 h-7" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">1Gbps Fiber</h3>
                    <p className="text-white/60 text-lg">Redundant connections ensuring you never drop a call.</p>
                  </div>
                  
                  <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-white/40 uppercase tracking-wider">Speedtest</span>
                      <span className="text-emerald-400 text-xs font-mono">● Live</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#C5C5B5] w-[95%] animate-pulse" />
                    </div>
                    <div className="flex justify-between mt-2 text-sm font-mono text-[#C5C5B5]">
                      <span>↓ 980 Mbps</span>
                      <span>↑ 850 Mbps</span>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Tile: Coffee */}
            <AnimatedSection animation="scaleIn" delay={200} className="h-full">
              <div className="group h-full p-8 rounded-[2rem] bg-[#252625] border border-white/10 hover:bg-[#2A2B2A] transition-colors flex flex-col justify-between">
                <Coffee className="w-10 h-10 text-[#C5C5B5] mb-4" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Specialty Coffee</h3>
                  <p className="text-white/50 text-sm">Unlimited espresso & organic teas included.</p>
                </div>
              </div>
            </AnimatedSection>

            {/* Tile: Monitors/Ergo */}
            <AnimatedSection animation="scaleIn" delay={300} className="h-full">
              <div className="group h-full p-8 rounded-[2rem] bg-[#252625] border border-white/10 hover:bg-[#2A2B2A] transition-colors flex flex-col justify-between">
                <Monitor className="w-10 h-10 text-[#C5C5B5] mb-4" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Ergonomic Setup</h3>
                  <p className="text-white/50 text-sm">Herman Miller chairs & external monitors available.</p>
                </div>
              </div>
            </AnimatedSection>

          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 bg-[#1E1F1E] relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#C5C5B5]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative z-10">
          <AnimatedSection animation="fadeInUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Choose Your <span className="text-[#C5C5B5]">Access.</span>
              </h2>
              <p className="text-xl text-white/60">Flexible options. No hidden fees.</p>
            </div>
          </AnimatedSection>

          {loading ? (
            <div className="text-center text-[#C5C5B5] animate-pulse">Loading passes...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {passes.map((pass, index) => {
                const isHighlight = pass.slug.includes('monthly'); // Heuristic for highlighting
                const availability = passAvailability[pass.id];
                const isAvailable = !availability || availability.available;

                return (
                  <AnimatedSection 
                    key={pass.id} 
                    animation="fadeInUp" 
                    delay={index * 100}
                    className="h-full"
                  >
                    <div className={[
                      'relative h-full flex flex-col p-1 rounded-[2rem] transition-transform duration-300 hover:-translate-y-2',
                      isHighlight ? 'bg-gradient-to-b from-[#C5C5B5] to-[#C5C5B5]/20' : 'bg-white/10'
                    ].join(' ')}>
                      
                      {/* Inner Card */}
                      <div className="flex-1 flex flex-col bg-[#1E1F1E] rounded-[1.8rem] p-6 md:p-8 h-full relative overflow-hidden">
                        
                        {/* Badge for Highlight */}
                        {isHighlight && (
                          <div className="absolute top-0 right-0 px-4 py-1 bg-[#C5C5B5] rounded-bl-2xl text-[#1E1F1E] text-xs font-bold uppercase tracking-wider">
                            Best Value
                          </div>
                        )}

                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-white mb-2">{pass.name}</h3>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-[#C5C5B5]">€{pass.price}</span>
                            <span className="text-white/40 text-sm">{getDurationLabel(pass)}</span>
                          </div>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                          {pass.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                              <CheckCircle2 className="w-4 h-4 text-[#C5C5B5] shrink-0 mt-0.5" />
                              <span className="leading-snug">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {/* CTA Button Area */}
                        <div className="mt-auto">
                          {!isAvailable ? (
                             <div className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center text-sm font-medium flex items-center justify-center gap-2">
                               <AlertCircle className="w-4 h-4" />
                               {availability?.reason === 'at_capacity' ? 'Sold Out' : 'Unavailable'}
                             </div>
                          ) : (
                            <Link
                              to={`/coworking/book?pass=${pass.slug}`}
                              className={[
                                'w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
                                isHighlight 
                                  ? 'bg-[#C5C5B5] text-[#1E1F1E] hover:bg-white hover:shadow-lg' 
                                  : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/30'
                              ].join(' ')}
                            >
                              Book Now <ArrowRight className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                        
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          )}

          {/* Lookup Link */}
          <div className="mt-16 text-center">
            <Link to="/coworking/booking/lookup" className="text-[#C5C5B5]/60 hover:text-[#C5C5B5] text-sm underline underline-offset-4 transition-colors">
              Already have a booking? Manage it here
            </Link>
          </div>
        </div>
      </section>

      {/* --- HORIZONTAL GALLERY --- */}
      {images.length > 0 && (
        <section className="py-24 bg-[#1E1F1E] border-t border-white/5">
          <div className="container mb-10">
            <h2 className="text-2xl font-bold text-white">The Space</h2>
          </div>
          
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-4 md:px-[calc((100vw-1200px)/2)] pb-8 scrollbar-hide">
            {images.map((image, index) => (
               <div
                 key={image.id}
                 className="flex-none snap-center w-[85vw] md:w-[600px] aspect-[16/9] rounded-3xl overflow-hidden relative group bg-[#1E1F1E]"
               >
                 <OptimizedImage
                   src={image.image_url}
                   alt={image.alt_text}
                   className="transition-transform duration-700 group-hover:scale-105"
                   width={1200}
                   height={675}
                   objectFit="contain"
                   objectPosition="center"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
               </div>
            ))}
          </div>
        </section>
      )}

      {/* --- FINAL CTA --- */}
      <section className="py-32 bg-[#C5C5B5] text-[#1E1F1E] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#1E1F1E] to-transparent opacity-20" />
        
        <div className="container relative z-10 text-center">
          <AnimatedSection animation="fadeInUp">
            <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
              Ready to <br />Get to Work?
            </h2>
            <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto opacity-80">
              Join a community of creators, founders, and remote workers in the heart of Funchal.
            </p>
            <button
               onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
               className="px-10 py-5 bg-[#1E1F1E] text-[#C5C5B5] rounded-full font-bold text-lg shadow-2xl hover:scale-105 transition-transform"
            >
              Select Your Plan
            </button>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
};

export default CoworkingPage;