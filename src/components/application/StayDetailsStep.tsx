import React from 'react';
import { Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ApartmentSelector from './ApartmentSelector';
import FlexibleOptions from './FlexibleOptions';

interface StayDetailsStepProps {
  formData: {
    arrival_date: string;
    departure_date: string;
    apartment_preference: string;
  };
  errors: Record<string, string>;
  apartmentAvailability: Record<string, any>;
  checkingAvailability: boolean;
  onInputChange: (field: string, value: string) => void;
  onArrivalDateChange: (date: Date | null) => void;
  onDepartureDateChange: (date: Date | null) => void;
  getMinDepartureDate: () => Date;
  calculateStayDuration: () => string;
}

const StayDetailsStep: React.FC<StayDetailsStepProps> = ({
  formData,
  errors,
  apartmentAvailability,
  checkingAvailability,
  onInputChange,
  onArrivalDateChange,
  onDepartureDateChange,
  getMinDepartureDate,
  calculateStayDuration,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">
          <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
            Stay Details
          </span>
        </h2>
        <p className="text-[#C5C5B5]/80">When would you like to stay with us?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative group">
          <label htmlFor="arrival_date" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
            Arrival Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C5C5B5]/60 pointer-events-none" />
            <DatePicker
              selected={formData.arrival_date ? new Date(formData.arrival_date) : null}
              onChange={onArrivalDateChange}
              minDate={new Date()}
              placeholderText="Select arrival date"
              className={`w-full pl-12 pr-4 py-4 bg-[#C5C5B5]/5 border-2 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none transition-all cursor-pointer ${
                errors.arrival_date ? 'border-red-500/50' : 'border-[#C5C5B5]/20 focus:border-[#C5C5B5]'
              }`}
              calendarClassName="custom-datepicker"
              popperClassName="custom-datepicker-popper"
              dateFormat="MMMM dd, yyyy"
              required
            />
          </div>
          {errors.arrival_date && <p className="mt-2 text-sm text-red-400">{errors.arrival_date}</p>}
        </div>

        <div className="relative group">
          <label htmlFor="departure_date" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
            Departure Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C5C5B5]/60 pointer-events-none" />
            <DatePicker
              selected={formData.departure_date ? new Date(formData.departure_date) : null}
              onChange={onDepartureDateChange}
              minDate={getMinDepartureDate()}
              placeholderText={formData.arrival_date ? "Select departure date" : "Select arrival date first"}
              className={`w-full pl-12 pr-4 py-4 bg-[#C5C5B5]/5 border-2 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none transition-all cursor-pointer ${
                errors.departure_date ? 'border-red-500/50' : 'border-[#C5C5B5]/20 focus:border-[#C5C5B5]'
              } ${!formData.arrival_date ? 'opacity-50 cursor-not-allowed' : ''}`}
              calendarClassName="custom-datepicker"
              popperClassName="custom-datepicker-popper"
              dateFormat="MMMM dd, yyyy"
              disabled={!formData.arrival_date}
              required
            />
          </div>
          {errors.departure_date && <p className="mt-2 text-sm text-red-400">{errors.departure_date}</p>}
          {formData.arrival_date && formData.departure_date && (
            <p className="mt-2 text-sm text-[#C5C5B5]/60">
              Duration: {calculateStayDuration()}
            </p>
          )}
        </div>
      </div>

      <ApartmentSelector
        formData={{ apartment_preference: formData.apartment_preference }}
        apartmentAvailability={apartmentAvailability}
        checkingAvailability={checkingAvailability}
        onInputChange={onInputChange}
      />

      {/* Simple availability note */}
      {formData.arrival_date && formData.departure_date && (
        <div className="p-4 bg-[#C5C5B5]/10 border border-[#C5C5B5]/20 rounded-xl">
          <p className="text-sm text-[#C5C5B5]/80">
            We'll check availability for your selected dates and confirm the best apartment option within 48 hours.
          </p>
        </div>
      )}
    </div>
  );
};

export default StayDetailsStep;