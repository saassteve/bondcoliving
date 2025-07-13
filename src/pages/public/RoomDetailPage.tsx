import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, MapPin } from 'lucide-react';
import { apartmentService, type Apartment } from '../../lib/supabase';
import { getIconComponent } from '../../lib/iconUtils';

const RoomDetailPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  useEffect(() => {
    const fetchApartment = async () => {
      if (!roomId) {
        setError('Room ID not provided');
        setLoading(false);
        return;
      }

      try {
        const apartmentData = await apartmentService.getById(roomId);
        if (apartmentData) {
          // Fetch features and images
          const [features, images] = await Promise.all([
            apartmentService.getFeatures(roomId),
            apartmentService.getImages(roomId)
          ]);
          
          // Use featured image if available
          const featuredImage = images.find(img => img.is_featured);
          
          setApartment({
            ...apartmentData,
            features,
            images,
            image_url: featuredImage?.image_url || apartmentData.image_url
          });
          setLastFetch(Date.now());
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
  }, [roomId]);
  
  // Refresh data every 30 seconds to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastFetch > 30000) { // 30 seconds
        fetchApartment();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [lastFetch, roomId]);

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
  
  return (
    <>
      <Helmet>
        <title>{`${apartment.title} - Private Apartment | Bond Coliving Funchal, Madeira`}</title>
        <meta name="description" content={`${apartment.description} Located in Funchal, Madeira. €${apartment.price}/month. ${apartment.size} • ${apartment.capacity}. Book your stay at Bond.`} />
        <meta name="keywords" content={`${apartment.title}, Bond apartment, coliving Funchal, private apartment Madeira, ${apartment.size}, €${apartment.price}`} />
        <link rel="canonical" href={`https://stayatbond.com/room/${apartment.id}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${apartment.title} - Private Apartment | Bond Coliving Funchal, Madeira`} />
        <meta property="og:description" content={`${apartment.description} €${apartment.price}/month in Funchal, Madeira.`} />
        <meta property="og:url" content={`https://stayatbond.com/room/${apartment.id}`} />
        <meta property="og:image" content={apartment.image_url} />
        
        {/* Twitter */}
        <meta name="twitter:title" content={`${apartment.title} - Private Apartment | Bond Coliving Funchal, Madeira`} />
        <meta name="twitter:description" content={`${apartment.description} €${apartment.price}/month in Funchal, Madeira.`} />
        <meta name="twitter:image" content={apartment.image_url} />
      </Helmet>
      
      {/* Hero Section */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        {/* Availability Pill */}
        {apartment.available_from && (
          <div className="absolute top-8 right-8 z-20 opacity-90 hover:opacity-100 transition-opacity duration-300">
            <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium border border-white/20 shadow-lg">
              Available {new Date(apartment.available_from).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
              {apartment.available_until && (
                <span className="block text-xs opacity-70 mt-1">
                  Until {new Date(apartment.available_until).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
              )}
            </div>
          </div>
        )}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${apartment.image_url})` }}
        ></div>
        <div className="container relative z-20">
          <Link to="/" className="inline-flex items-center text-[#C5C5B5]/60 hover:text-[#C5C5B5] mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">{apartment.title}</h1>
          <p className="text-xl md:text-2xl text-[#C5C5B5]">{apartment.description}</p>
        </div>
      </section>
      
      {/* Details Section */}
      <section className="py-24 bg-[#1E1F1E]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="aspect-square bg-[#C5C5B5]/5 rounded-2xl overflow-hidden">
              <img 
                src={apartment.image_url} 
                alt={apartment.title}
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div>
              <div className="mb-12 p-8 bg-[#C5C5B5]/5 rounded-2xl">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <span className="block text-4xl font-bold">€{apartment.price.toLocaleString()}</span>
                    <span className="text-[#C5C5B5]/60">per month</span>
                  </div>
                  <Link to="/apply" className="btn-primary">
                    Apply to Stay
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-[#C5C5B5] mr-3" />
                    <span>{apartment.capacity}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-[#C5C5B5] mr-3" />
                    <span>{apartment.size}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      apartment.status === 'available' ? 'bg-green-100 text-green-800' :
                      apartment.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {apartment.status.charAt(0).toUpperCase() + apartment.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              
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
                
                <div>
                  <h2 className="text-2xl font-bold mb-6">About Your Stay</h2>
                  <div className="space-y-4 text-[#C5C5B5]/80">
                    <p>
                      All private apartments at Bond include access to our coworking space and community events. 
                      Utilities, cleaning service, and high-speed internet are included in the monthly price.
                    </p>
                    <p>
                      Minimum stay is one month, and we offer discounts for longer commitments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-[#C5C5B5]">
        <div className="container text-center">
          <h2 className="text-4xl font-bold text-[#1E1F1E] mb-8">
            Ready to join our community?
          </h2>
          <p className="text-xl text-[#1E1F1E]/80 mb-12">
            Apply now and start your journey with Bond.
          </p>
          <Link to="/apply" className="btn-primary">
            Apply Now
          </Link>
        </div>
      </section>
    </>
  );
};

export default RoomDetailPage;