import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';

const ApplicationFormPage: React.FC = () => {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <>
      <Helmet>
        <title>Book Your Stay - Bond Coliving Funchal, Madeira | Digital Nomad Accommodation</title>
        <meta name="description" content="Reserve your private apartment at Bond Coliving in central Funchal, Madeira. Premium digital nomad accommodation with all amenities included. Minimum 30-day stays." />
        <meta name="keywords" content="book Bond coliving, reserve apartment Funchal, digital nomad booking Madeira, long term stay Funchal, coliving reservation central Madeira" />
        <link rel="canonical" href="https://stayatbond.com/apply" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Book Your Stay - Bond Coliving Funchal, Madeira" />
        <meta property="og:description" content="Reserve your private apartment at Bond Coliving in central Funchal, Madeira. Premium digital nomad accommodation with all amenities included." />
        <meta property="og:url" content="https://stayatbond.com/apply" />
        <meta property="og:image" content="https://iili.io/FcOqdX9.png" />
        
        {/* Twitter */}
        <meta name="twitter:title" content="Book Your Stay - Bond Coliving Funchal, Madeira" />
        <meta name="twitter:description" content="Reserve your private apartment at Bond Coliving in central Funchal, Madeira. Premium digital nomad accommodation with all amenities included." />
        <meta name="twitter:image" content="https://iili.io/FcOqdX9.png" />
      </Helmet>
      
      {/* Hero */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/6164986/pexels-photo-6164986.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center"></div>
        <div className="container relative z-20">
          <div className="max-w-3xl">
            <Link to="/" className="inline-flex items-center text-[#C5C5B5]/60 hover:text-[#C5C5B5] mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-5xl md:text-7xl font-bold mb-8">Book Your Stay</h1>
            <p className="text-xl md:text-2xl text-[#C5C5B5]">
              Search available apartments and book your stay with Bond.
            </p>
            <p className="text-[#C5C5B5]/80 mt-4">
              Minimum 30-day stays
            </p>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="py-16 bg-[#1E1F1E]">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Booking Widget Container */}
            <div className="bg-[#C5C5B5]/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#C5C5B5]/10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#C5C5B5] mb-4">
                  Search & Book
                </h3>
                <p className="text-[#C5C5B5]/80">
                  Use the booking system below to check availability and reserve your apartment.
                </p>
              </div>
              
              {/* Mangobeds Booking Widget - Using iframe approach */}
              <div className="relative min-h-[600px] bg-white rounded-2xl overflow-hidden">
                {/* Mangobeds Booking Widget - Using iframe approach */}
                <div className="relative min-h-[600px] bg-white rounded-2xl overflow-hidden">
                  {!iframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white">
                      <div className="text-center text-gray-600">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p>Loading booking system...</p>
                      </div>
                    </div>
                  )}
                  
                  <iframe
                    src="https://mangobeds.com/widget/booking-form?form_id=cmeud47d50005uqf7idelfqhq"
                    width="100%"
                    height="600"
                    frameBorder="0"
                    scrolling="auto"
                    onLoad={() => setIframeLoaded(true)}
                    onError={() => setIframeLoaded(true)}
                    className="w-full h-full min-h-[600px]"
                    title="Bond Coliving Booking System"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-12 text-center">
              <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 border border-[#C5C5B5]/10">
                <h4 className="text-lg font-bold text-[#C5C5B5] mb-3">Need Help?</h4>
                <p className="text-[#C5C5B5]/80 mb-4">
                  If you have any questions about booking or need assistance, we're here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="mailto:hello@stayatbond.com?subject=Booking Inquiry"
                    className="inline-flex items-center px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-semibold text-sm uppercase tracking-wide"
                  >
                    Email Us
                  </a>
                  <Link 
                    to="/#faq" 
                    className="inline-flex items-center px-6 py-3 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-full hover:bg-[#C5C5B5]/20 transition-all font-semibold text-sm uppercase tracking-wide border border-[#C5C5B5]/20"
                  >
                    View FAQ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ApplicationFormPage;