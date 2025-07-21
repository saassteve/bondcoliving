import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { apartmentService, type Apartment } from '../../lib/supabase';
import { getIconComponent } from '../../lib/iconUtils';

const RoomDetailPage: React.FC = () => {
  const { roomSlug } = useParams<{ roomSlug: string }>();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  useEffect(() => {
    const fetchApartment = async () => {
      if (!roomSlug) {
        setError('Room slug not provided');
        setLoading(false);
        return;
      }

      try {
        // First try to find by slug
        let apartmentData = await apartmentService.getBySlug(roomSlug);
        
        // If not found by slug, try by ID (for backward compatibility)
        if (!apartmentData) {
          apartmentData = await apartmentService.getById(roomSlug);
        }
        
        if (apartmentData) {
          // Fetch features and images
          const [features, images] = await Promise.all([
            apartmentService.getFeatures(apartmentData.id),
            apartmentService.getImages(apartmentData.id)
          ]);
          
          // Sort images with featured image first
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
            image_url: sortedImages[0]?.image_url || apartmentData.image_url
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
    
    const fetchApartment = async () => {
      if (!roomSlug) {
        setError('Room slug not provided');
        setLoading(false);
        return;
      }

      try {
        // First try to find by slug
        let apartmentData = await apartmentService.getBySlug(roomSlug);
        
        // If not found by slug, try by ID (for backward compatibility)
        if (!apartmentData) {
          apartmentData = await apartmentService.getById(roomSlug);
        }
        
        if (apartmentData) {
          // Fetch features and images
          const [features, images] = await Promise.all([
            apartmentService.getFeatures(apartmentData.id),
            apartmentService.getImages(apartmentData.id)
          ]);
          
          // Sort images with featured image first
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
            image_url: sortedImages[0]?.image_url || apartmentData.image_url
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
  }, [roomSlug]);
  
  // Refresh data every 30 seconds to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastFetch > 30000) { // 30 seconds
        fetchApartment();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [lastFetch, roomSlug]);

  const nextImage = () => {
    if (apartment?.images && apartment.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === apartment.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const previousImage = () => {
    if (apartment?.images && apartment.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? apartment.images.length - 1 : prev - 1
      );
    }
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
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

  const currentImage = apartment.images && apartment.images.length > 0 
    ? apartment.images[currentImageIndex] 
    : null;
  const displayImageUrl = currentImage?.image_url || apartment.image_url;
  
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
        <meta property="og:url" content={`https://stayatbond.com/room/${apartment.slug}`} />
        <meta property="og:image" content={displayImageUrl} />
        
        {/* Twitter */}
        <meta name="twitter:title" content={`${apartment.title} - Private Apartment | Bond Coliving Funchal, Madeira`} />
        <meta name="twitter:description" content={`${apartment.description} €${apartment.price}/month in Funchal, Madeira.`} />
        <meta name="twitter:url" content={`https://stayatbond.com/room/${apartment.slug}`} />
        <meta name="twitter:image" content={displayImageUrl} />
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
          style={{ backgroundImage: `url(${displayImageUrl})` }}
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
            <div className="space-y-6">
              {/* Main Image */}
              <div className="relative aspect-square bg-[#C5C5B5]/5 rounded-2xl overflow-hidden group">
                <img 
                  src={displayImageUrl} 
                  alt={apartment.title}
                  className="w-full h-full object-cover transition-transform duration-300" 
                />
                
                {/* Navigation arrows - only show if multiple images */}
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
                    
                    {/* Image counter */}
                    <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {currentImageIndex + 1} / {apartment.images.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnail Gallery - only show if multiple images */}
              {apartment.images && apartment.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {apartment.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => goToImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                        index === currentImageIndex 
                          ? 'border-[#C5C5B5] ring-2 ring-[#C5C5B5]/30' 
                          : 'border-[#C5C5B5]/20 hover:border-[#C5C5B5]/50'
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={`${apartment.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {image.is_featured && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-[#C5C5B5] rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <div className="mb-12 p-8 bg-[#C5C5B5]/5 rounded-2xl">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <span className="block text-4xl font-bold">€{apartment.price.toLocaleString()}</span>
                    <span className="text-[#C5C5B5]/60">per month</span>
                  </div>
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
                
                {/* Clear Call-to-Action */}
                <div className="mt-8 p-6 bg-[#C5C5B5]/10 rounded-xl border border-[#C5C5B5]/20">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-[#C5C5B5] mb-3">Ready to call this home?</h3>
                    <p className="text-[#C5C5B5]/80 mb-6">Join our community and start your journey in Funchal</p>
                    <Link 
                      to="/apply" 
                      className="inline-flex items-center px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-semibold text-lg uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      Apply for This Apartment
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
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