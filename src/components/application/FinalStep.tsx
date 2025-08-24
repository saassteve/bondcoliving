import React from 'react';
import { Search, CheckCircle } from 'lucide-react';
import BookingSummary from './BookingSummary';

interface FinalStepProps {
  formData: {
    heard_from: string;
    about: string;
    name: string;
    email: string;
    phone: string;
    arrival_date: string;
    departure_date: string;
    apartment_preference: string;
  };
  onInputChange: (field: string, value: string) => void;
  calculateStayDuration: () => string;
}

const FinalStep: React.FC<FinalStepProps> = ({
  formData,
  onInputChange,
  calculateStayDuration
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">
          <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
            Almost Done
          </span>
        </h2>
        <p className="text-[#C5C5B5]/80">Just a few more details</p>
      </div>

      <div className="relative group">
        <label htmlFor="heard_from" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
          How did you hear about us?
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-4 w-5 h-5 text-[#C5C5B5]/60" />
          <select
            id="heard_from"
            value={formData.heard_from}
            onChange={(e) => onInputChange('heard_from', e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] focus:outline-none focus:border-[#C5C5B5] transition-all appearance-none cursor-pointer"
          >
            <option value="" className="bg-[#1E1F1E] text-[#C5C5B5]">Select an option</option>
            <option value="Google Search" className="bg-[#1E1F1E] text-[#C5C5B5]">Google Search</option>
            <option value="Social Media" className="bg-[#1E1F1E] text-[#C5C5B5]">Social Media</option>
            <option value="Friend Referral" className="bg-[#1E1F1E] text-[#C5C5B5]">Friend Referral</option>
            <option value="Digital Nomad Community" className="bg-[#1E1F1E] text-[#C5C5B5]">Digital Nomad Community</option>
            <option value="Nomad List" className="bg-[#1E1F1E] text-[#C5C5B5]">Nomad List</option>
            <option value="Reddit" className="bg-[#1E1F1E] text-[#C5C5B5]">Reddit</option>
            <option value="Instagram" className="bg-[#1E1F1E] text-[#C5C5B5]">Instagram</option>
            <option value="Other" className="bg-[#1E1F1E] text-[#C5C5B5]">Other</option>
          </select>
        </div>
      </div>

      <div className="relative group">
        <label htmlFor="about" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
          Tell us about yourself
        </label>
        <textarea
          id="about"
          value={formData.about}
          onChange={(e) => onInputChange('about', e.target.value)}
          rows={4}
          className="w-full px-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all resize-none"
          placeholder="Tell us about your work, why you're interested in Bond, and what you're looking for in your stay..."
          required
        />
        <p className="text-xs text-[#C5C5B5]/60 mt-2">
          Help us understand what you're looking for so we can provide the best experience.
        </p>
      </div>
      <BookingSummary
        formData={formData}
        calculateStayDuration={calculateStayDuration}
      />
    </div>
  );
};

export default FinalStep;