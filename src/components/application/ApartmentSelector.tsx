import React from 'react';
import { Home } from 'lucide-react';

interface ApartmentSelectorProps {
  formData: {
    apartment_preference: string;
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
  const getApartments = () => {
    return Object.values(apartmentAvailability).map((data: any) => data.apartment);
  };

  return (
    <div className="space-y-6">
      <div className="relative group">
        <label htmlFor="apartment_preference" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
          Apartment Preference
        </label>
        <div className="relative">
          <Home className="absolute left-4 top-4 w-5 h-5 text-[#C5C5B5]/60" />
          <select
            id="apartment_preference"
            value={formData.apartment_preference}
            onChange={(e) => onInputChange('apartment_preference', e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] focus:outline-none focus:border-[#C5C5B5] transition-all appearance-none cursor-pointer"
          >
            <option value="" className="bg-[#1E1F1E] text-[#C5C5B5]">No preference - let us choose the best fit</option>
            {getApartments().map((apartment) => (
              <option key={apartment.id} value={apartment.title} className="bg-[#1E1F1E] text-[#C5C5B5]">
                {apartment.title} - €{apartment.price}/month ({apartment.size})
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-[#C5C5B5]/60 mt-2">
          We'll check availability and confirm the best apartment for your dates within 48 hours.
        </p>
      </div>
    </div>
  );
};

export default ApartmentSelector;