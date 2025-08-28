import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, Wifi, Coffee, Users, Calendar, MapPin, Moon, Clock } from 'lucide-react';

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
  },
  {
    name: '1 Week Pass',
    price: '68',
    duration: 'per week',
    features: [
      'All Day Pass features',
      'Dedicated desk preference',
      'Community events access',
      'Priority booking',
    ],
    highlight: false,
  },
  {
    name: 'Monthly Hot Desk',
    price: '149',
    duration: 'per month',
    features: [
      'All Weekly Pass features',
      'Priority desk reservation',
      '24/7 access to the coworking space',
      'Community events access',
    ],
    highlight: true,
  },
  {
    name: 'Dedicated Desk',
    price: '199',
    duration: 'per month',
    features: [
      'Your own dedicated workspace',
      'Personal storage locker',
      'Business address service',
      '24/7 access to the coworking space',
      'Priority meeting room booking',
      'Community events access',
    ],
    highlight: false,
  },
];

const amenities = [
  { icon: Wifi, name: 'High-Speed WiFi', description: 'Enterprise-grade internet perfect for video calls' },
  { icon: Coffee, name: 'Coffee & Tea', description: 'Artisanal coffee and organic teas available all day' },
  { icon: Users, name: 'Community', description: 'Connect with like-minded remote workers and creatives' },
  { icon: Calendar, name: 'Events', description: 'Regular community events and workshops' },
  { icon: MapPin, name: 'Prime Location', description: 'Central Funchal with cafes and restaurants nearby' },
  { icon: Moon, name: '24/7 Access', description: 'Work whenever inspiration strikes (monthly members)' },
];

const CoworkingPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Digital Nomad Coworking Space Central Funchal - Opening August 2025 | Bond Madeira</title>
        <meta name="description" content="Premium coworking space for digital nomads in central Funchal, Madeira. Opening August 2025. Enterprise-grade WiFi, community events, 5 minutes to ocean. Day, weekly & monthly passes." />
        <meta name="keywords" content="digital nomad coworking Funchal, coworking space central Funchal, remote work space Madeira, nomad workspace Funchal center, coworking passes digital nomads, office space central Madeira, work from Funchal" />
        <link rel="canonical" href="https://stayatbond.com/coworking" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Digital Nomad Coworking Space Central Funchal - Opening August 2025 | Bond Madeira" />
        <meta property="og:description" content="Premium coworking space for digital nomads in central Funchal, Madeira. Enterprise-grade WiFi, community events, 5 minutes to ocean." />
        <meta property="og:url" content="https://stayatbond.com/coworking" />
        <meta property="og:image" content="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" />
        
        {/* Twitter */}
        <meta name="twitter:title" content="Digital Nomad Coworking Space Central Funchal - Opening August 2025 | Bond Madeira" />
        <meta name="twitter:description" content="Premium coworking space for digital nomads in central Funchal, Madeira. Enterprise-grade WiFi, community events, 5 minutes to ocean." />
        <meta name="twitter:image" content="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" />
      </Helmet>
      
      {/* Hero */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center"></div>
        <div className="container relative z-20">
          <div className="max-w-3xl">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#C5C5B5]/10 text-[#C5C5B5] text-sm uppercase tracking-wide mb-6">
                <Clock className="w-4 h-4 mr-2" />
                Opening August 2025
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-8">Work Different</h1>
            </div>
            <p className="text-xl md:text-2xl text-[#C5C5B5] mb-8">
              A productive workspace in paradise. Join our community of remote workers and digital nomads.
            </p>
          </div>
        </div>
      </section>
      
      {/* Intro */}
      <section className="py-24 bg-[#1E1F1E]">
        <div className="container">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold mb-8">More Than a Desk</h2>
            <p className="text-xl text-[#C5C5B5] leading-relaxed mb-8">
              Bond's coworking space is designed for focus and connection. With enterprise-grade WiFi, 
              ergonomic workstations, and a community of like-minded professionals, it's the perfect 
              environment for getting things done.
            </p>
            <div className="p-6 bg-[#C5C5B5]/10 rounded-2xl border border-[#C5C5B5]/20">
              <div className="flex items-center mb-3">
                <Calendar className="w-5 h-5 text-[#C5C5B5] mr-3" />
                <h3 className="text-lg font-bold text-[#C5C5B5]">Opening Soon</h3>
              </div>
              <p className="text-[#C5C5B5]/80">
                Our coworking space will be ready to welcome you in August 2025. 
                Be among the first to experience this unique workspace in the heart of Funchal.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing */}
      <section className="py-24 bg-[#C5C5B5]">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1E1F1E] mb-4">Coworking Passes</h2>
            <p className="text-lg text-[#1E1F1E]/70">Available from August 2025</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`bg-[#1E1F1E] rounded-2xl overflow-hidden transition-all ${
                  plan.highlight 
                    ? 'ring-2 ring-[#C5C5B5] transform hover:-translate-y-1'
                    : 'hover:ring-1 hover:ring-[#C5C5B5]/50'
                }`}
              >
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl font-bold">€{plan.price}</span>
                    <span className="text-[#C5C5B5]/60 ml-2">{plan.duration}</span>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="w-5 h-5 text-[#C5C5B5] mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-[#C5C5B5]/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    disabled
                    className="w-full px-6 py-3 bg-[#C5C5B5]/20 text-[#C5C5B5]/50 rounded-full cursor-not-allowed text-sm uppercase tracking-wide"
                  >
                    Available August 2025
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Amenities */}
      <section className="py-24 bg-[#1E1F1E]">
        <div className="container">
          <h2 className="text-4xl font-bold mb-16">Everything You Need</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {amenities.map((amenity, index) => {
              const Icon = amenity.icon;
              return (
                <div key={index} className="feature-card group hover:bg-[#C5C5B5]/5">
                  <div className="relative mb-6">
                    <div className="absolute -inset-2 bg-gradient-to-br from-[#C5C5B5]/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <Icon className="h-8 w-8" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{amenity.name}</h3>
                  <p className="text-[#C5C5B5]/60">{amenity.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-24 bg-[#C5C5B5]">
        <div className="container text-center">
          <h2 className="text-4xl font-bold text-[#1E1F1E] mb-8">Ready to Join?</h2>
          <p className="text-xl text-[#1E1F1E]/80 mb-12 max-w-2xl mx-auto">
            Be among the first to experience our coworking space when we open in August 2025. 
            Contact us to learn more about early access and founding member benefits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              disabled
              className="px-8 py-4 bg-[#1E1F1E]/20 text-[#1E1F1E]/50 rounded-full cursor-not-allowed font-medium uppercase tracking-wide"
            >
              Available August 2025
            </button>
            <a 
              href="mailto:hello@stayatbond.com?subject=Coworking Interest"
              className="px-8 py-4 bg-[#1E1F1E] text-[#C5C5B5] rounded-full hover:bg-[#1E1F1E]/80 transition-colors font-medium uppercase tracking-wide"
            >
              Get Early Access Info
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default CoworkingPage;