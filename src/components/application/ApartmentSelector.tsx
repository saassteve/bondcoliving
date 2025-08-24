import React from 'react';
import { Home, CheckCircle, AlertCircle } from 'lucide-react';
import AvailabilityDisplay from './AvailabilityDisplay';

interface ApartmentSelectorProps {
  formData: {
    apartment_preference: string;
    arrival_date: string;
    departure_date: string;
  };
  apartmentAvailability: Record<string, any>;
  checkingAvailability: boolean;
  onInputChange: (field: string, value: string) => void;
}

const ApartmentSelector: React.FC<ApartmentSelectorProps> = ({
  formData,
  apartmentAvailability,
  checkingAvailability,
  onInputChange
}) => {
  const getAvailableApartments = () => {
    const available = Object.values(apartmentAvailability)
      .filter((data: any) => data.isFullyAvailable)
      .map((data: any) => data.apartment);
    
    console.log('Fully available apartments:', available.map(apt => apt.title));
    return available;
  };

  const getPartiallyAvailableApartments = () => {
    const partial = Object.values(apartmentAvailability)
      .filter((data: any) => !data.isFullyAvailable && data.availableDays >= 14)
      .map((data: any) => data);
    
    console.log('Partially available apartments:', partial.map(data => `${data.apartment.title}: ${data.availableDays} days`));
    return partial;
  };

  // Debug logging
  console.log('ApartmentSelector - apartmentAvailability:', apartmentAvailability);
  console.log('ApartmentSelector - checkingAvailability:', checkingAvailability);

  return (
    <div className="space-y-6">
      <div className="relative group">
        <label htmlFor="apartment_preference" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
          Apartment Preference {checkingAvailability && <span className="text-xs animate-pulse text-blue-400">(Checking live availability...)</span>}
        </label>
        <div className="relative">
          <Home className="absolute left-4 top-4 w-5 h-5 text-[#C5C5B5]/60" />
          <select
            id="apartment_preference"
            value={formData.apartment_preference}
            onChange={(e) => onInputChange('apartment_preference', e.target.value)}
            className={`w-full pl-12 pr-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] focus:outline-none focus:border-[#C5C5B5] transition-all appearance-none cursor-pointer ${
              checkingAvailability ? 'opacity-50' : ''
            }`}
            disabled={checkingAvailability}
          >
            <option value="" className="bg-[#1E1F1E] text-[#C5C5B5]">No preference</option>
            {getAvailableApartments().map((apartment) => (
              <option key={apartment.id} value={apartment.title} className="bg-[#1E1F1E] text-green-400">
                ✓ {apartment.title} - €{apartment.price}/month (Fully Available)
              </option>
            ))}
            {getPartiallyAvailableApartments().map((data: any) => (
              <option key={data.apartment.id} value={data.apartment.title} className="bg-[#1E1F1E] text-yellow-400">
                ⚠ {data.apartment.title} - €{data.apartment.price}/month (Partially Available - {data.availableDays} days)
              </option>
            ))}
            <option value="flexible" className="bg-[#1E1F1E] text-blue-400">
              🔄 I'm flexible - help me find the best combination
            </option>
          </select>
        </div>
      </div>

      {/* Live Availability Display */}
      {formData.arrival_date && formData.departure_date && !checkingAvailability && (
        <AvailabilityDisplay
          apartmentAvailability={apartmentAvailability}
          arrivalDate={formData.arrival_date}
          departureDate={formData.departure_date}
        />
      )}
      
      {/* Debug Information (remove in production) */}
      {process.env.NODE_ENV === 'development' && formData.arrival_date && formData.departure_date && (
        <div className="p-3 bg-gray-800 rounded text-xs text-gray-300 font-mono">
          <div>Debug Info:</div>
          <div>Dates: {formData.arrival_date} to {formData.departure_date}</div>
          <div>Checking: {checkingAvailability ? 'Yes' : 'No'}</div>
          <div>Apartments loaded: {Object.keys(apartmentAvailability).length}</div>
          {Object.entries(apartmentAvailability).map(([id, data]: [string, any]) => (
            <div key={id}>
              {data.apartment.title}: {data.isFullyAvailable ? 'FULLY' : 'PARTIALLY'} available 
              ({data.availableDays}/{data.totalDays} days)
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApartmentSelector;