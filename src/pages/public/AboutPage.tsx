import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Users, Heart, Coffee, Map } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>About Bond - Digital Nomad Coliving Founders | Central Funchal, Madeira</title>
        <meta name="description" content="Meet the founders of Bond - premium digital nomad coliving in central Funchal, Madeira. Learn how Steve and Rui created the perfect space for remote workers with all amenities included." />
        <meta name="keywords" content="Bond founders, digital nomad coliving Funchal, Steve and Rui Bond, coliving story Madeira, remote work community Funchal, digital nomad accommodation founders" />
        <link rel="canonical" href="https://stayatbond.com/about" />
        
        {/* Open Graph */}
        <meta property="og:title" content="About Bond - Digital Nomad Coliving Founders | Central Funchal, Madeira" />
        <meta property="og:description" content="Meet the founders of Bond - premium digital nomad coliving in central Funchal, Madeira. Steve and Rui created the perfect space for remote workers." />
        <meta property="og:url" content="https://stayatbond.com/about" />
        <meta property="og:image" content="https://iili.io/Fcjd2jf.png" />
        
        {/* Twitter */}
        <meta name="twitter:title" content="About Bond - Digital Nomad Coliving Founders | Central Funchal, Madeira" />
        <meta name="twitter:description" content="Meet the founders of Bond - premium digital nomad coliving in central Funchal, Madeira. Steve and Rui created the perfect space for remote workers." />
        <meta name="twitter:image" content="https://iili.io/Fcjd2jf.png" />
      </Helmet>
      
      {/* Hero */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/6164986/pexels-photo-6164986.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center"></div>
        <div className="container relative z-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-8">Our Story</h1>
            <p className="text-xl md:text-2xl text-[#C5C5B5]">
              A father and son's journey to creating something meaningful.
            </p>
          </div>
        </div>
      </section>
      
      {/* Main Story */}
      <section className="py-24 bg-[#1E1F1E]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.2em] text-[#C5C5B5]/60 font-medium mb-4">
                  Our Story
                </p>
                <h2 className="text-4xl md:text-5xl font-bold mb-8">
                  <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                    Finding Our Bond
                  </span>
                </h2>
              </div>
              <div className="space-y-6 text-xl text-[#C5C5B5]/90 leading-relaxed">
                <p>
                  After years apart, father and son duo Steve and Rui finally found their bond in Madeira. 
                </p>
                <p>
                  Steve's remote tech work brought him home, but it was their rekindled connection that inspired BOND - a space where ambitious professionals can discover their own perfect blend of meaningful work and island living.
                </p>
                <p>
                  What started as a personal journey became a vision: creating a place where others could find their own balance between independence and community, work and life, ambition and peace.
                </p>
              </div>
            </div>
            
            <div className="aspect-square bg-[#C5C5B5]/5 rounded-3xl overflow-hidden">
              <img 
                src="https://ucarecdn.com/958a4400-0486-4ba2-8e75-484d692d7df9/foundersbond.png"
                alt="Steve and Rui - founders of Bond coliving space in Funchal, Madeira, father and son team creating community for digital nomads"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Values */}
      <section className="py-24 bg-[#C5C5B5]">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1E1F1E] mb-6">What We Believe</h2>
            <p className="text-xl text-[#1E1F1E]/80">
              The values that guide everything we do at Bond.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-[#1E1F1E] p-8 rounded-2xl">
              <div className="mb-6">
                <div className="w-12 h-12 bg-[#C5C5B5]/10 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-[#C5C5B5]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#C5C5B5]">Connection</h3>
              <p className="text-[#C5C5B5]/80 leading-relaxed">
                We believe meaningful relationships are built through shared experiences and mutual respect for independence.
              </p>
            </div>
            
            <div className="bg-[#1E1F1E] p-8 rounded-2xl">
              <div className="mb-6">
                <div className="w-12 h-12 bg-[#C5C5B5]/10 rounded-xl flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-[#C5C5B5]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#C5C5B5]">Balance</h3>
              <p className="text-[#C5C5B5]/80 leading-relaxed">
                Work and life shouldn't compete - they should complement each other in an environment that inspires both.
              </p>
            </div>
            
            <div className="bg-[#1E1F1E] p-8 rounded-2xl">
              <div className="mb-6">
                <div className="w-12 h-12 bg-[#C5C5B5]/10 rounded-xl flex items-center justify-center mb-4">
                  <Coffee className="h-6 w-6 text-[#C5C5B5]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#C5C5B5]">Quality</h3>
              <p className="text-[#C5C5B5]/80 leading-relaxed">
                From the spaces we create to the experiences we curate, we believe in doing fewer things exceptionally well.
              </p>
            </div>
            
            <div className="bg-[#1E1F1E] p-8 rounded-2xl">
              <div className="mb-6">
                <div className="w-12 h-12 bg-[#C5C5B5]/10 rounded-xl flex items-center justify-center mb-4">
                  <Map className="h-6 w-6 text-[#C5C5B5]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#C5C5B5]">Place</h3>
              <p className="text-[#C5C5B5]/80 leading-relaxed">
                Madeira isn't just our location - it's our inspiration. This island teaches us daily about finding beauty in simplicity.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;