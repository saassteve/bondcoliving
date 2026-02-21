import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Home, Calendar, AlertCircle, Loader, Users, Maximize2, ArrowRightCircle, CheckCircle, Info } from 'lucide-react';
import { apartmentService, availabilityService, apartmentBookingService, type Apartment } from '../../lib/supabase';
import { getIconComponent } from '../../lib/iconUtils';
import { calculateTotalPrice } from '../../lib/priceUtils';
import OptimizedImage from '../OptimizedImage';

interface ApartmentSelectionStepProps {
  checkInDate: string;
  checkOutDate: string;
  enableSplitStays: boolean;
  maxSplitSegments: number;
  initialSelection: Array<{
    apartment: Apartment;
    checkIn: string;
    checkOut: string;
    price: number;
  }>;
  onComplete: (segments: Array<{
    apartment: Apartment;
    checkIn: string;
    checkOut: string;
    price: number;
  }>) => void;
  onBack: () => void;
}

const ApartmentSelectionStep: React.FC<ApartmentSelectionStepProps> = ({
  checkInDate,
  checkOutDate,
  enableSplitStays,
  maxSplitSegments,
  initialSelection,
  onComplete,
  onBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [availableApartments, setAvailableApartments] = useState<Apartment[]>([]);
  const [splitStayOptions, setSplitStayOptions] = useState<Array<Array<{
    apartment: Apartment;
    checkIn: string;
    checkOut: string;
    price: number;
  }>>>([]);
  const [selectedOption, setSelectedOption] = useState<'single' | 'split'>('single');
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [selectedSplitIndex, setSelectedSplitIndex] = useState<number>(0);
  const [apartmentImages, setApartmentImages] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAvailability();
  }, [checkInDate, checkOutDate]);

  useEffect(() => {
    if (initialSelection.length > 0) {
      if (initialSelection.length === 1) {
        setSelectedOption('single');
        setSelectedApartment(initialSelection[0].apartment);
      } else {
        setSelectedOption('split');
        const matchingIndex = splitStayOptions.findIndex(option =>
          option.length === initialSelection.length &&
          option.every((seg, i) => seg.apartment.id === initialSelection[i].apartment.id)
        );
        if (matchingIndex !== -1) {
          setSelectedSplitIndex(matchingIndex);
        }
      }
    }
  }, [initialSelection, splitStayOptions]);

  const loadAvailability = async () => {
    try {
      setLoading(true);

      const apartments = await apartmentService.getAllForBooking();
      const activeApartments = apartments.filter(apt => apt.status === 'available');

      const availabilityChecks = await Promise.all(
        activeApartments.map(async (apartment) => {
          const isAvailable = await availabilityService.checkAvailability(
            apartment.id,
            checkInDate,
            checkOutDate
          );
          return { apartment, isAvailable };
        })
      );

      const available = availabilityChecks
        .filter(check => check.isAvailable)
        .map(check => check.apartment);

      setAvailableApartments(available);

      const allApartmentsInOptions: Apartment[] = [...available];

      // ALWAYS check for split-stay options if enabled, regardless of single apartment availability
      // This allows users to choose split-stays even when single units are available
      if (enableSplitStays) {
        const splitOptions = await apartmentBookingService.findSplitStayOptions(
          checkInDate,
          checkOutDate,
          maxSplitSegments
        );
        setSplitStayOptions(splitOptions);

        // Auto-select split if no single apartments available
        if (available.length === 0 && splitOptions.length > 0) {
          setSelectedOption('split');
        }

        // Add all apartments from split options to the image loading list
        splitOptions.forEach(option => {
          option.forEach(seg => {
            if (!allApartmentsInOptions.find(apt => apt.id === seg.apartment.id)) {
              allApartmentsInOptions.push(seg.apartment);
            }
          });
        });
      }

      const imageMap: Record<string, string> = {};
      await Promise.all(
        allApartmentsInOptions.map(async (apartment) => {
          try {
            const images = await apartmentService.getImages(apartment.id);
            const featuredImage = images.find(img => img.is_featured);
            imageMap[apartment.id] = featuredImage?.image_url || images[0]?.image_url || apartment.image_url || '';
          } catch (err) {
            console.error(`Error loading image for apartment ${apartment.id}:`, err);
            imageMap[apartment.id] = apartment.image_url || '';
          }
        })
      );
      setApartmentImages(imageMap);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (apartment: Apartment, startDate: string, endDate: string) => {
    return Math.round(calculateTotalPrice(apartment, new Date(startDate), new Date(endDate)) * 100) / 100;
  };

  const handleContinue = () => {
    if (selectedOption === 'single' && selectedApartment) {
      const price = calculatePrice(selectedApartment, checkInDate, checkOutDate);
      onComplete([{
        apartment: selectedApartment,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        price,
      }]);
    } else if (selectedOption === 'split' && splitStayOptions[selectedSplitIndex]) {
      onComplete(splitStayOptions[selectedSplitIndex]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-8 h-8 text-[#C5C5B5] animate-spin mb-4" />
        <p className="text-[#C5C5B5]/80">Checking availability...</p>
      </div>
    );
  }

  if (availableApartments.length === 0 && splitStayOptions.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-[#C5C5B5] mb-4">No Availability</h2>
        <div className="p-6 bg-yellow-500/10 rounded-lg border border-yellow-500/20 mb-6">
          <AlertCircle className="w-6 h-6 text-yellow-400 mb-2" />
          <p className="text-yellow-400 mb-2">
            Unfortunately, no apartments are available for your selected dates.
          </p>
          <p className="text-[#C5C5B5]/60 text-sm">
            Please try different dates or contact us directly for assistance.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-lg hover:bg-[#C5C5B5]/20 transition-colors flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Change Dates
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#C5C5B5] mb-2">Select Your Apartment</h2>
      <p className="text-[#C5C5B5]/60 mb-6">
        Choose from available apartments or split-stay options
      </p>

      {availableApartments.length > 0 && splitStayOptions.length > 0 && (
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setSelectedOption('single')}
            className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
              selectedOption === 'single'
                ? 'bg-[#C5C5B5] text-[#1E1F1E] border-[#C5C5B5]'
                : 'bg-[#C5C5B5]/5 text-[#C5C5B5] border-[#C5C5B5]/20 hover:bg-[#C5C5B5]/10'
            }`}
          >
            <Home className="w-5 h-5 inline-block mr-2" />
            Single Apartment
          </button>
          <button
            onClick={() => setSelectedOption('split')}
            className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
              selectedOption === 'split'
                ? 'bg-[#C5C5B5] text-[#1E1F1E] border-[#C5C5B5]'
                : 'bg-[#C5C5B5]/5 text-[#C5C5B5] border-[#C5C5B5]/20 hover:bg-[#C5C5B5]/10'
            }`}
          >
            <Calendar className="w-5 h-5 inline-block mr-2" />
            Split Stay
          </button>
        </div>
      )}

      {selectedOption === 'single' && availableApartments.length > 0 && (
        <div className="space-y-6 mb-6">
          {availableApartments.map(apartment => {
            const price = calculatePrice(apartment, checkInDate, checkOutDate);
            const isSelected = selectedApartment?.id === apartment.id;
            const nights = Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));

            return (
              <button
                key={apartment.id}
                onClick={() => setSelectedApartment(apartment)}
                className={`w-full rounded-xl border transition-all text-left overflow-hidden group ${
                  isSelected
                    ? 'bg-[#C5C5B5]/10 border-[#C5C5B5] ring-2 ring-[#C5C5B5] shadow-lg shadow-[#C5C5B5]/20'
                    : 'bg-[#C5C5B5]/5 border-[#C5C5B5]/20 hover:bg-[#C5C5B5]/10 hover:border-[#C5C5B5]/40'
                }`}
              >
                <div className="md:flex">
                  {apartmentImages[apartment.id] && (
                    <div className="md:w-72 md:flex-shrink-0 h-56 md:h-auto relative overflow-hidden">
                      <OptimizedImage
                        src={apartmentImages[apartment.id]}
                        alt={apartment.title}
                        width={288}
                        height={224}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isSelected && (
                        <div className="absolute top-4 right-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full p-2">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-[#C5C5B5] mb-2">{apartment.title}</h3>
                        <div className="flex items-center gap-4 text-[#C5C5B5]/60 text-sm">
                          <span className="flex items-center">
                            <Maximize2 className="w-4 h-4 mr-1" />
                            {apartment.size}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {apartment.capacity}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-3xl font-bold text-[#C5C5B5]">{formatCurrency(price)}</div>
                        <div className="text-sm text-[#C5C5B5]/60">for {nights} nights</div>
                      </div>
                    </div>

                    <p className="text-[#C5C5B5]/80 mb-4 line-clamp-2">{apartment.description}</p>

                    {apartment.features && apartment.features.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {apartment.features.slice(0, 6).map((feature, index) => {
                          const Icon = getIconComponent(feature.icon);
                          return (
                            <div key={index} className="flex items-center text-sm text-[#C5C5B5]/70 bg-[#C5C5B5]/5 px-3 py-1.5 rounded-lg">
                              <Icon className="w-4 h-4 mr-2" />
                              {feature.label}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedOption === 'split' && splitStayOptions.length > 0 && (
        <div className="space-y-6 mb-6">
          <div className="p-6 bg-gradient-to-r from-blue-500/10 to-[#C5C5B5]/10 rounded-xl border border-blue-500/30">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-blue-400 font-semibold mb-2">Split-Stay Options Available</h3>
                <p className="text-[#C5C5B5]/80 text-sm leading-relaxed">
                  {availableApartments.length === 0
                    ? "No single apartment is available for your entire stay, but you can split your booking across multiple apartments."
                    : "You can also choose to split your stay across multiple apartments for more flexibility."
                  }
                  {" "}We'll handle everything - just pack your bags and move on your scheduled dates. All cleaning and transitions are coordinated for you.
                </p>
              </div>
            </div>
          </div>

          {splitStayOptions.map((option, optionIndex) => {
            const totalPrice = option.reduce((sum, seg) => sum + seg.price, 0);
            const isSelected = selectedSplitIndex === optionIndex;
            const totalNights = option.reduce((sum, seg) => {
              const nights = Math.ceil((new Date(seg.checkOut).getTime() - new Date(seg.checkIn).getTime()) / (1000 * 60 * 60 * 24));
              return sum + nights;
            }, 0);

            return (
              <button
                key={optionIndex}
                onClick={() => setSelectedSplitIndex(optionIndex)}
                className={`w-full rounded-xl border transition-all text-left overflow-hidden ${
                  isSelected
                    ? 'bg-[#C5C5B5]/10 border-[#C5C5B5] ring-2 ring-[#C5C5B5] shadow-lg shadow-[#C5C5B5]/20'
                    : 'bg-[#C5C5B5]/5 border-[#C5C5B5]/20 hover:bg-[#C5C5B5]/10 hover:border-[#C5C5B5]/40'
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-[#C5C5B5] mb-1">
                        {option.length === 2 ? 'Two-Apartment Stay' : `${option.length}-Apartment Stay`}
                      </h3>
                      <p className="text-sm text-[#C5C5B5]/60">
                        {option.length} moves • {totalNights} total nights
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-[#C5C5B5]">{formatCurrency(totalPrice)}</div>
                      <div className="text-sm text-[#C5C5B5]/60">total price</div>
                    </div>
                  </div>

                  {/* Visual Timeline */}
                  <div className="relative mb-6">
                    {option.map((segment, segIndex) => {
                      const nights = Math.ceil((new Date(segment.checkOut).getTime() - new Date(segment.checkIn).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={segIndex} className="relative">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-[#C5C5B5] text-[#1E1F1E] rounded-full flex items-center justify-center font-bold text-sm">
                              {segIndex + 1}
                            </div>
                            <div className="flex-1 bg-[#C5C5B5]/10 rounded-lg p-3 border border-[#C5C5B5]/20">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-[#C5C5B5] font-medium">
                                  {new Date(segment.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <ArrowRightCircle className="w-4 h-4 text-[#C5C5B5]/40" />
                                <span className="text-[#C5C5B5] font-medium">
                                  {new Date(segment.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {segIndex < option.length - 1 && (
                            <div className="ml-5 mb-3 flex items-center gap-2 text-xs text-[#C5C5B5]/40">
                              <div className="w-px h-6 bg-[#C5C5B5]/20"></div>
                              <ArrowRight className="w-3 h-3" />
                              <span>Move to next apartment</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Apartment Details */}
                  <div className="space-y-4">
                    {option.map((segment, segIndex) => {
                      const nights = Math.ceil((new Date(segment.checkOut).getTime() - new Date(segment.checkIn).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={segIndex} className="flex gap-4 p-4 bg-[#C5C5B5]/5 rounded-lg border border-[#C5C5B5]/10">
                          {apartmentImages[segment.apartment.id] && (
                            <div className="flex-shrink-0 w-24 h-24">
                              <OptimizedImage
                                src={apartmentImages[segment.apartment.id]}
                                alt={segment.apartment.title}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-[#C5C5B5]">{segment.apartment.title}</h4>
                                <p className="text-xs text-[#C5C5B5]/60">
                                  {segment.apartment.size} • {segment.apartment.capacity}
                                </p>
                              </div>
                              <div className="text-right ml-3">
                                <div className="font-bold text-[#C5C5B5]">{formatCurrency(segment.price)}</div>
                                <div className="text-xs text-[#C5C5B5]/60">{nights} nights</div>
                              </div>
                            </div>
                            {segment.apartment.features && segment.apartment.features.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {segment.apartment.features.slice(0, 3).map((feature, idx) => {
                                  const Icon = getIconComponent(feature.icon);
                                  return (
                                    <div key={idx} className="flex items-center text-xs text-[#C5C5B5]/60">
                                      <Icon className="w-3 h-3 mr-1" />
                                      {feature.label}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {isSelected && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-[#C5C5B5] text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Selected</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-lg hover:bg-[#C5C5B5]/20 transition-colors flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={
            (selectedOption === 'single' && !selectedApartment) ||
            (selectedOption === 'split' && !splitStayOptions[selectedSplitIndex])
          }
          className="flex-1 px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-lg hover:bg-white transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default ApartmentSelectionStep;
