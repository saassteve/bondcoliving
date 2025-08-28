import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, Wifi, Coffee, Users, Calendar, MapPin, Moon, Clock, ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedSection from '../../components/AnimatedSection';

const pricingPlans = [
  {
    name: 'Day Pass',
    price: '15',
    duration: 'per day',
    features: [
      'Full access to coworking space',
      'High-speed WiFi',
      'Coffee & refreshments',
      'Community events access',
    ],
    highlight: false,
    description: 'Perfect for trying out the space'
  },
  {
    name: '1 Week Pass',
    price: '68',
    duration: 'per week',
    features: [
      'All Day Pass features',
      'Hot desk access',
      'Community events access',
      'Priority support',
    ],
    highlight: false,
    description: 'Great for short visits'
  },
  {
    name: 'Monthly Hot Desk',
    price: '149',
    duration: 'per month',
    features: [
      'All Weekly Pass features',
      'Hot desk reservation system',
      '24/7 access to the space',
      'Meeting room access',
      'Community events access',
    ],
    highlight: true,
    description: 'Most popular choice'
  },
  {
    name: 'Dedicated Desk',
    price: '199',
    duration: 'per month',
    features: [
      'Your own dedicated workspace',
      'Personal storage locker',
      'Business address service',
      '24/7 access to the space',
      'Priority meeting room booking',
      'Community events access',
    ],
    highlight: false,
    description: 'Your permanent workspace'
  },
];

const amenities = [
  { icon: Wifi, name: 'Enterprise WiFi', description: 'Fiber internet with 1Gbps speeds for seamless video calls' },
  { icon: Coffee, name: 'Premium Coffee', description: 'Artisanal coffee and organic teas available throughout the day' },
  { icon: Users, name: 'Curated Community', description: 'Connect with vetted remote workers and digital nomads' },
  { icon: Calendar, name: 'Regular Events', description: 'Weekly skill shares, networking, and island adventures' },
  { icon: MapPin, name: 'Central Location', description: '5 minutes to ocean, cafes, restaurants, and transport' },
  { icon: Moon, name: '24/7 Access', description: 'Work on your schedule with round-the-clock access' },
];

const CoworkingPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Digital Nomad Coworking Space Central Funchal - Opening September 2025 | Bond Madeira</title>
        <meta name="description" content="Premium coworking space for digital nomads in central Funchal, Madeira. Opening September 2025. Enterprise-grade WiFi, community events, 5 minutes to ocean. Day, weekly & monthly passes." />
        <meta name="keywords" content="digital nomad coworking Funchal, coworking space central Funchal, remote work space Madeira, nomad workspace Funchal center, coworking passes digital nomads, office space central Madeira, work from Funchal" />
        <link rel="canonical" href="https://stayatbond.com/coworking" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Digital Nomad Coworking Space Central Funchal - Opening September 2025 | Bond Madeira" />
        <meta property="og:description" content="Premium coworking space for digital nomads in central Funchal, Madeira. Enterprise-grade WiFi, community events, 5 minutes to ocean." />
        <meta property="og:url" content="https://stayatbond.com/coworking" />
        <meta property="og:image" content="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" />
        
        {/* Twitter */}
        <meta name="twitter:title" content="Digital Nomad Coworking Space Central Funchal - Opening September 2025 | Bond Madeira" />
        <meta name="twitter:description" content="Premium coworking space for digital nomads in central Funchal, Madeira. Enterprise-grade WiFi, community events, 5 minutes to ocean." />
        <meta name="twitter:image" content="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" />
      </Helmet>
      
      {/* Hero */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center"></div>
        <div className="container relative z-20">
          <div className="max-w-4xl">
            <AnimatedSection animation="fadeInUp">
              <div className="mb-8">
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-[#C5C5B5]/10 backdrop-blur-sm text-[#C5C5B5] text-sm uppercase tracking-wide mb-8 border border-[#C5C5B5]/20">
                  <Clock className="w-4 h-4 mr-2" />
                  Opening September 2025
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-8">
                  <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                    Work Different
                  </span>
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-[#C5C5B5] mb-8 leading-relaxed">
                A productive workspace designed for digital nomads in the heart of Funchal. 
                Join our community of remote workers and island entrepreneurs.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* Intro */}
      <section className="py-24 bg-[#1E1F1E]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <AnimatedSection animation="fadeInLeft">
              <div>
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#C5C5B5]/5 text-[#C5C5B5]/80 text-sm uppercase tracking-wide mb-8">
                  Coming September 2025
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8">
                  <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                    More Than Just a Desk
                  </span>
                </h2>
                <div className="space-y-6 text-xl text-[#C5C5B5]/90 leading-relaxed">
                  <p>
                    Bond's coworking space is designed for focus and connection. With enterprise-grade WiFi, 
                    ergonomic workstations, and a community of like-minded professionals, it's the perfect 
                    environment for getting things done.
                  </p>
                  <p>
                    Whether you need a quiet space for deep work or want to collaborate with fellow nomads, 
                    our space adapts to your workflow and schedule.
                  </p>
                </div>
                
                <div className="mt-8 p-6 bg-[#C5C5B5]/10 rounded-2xl border border-[#C5C5B5]/20">
                  <div className="flex items-center mb-3">
                    <Star className="w-5 h-5 text-[#C5C5B5] mr-3" />
                    <h3 className="text-lg font-bold text-[#C5C5B5]">Early Access</h3>
                  </div>
                  <p className="text-[#C5C5B5]/80">
                    Be among the first to experience this unique workspace. 
                    Contact us for founding member benefits and early access opportunities.
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
      <section className="py-24 bg-[#C5C5B5]">
        <div className="container">
          <AnimatedSection animation="fadeInUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#1E1F1E] mb-6">
                Flexible Workspace Options
              </h2>
              <p className="text-xl text-[#1E1F1E]/80 max-w-2xl mx-auto">
                Choose the plan that fits your work style and schedule. All plans include our full range of amenities.
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <AnimatedSection
                key={index}
                animation="fadeInUp"
                delay={200 + (index * 100)}
                className={`bg-[#1E1F1E] rounded-2xl overflow-hidden transition-all duration-300 ${
                  plan.highlight 
                    ? 'ring-2 ring-[#C5C5B5] transform hover:-translate-y-2 shadow-2xl'
                    : 'hover:ring-1 hover:ring-[#C5C5B5]/50 hover:-translate-y-1 shadow-lg hover:shadow-xl'
                }`}
              >
                {plan.highlight && (
                  <div className="bg-[#C5C5B5] text-[#1E1F1E] text-center py-2 text-sm font-bold uppercase tracking-wide">
                    {plan.description}
                  </div>
                )}
                
                <div className="p-6 lg:p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-xl lg:text-2xl font-bold mb-2 text-[#C5C5B5]">{plan.name}</h3>
                    {!plan.highlight && (
                      <p className="text-[#C5C5B5]/60 text-sm">{plan.description}</p>
                    )}
                  </div>
                  
                  <div className="text-center mb-8">
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-3xl lg:text-4xl font-bold text-[#C5C5B5]">€{plan.price}</span>
                      <span className="text-[#C5C5B5]/60 ml-2 text-sm">{plan.duration}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="w-4 h-4 text-[#C5C5B5] mr-3 flex-shrink-0 mt-1" />
                        <span className="text-[#C5C5B5]/80 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    disabled
                    className={`w-full px-6 py-3 rounded-full text-sm uppercase tracking-wide transition-all ${
                      plan.highlight
                        ? 'bg-[#C5C5B5]/20 text-[#C5C5B5]/60 cursor-not-allowed'
                        : 'bg-[#C5C5B5]/10 text-[#C5C5B5]/50 cursor-not-allowed'
                    }`}
                  >
                    Available September 2025
                  </button>
                </div>
              </AnimatedSection>
            ))}
          </div>
          
          <AnimatedSection animation="fadeInUp" delay={800}>
            <div className="text-center mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-[#1E1F1E]/10 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-[#1E1F1E] mb-3">Founding Member Benefits</h3>
                <p className="text-[#1E1F1E]/80 mb-4">
                  Join our early access list for exclusive founding member rates and priority booking when we open.
                </p>
                <a 
                  href="mailto:hello@stayatbond.com?subject=Coworking Early Access"
                  className="inline-flex items-center px-6 py-3 bg-[#1E1F1E] text-[#C5C5B5] rounded-full hover:bg-[#1E1F1E]/80 transition-all font-semibold text-sm uppercase tracking-wide"
                >
                  Get Early Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
      
      {/* Amenities */}
      <section className="py-24 bg-[#1E1F1E]">
        <div className="container">
          <AnimatedSection animation="fadeInUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                  Everything You Need to Thrive
                </span>
              </h2>
              <p className="text-xl text-[#C5C5B5]/80 max-w-2xl mx-auto">
                Our space is designed with remote workers in mind, providing all the tools and environment you need for productive work.
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {amenities.map((amenity, index) => {
              const Icon = amenity.icon;
              return (
                <AnimatedSection
                  key={index}
                  animation="fadeInUp"
                  delay={200 + (index * 100)}
                  className="bg-[#C5C5B5]/5 rounded-2xl p-8 border border-[#C5C5B5]/10 group hover:bg-[#C5C5B5]/10 transition-all duration-300 hover:transform hover:-translate-y-1"
                >
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-[#C5C5B5]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#C5C5B5]/20 transition-colors">
                      <Icon className="h-6 w-6 text-[#C5C5B5]" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[#C5C5B5]">{amenity.name}</h3>
                  <p className="text-[#C5C5B5]/80 leading-relaxed">{amenity.description}</p>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Bond Coworking */}
      <section className="py-24 bg-[#C5C5B5]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <AnimatedSection animation="fadeInLeft">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 text-[#1E1F1E]">
                  Why Bond Coworking?
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-[#1E1F1E]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Users className="w-4 h-4 text-[#1E1F1E]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1E1F1E] mb-2">Curated Community</h3>
                      <p className="text-[#1E1F1E]/80">
                        Work alongside vetted professionals who share your values of quality work and meaningful connections.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-[#1E1F1E]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <MapPin className="w-4 h-4 text-[#1E1F1E]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1E1F1E] mb-2">Perfect Location</h3>
                      <p className="text-[#1E1F1E]/80">
                        Central Funchal location puts you steps away from cafes, restaurants, and the ocean promenade.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-[#1E1F1E]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Coffee className="w-4 h-4 text-[#1E1F1E]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1E1F1E] mb-2">Island Lifestyle</h3>
                      <p className="text-[#1E1F1E]/80">
                        Work productively during the day, then explore levadas, beaches, and local culture in your free time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
            
            <AnimatedSection animation="fadeInRight" delay={200}>
              <div className="aspect-square bg-[#1E1F1E]/5 rounded-3xl overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                  alt="Digital nomads working together in a modern coworking space"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-32 bg-[#1E1F1E] relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#C5C5B5] rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C5C5B5] rounded-full blur-3xl"></div>
        </div>
        
        <div className="container text-center relative z-10">
          <AnimatedSection animation="fadeInUp">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-5xl md:text-6xl font-bold text-[#C5C5B5] mb-8">
                Ready to Work in Paradise?
              </h2>
              <p className="text-xl md:text-2xl text-[#C5C5B5]/80 mb-12 leading-relaxed">
                Join our early access list and be the first to know when our coworking space opens in September 2025. 
                Founding members get exclusive rates and priority access.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <a 
                  href="mailto:hello@stayatbond.com?subject=Coworking Early Access - Founding Member"
                  className="inline-flex items-center px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-semibold text-lg uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Join Early Access List
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
                
                <Link 
                  to="/apply"
                  className="inline-flex items-center px-8 py-4 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-full hover:bg-[#C5C5B5]/20 transition-all font-semibold text-lg uppercase tracking-wide border border-[#C5C5B5]/20"
                >
                  Book Accommodation
                </Link>
              </div>
              
              <div className="mt-8 text-[#C5C5B5]/60">
                <p className="text-sm">
                  Questions? Email us at{' '}
                  <a 
                    href="mailto:hello@stayatbond.com" 
                    className="text-[#C5C5B5] hover:text-white transition-colors underline"
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