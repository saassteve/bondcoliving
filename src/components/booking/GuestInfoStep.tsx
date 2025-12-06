import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, User, Mail, Phone, Users, FileText } from 'lucide-react';

interface GuestInfoStepProps {
  initialData: {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    guestCount: number;
    specialInstructions: string;
  };
  onComplete: (data: {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    guestCount: number;
    specialInstructions: string;
  }) => void;
  onBack: () => void;
}

const GuestInfoStep: React.FC<GuestInfoStepProps> = ({ initialData, onComplete, onBack }) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.guestName.trim()) {
      newErrors.guestName = 'Name is required';
    }

    if (!formData.guestEmail.trim()) {
      newErrors.guestEmail = 'Email is required';
    } else if (!validateEmail(formData.guestEmail)) {
      newErrors.guestEmail = 'Please enter a valid email address';
    }

    if (formData.guestCount < 1) {
      newErrors.guestCount = 'At least 1 guest is required';
    } else if (formData.guestCount > 10) {
      newErrors.guestCount = 'Maximum 10 guests allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onComplete(formData);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-[#C5C5B5] mb-2">Guest Information</h2>
      <p className="text-[#C5C5B5]/60 mb-6">
        Tell us about yourself and your stay
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
            <User className="w-4 h-4 inline-block mr-2" />
            Full Name *
          </label>
          <input
            type="text"
            value={formData.guestName}
            onChange={(e) => handleChange('guestName', e.target.value)}
            className={`w-full px-4 py-3 bg-[#1E1F1E] border rounded-lg text-[#C5C5B5] focus:ring-2 focus:ring-[#C5C5B5] focus:border-transparent ${
              errors.guestName ? 'border-red-500' : 'border-[#C5C5B5]/20'
            }`}
            placeholder="John Doe"
          />
          {errors.guestName && (
            <p className="text-red-400 text-sm mt-1">{errors.guestName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
            <Mail className="w-4 h-4 inline-block mr-2" />
            Email Address *
          </label>
          <input
            type="email"
            value={formData.guestEmail}
            onChange={(e) => handleChange('guestEmail', e.target.value)}
            className={`w-full px-4 py-3 bg-[#1E1F1E] border rounded-lg text-[#C5C5B5] focus:ring-2 focus:ring-[#C5C5B5] focus:border-transparent ${
              errors.guestEmail ? 'border-red-500' : 'border-[#C5C5B5]/20'
            }`}
            placeholder="john@example.com"
          />
          {errors.guestEmail && (
            <p className="text-red-400 text-sm mt-1">{errors.guestEmail}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
            <Phone className="w-4 h-4 inline-block mr-2" />
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.guestPhone}
            onChange={(e) => handleChange('guestPhone', e.target.value)}
            className="w-full px-4 py-3 bg-[#1E1F1E] border border-[#C5C5B5]/20 rounded-lg text-[#C5C5B5] focus:ring-2 focus:ring-[#C5C5B5] focus:border-transparent"
            placeholder="+351 123 456 789"
          />
          <p className="text-[#C5C5B5]/40 text-xs mt-1">
            Optional, but helpful for check-in coordination
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
            <Users className="w-4 h-4 inline-block mr-2" />
            Number of Guests *
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.guestCount}
            onChange={(e) => handleChange('guestCount', parseInt(e.target.value) || 1)}
            className={`w-full px-4 py-3 bg-[#1E1F1E] border rounded-lg text-[#C5C5B5] focus:ring-2 focus:ring-[#C5C5B5] focus:border-transparent ${
              errors.guestCount ? 'border-red-500' : 'border-[#C5C5B5]/20'
            }`}
          />
          {errors.guestCount && (
            <p className="text-red-400 text-sm mt-1">{errors.guestCount}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#C5C5B5] mb-2">
            <FileText className="w-4 h-4 inline-block mr-2" />
            Special Instructions
          </label>
          <textarea
            value={formData.specialInstructions}
            onChange={(e) => handleChange('specialInstructions', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-[#1E1F1E] border border-[#C5C5B5]/20 rounded-lg text-[#C5C5B5] focus:ring-2 focus:ring-[#C5C5B5] focus:border-transparent resize-none"
            placeholder="Any special requests or requirements? (e.g., early check-in, dietary preferences, accessibility needs)"
          />
          <p className="text-[#C5C5B5]/40 text-xs mt-1">
            Optional. We'll do our best to accommodate your requests.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-lg hover:bg-[#C5C5B5]/20 transition-colors flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-lg hover:bg-white transition-colors font-bold flex items-center justify-center"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </form>
  );
};

export default GuestInfoStep;
