import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Home, Calendar, AlertCircle, Loader, Users, Maximize2 } from 'lucide-react';
import { apartmentService, availabilityService, apartmentBookingService, type Apartment } from '../../lib/supabase';
import { getIconComponent } from '../../lib/iconUtils';
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

      const apartments = await apartmentService.getAll();
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

      if (available.length === 0 && enableSplitStays) {
        const splitOptions = await apartmentBookingService.findSplitStayOptions(
          checkInDate,
          checkOutDate,
          maxSplitSegments
        );
        setSplitStayOptions(splitOptions);
        if (splitOptions.length > 0) {
          setSelectedOption('split');
          splitOptions.forEach(option => {
            option.forEach(seg => {
              if (!allApartmentsInOptions.find(apt => apt.id === seg.apartment.id)) {
                allApartmentsInOptions.push(seg.apartment);
              }
            });
          });
        }
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

  const calculateDailyRate = (monthlyPrice: number) => monthlyPrice / 30;

  const calculatePrice = (apartment: Apartment, startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.round(calculateDailyRate(apartment.price) * days * 100) / 100;
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
        <div className="space-y-4 mb-6">
          {availableApartments.map(apartment => {
            const price = calculatePrice(apartment, checkInDate, checkOutDate);
            const isSelected = selectedApartment?.id === apartment.id;

            return (
              <button
                key={apartment.id}
                onClick={() => setSelectedApartment(apartment)}
                className={`w-full p-4 rounded-lg border transition-all text-left ${
                  isSelected
                    ? 'bg-[#C5C5B5]/10 border-[#C5C5B5] ring-2 ring-[#C5C5B5]'
                    : 'bg-[#C5C5B5]/5 border-[#C5C5B5]/20 hover:bg-[#C5C5B5]/10'
                }`}
              >
                <div className="flex gap-4">
                  {apartmentImages[apartment.id] && (
                    <div className="flex-shrink-0 w-16 h-16">
                      <OptimizedImage
                        src={apartmentImages[apartment.id]}
                        alt={apartment.title}
                        width={64}
                        height={64}
                        className="object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#C5C5B5]">{apartment.title}</h3>
                        <p className="text-sm text-[#C5C5B5]/60">{apartment.size} • {apartment.capacity}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-xl font-bold text-[#C5C5B5]">{formatCurrency(price)}</div>
                        <div className="text-sm text-[#C5C5B5]/60">total</div>
                      </div>
                    </div>
                    <p className="text-sm text-[#C5C5B5]/80 mb-3">{apartment.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {apartment.features?.slice(0, 3).map((feature, index) => {
                        const Icon = getIconComponent(feature.icon);
                        return (
                          <div key={index} className="flex items-center text-xs text-[#C5C5B5]/60">
                            <Icon className="w-3 h-3 mr-1" />
                            {feature.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedOption === 'split' && splitStayOptions.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-blue-400 text-sm">
              Split-stay: Move between apartments during your stay. All transitions are handled smoothly.
            </p>
          </div>

          {splitStayOptions.map((option, optionIndex) => {
            const totalPrice = option.reduce((sum, seg) => sum + seg.price, 0);
            const isSelected = selectedSplitIndex === optionIndex;

            return (
              <button
                key={optionIndex}
                onClick={() => setSelectedSplitIndex(optionIndex)}
                className={`w-full p-4 rounded-lg border transition-all text-left ${
                  isSelected
                    ? 'bg-[#C5C5B5]/10 border-[#C5C5B5] ring-2 ring-[#C5C5B5]'
                    : 'bg-[#C5C5B5]/5 border-[#C5C5B5]/20 hover:bg-[#C5C5B5]/10'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-[#C5C5B5]">
                    Split Stay Option {optionIndex + 1} ({option.length} apartments)
                  </h3>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#C5C5B5]">{formatCurrency(totalPrice)}</div>
                    <div className="text-sm text-[#C5C5B5]/60">total</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {option.map((segment, segIndex) => (
                    <div key={segIndex} className="pl-4 border-l-2 border-[#C5C5B5]/20">
                      <div className="flex gap-3 items-start">
                        {apartmentImages[segment.apartment.id] && (
                          <div className="flex-shrink-0 w-12 h-12">
                            <OptimizedImage
                              src={apartmentImages[segment.apartment.id]}
                              alt={segment.apartment.title}
                              width={48}
                              height={48}
                              className="object-cover rounded-lg"
                            />
                          </div>
                        )}
                        <div className="flex-1 flex justify-between items-start">
                          <div>
                            <div className="text-sm font-bold text-[#C5C5B5]">{segment.apartment.title}</div>
                            <div className="text-xs text-[#C5C5B5]/60">
                              {new Date(segment.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                              {new Date(segment.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          <div className="text-sm text-[#C5C5B5] ml-3">{formatCurrency(segment.price)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
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
