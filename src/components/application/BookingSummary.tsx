import React from 'react';
import { CheckCircle, Calendar, Home, MessageSquare, Shuffle } from 'lucide-react';

interface BookingSummaryProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    arrival_date: string;
    departure_date: string;
    apartment_preference: string;
    about: string;
  };
  calculateStayDuration: () => string;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  formData,
  calculateStayDuration
}) => {
  return (
    <div className="mt-8 p-6 bg-[#C5C5B5]/10 rounded-2xl border border-[#C5C5B5]/20">
      <h3 className="text-lg font-bold text-[#C5C5B5] mb-4 flex items-center">
        <CheckCircle className="w-5 h-5 mr-2" />
        Booking Summary
      </h3>
      
      <div className="space-y-3 text-[#C5C5B5]/80">
        <div className="flex justify-between">
          <span>Name:</span>
          <span className="font-medium">{formData.name || 'Not provided'}</span>
        </div>
        <div className="flex justify-between">
          <span>Email:</span>
          <span className="font-medium">{formData.email || 'Not provided'}</span>
        </div>
        {formData.phone && (
          <div className="flex justify-between">
            <span>Phone:</span>
            <span className="font-medium">{formData.phone}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Arrival:</span>
          <span className="font-medium">
            {formData.arrival_date ? new Date(formData.arrival_date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : 'Not selected'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Departure:</span>
          <span className="font-medium">
            {formData.departure_date ? new Date(formData.departure_date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : 'Not selected'}
          </span>
        </div>
        {formData.arrival_date && formData.departure_date && (
          <div className="flex justify-between border-t border-[#C5C5B5]/20 pt-3">
            <span>Duration:</span>
            <span className="font-medium">{calculateStayDuration()}</span>
          </div>
        )}
        {formData.apartment_preference && (
          <div className="flex justify-between">
            <span>Preference:</span>
            <span className="font-medium">{formData.apartment_preference}</span>
          </div>
        )}
        {formData.about && (
          <div className="border-t border-[#C5C5B5]/20 pt-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-[#C5C5B5] mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium block mb-1">About:</span>
                <p className="text-sm text-[#C5C5B5]/70 leading-relaxed">{formData.about}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingSummary;