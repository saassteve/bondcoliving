import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, Users, MapPin, Filter } from 'lucide-react';
import { apartmentService, availabilityService, type Apartment } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { getIconComponent } from '../../lib/iconUtils';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [filteredApartments, setFilteredApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'size' | 'name'>('price');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available'>('available');

  // Extract search parameters
  const location = searchParams.get('location') || '';
  const people = parseInt(searchParams.get('people') || '1');
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';

  useEffect(() => {
    fetchApartments();
  }, []);

  useEffect(() => {
    filterAndSortApartments();
  }, [apartments, sortBy, filterStatus, checkIn, checkOut]);

  const fetchApartments = async () => {
    try {
      setLoading(true);
      const apartments = await apartmentService.getAll();

      if (apartments.length === 0) {
        setApartments([]);
        return;
      }

      const apartmentIds = apartments.map(a => a.id);

      const [imagesResult, featuresResult] = await Promise.all([
        supabase
          .from('apartment_images')
          .select('*')
          .in('apartment_id', apartmentIds)
          .order('sort_order', { ascending: true }),
        supabase
          .from('apartment_features')
          .select('*')
          .in('apartment_id', apartmentIds)
          .order('sort_order', { ascending: true }),
      ]);

      const imagesByApartment = (imagesResult.data || []).reduce<Record<string, typeof imagesResult.data>>((acc, img) => {
        if (!acc[img.apartment_id]) acc[img.apartment_id] = [];
        acc[img.apartment_id]!.push(img);
        return acc;
      }, {});

      const featuresByApartment = (featuresResult.data || []).reduce<Record<string, typeof featuresResult.data>>((acc, feat) => {
        if (!acc[feat.apartment_id]) acc[feat.apartment_id] = [];
        acc[feat.apartment_id]!.push(feat);
        return acc;
      }, {});

      const apartmentsWithData = apartments.map((apartment) => {
        const images = imagesByApartment[apartment.id] || [];
        const features = featuresByApartment[apartment.id] || [];
        const featuredImage = images?.find((img) => img?.is_featured);

        return {
          ...apartment,
          image_url: featuredImage?.image_url || apartment.image_url,
          features,
        };
      });

      setApartments(apartmentsWithData);
    } catch (err) {
      setError('Failed to load apartments');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortApartments = async () => {
    let filtered = [...apartments];

    // Filter by availability status
    if (filterStatus === 'available') {
      filtered = filtered.filter(apt => apt.status === 'available');
    }

    // Filter by availability dates if provided - check actual availability data
    if (checkIn && checkOut) {
      const availableApartmentIds = await availabilityService.getAvailableApartments(checkIn, checkOut);

      filtered = filtered.filter(apt => {
        return availableApartmentIds.includes(apt.id);
      });
    }

    // Sort apartments
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'size':
          return parseInt(a.size) - parseInt(b.size);
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredApartments(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateStayDuration = () => {
    if (!checkIn || !checkOut) return '';
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    
    if (months > 0) {
      return days > 0 ? `${months} month${months > 1 ? 's' : ''}, ${days} day${days > 1 ? 's' : ''}` : `${months} month${months > 1 ? 's' : ''}`;
    }
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Search Results - Bond Coliving</title>
        </Helmet>
        <div className="container py-16 text-center">
          <div className="text-xl">Searching available apartments...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Search Results - Bond Coliving</title>
        </Helmet>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Search Error</h1>
          <p className="mb-6">{error}</p>
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
        <title>Available Apartments - Bond Coliving Funchal, Madeira</title>
        <meta name="description" content={`Find available apartments in ${location} for ${people} ${people === 1 ? 'person' : 'people'}. Premium coliving spaces with all amenities included.`} />
      </Helmet>
      
      {/* Header */}
      <section className="py-16 bg-[#1E1F1E]">
        <div className="container">
          <Link to="/" className="inline-flex items-center text-[#C5C5B5]/60 hover:text-[#C5C5B5] mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                Available Apartments
              </span>
            </h1>
            
            {/* Search Summary */}
            <div className="bg-[#C5C5B5]/5 rounded-2xl p-6 border border-[#C5C5B5]/10">
              <div className="flex flex-wrap items-center gap-6 text-[#C5C5B5]/80">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{location}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{people} {people === 1 ? 'person' : 'people'}</span>
                </div>
                {checkIn && checkOut && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(checkIn)} - {formatDate(checkOut)}</span>
                    <span className="ml-2 text-[#C5C5B5]/60">({calculateStayDuration()})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Filters and Sort */}
      <section className="py-8 bg-[#C5C5B5]/5 border-b border-[#C5C5B5]/10">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-[#C5C5B5] font-medium">
                {filteredApartments.length} apartment{filteredApartments.length !== 1 ? 's' : ''} found
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#C5C5B5]/60" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'available')}
                  className="bg-[#1E1F1E] text-[#C5C5B5] border border-[#C5C5B5]/20 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Apartments</option>
                  <option value="available">Available Only</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[#C5C5B5]/60 text-sm">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'price' | 'size' | 'name')}
                  className="bg-[#1E1F1E] text-[#C5C5B5] border border-[#C5C5B5]/20 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="price">Price (Low to High)</option>
                  <option value="size">Size</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Results */}
      <section className="py-16 bg-[#1E1F1E]">
        <div className="container">
          {filteredApartments.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-[#C5C5B5] mb-4">No apartments found</h3>
                <p className="text-[#C5C5B5]/80 mb-8">
                  Try adjusting your search criteria or dates to find available apartments.
                </p>
                <Link to="/" className="btn-primary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Search Again
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredApartments.map((apartment) => (
                <Link 
                  key={apartment.id}
                  to={`/room/${apartmentService.generateSlug(apartment.title)}`}
                  className="bg-[#C5C5B5]/5 group card hover:ring-2 hover:ring-[#C5C5B5]/20 transition-all hover:transform hover:-translate-y-1 shadow-lg apartment-card border border-[#C5C5B5]/10"
                >
                  <div className="aspect-video overflow-hidden">
                    {/* Availability Status */}
                    <div className="absolute top-3 left-3 z-10">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        apartment.status === 'available' 
                          ? 'bg-green-500/90 text-white' 
                          : 'bg-yellow-500/90 text-white'
                      }`}>
                        {apartment.status === 'available' ? 'Available' : 'Occupied'}
                      </div>
                    </div>
                    
                    {/* Availability Date */}
                    {apartment.available_from && (
                      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                          From {new Date(apartment.available_from).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                    )}
                    
                    <img 
                      src={apartment.image_url} 
                      alt={apartment.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  
                  <div className="p-6 card-content">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-[#C5C5B5]">{apartment.title}</h3>
                      <div className="text-right">
                        <div className="text-xl font-bold text-[#C5C5B5]">€{apartment.price.toLocaleString()}</div>
                        <div className="text-sm text-[#C5C5B5]/60">per month</div>
                      </div>
                    </div>
                    
                    <div className="h-16 mb-4">
                      <p className="text-[#C5C5B5]/80 text-sm leading-relaxed line-clamp-3">{apartment.description}</p>
                    </div>
                    
                    {/* Features */}
                    <div className="h-16 grid grid-cols-2 gap-3 mb-4">
                      {apartment.features?.slice(0, 4).map((feature, index) => {
                        const Icon = getIconComponent(feature.icon);
                        return (
                          <div key={index} className="flex items-center text-[#C5C5B5]/60">
                            <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="text-sm truncate">{feature.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-sm text-[#C5C5B5]/60">{apartment.size} • {apartment.capacity}</span>
                      </div>
                      <span className="inline-flex items-center text-[#C5C5B5] text-sm uppercase tracking-wide group-hover:text-white transition-colors">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default SearchResultsPage;