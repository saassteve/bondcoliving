import React from 'react';
import { User, Mail, Phone } from 'lucide-react';

interface PersonalInfoStepProps {
  formData: {
    name: string;
    email: string;
    phone: string;
  };
  errors: Record<string, string>;
  onInputChange: (field: string, value: string) => void;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  formData,
  errors,
  onInputChange
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">
          <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
            Personal Information
          </span>
        </h2>
        <p className="text-[#C5C5B5]/80">Tell us a bit about yourself</p>
      </div>

      <div className="relative group">
        <label htmlFor="name" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
          Full Name *
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C5C5B5]/60" />
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            className={`w-full pl-12 pr-4 py-4 bg-[#C5C5B5]/5 border-2 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none transition-all ${
              errors.name ? 'border-red-500/50' : 'border-[#C5C5B5]/20 focus:border-[#C5C5B5]'
            }`}
            placeholder="Enter your full name"
            required
          />
        </div>
        {errors.name && <p className="mt-2 text-sm text-red-400">{errors.name}</p>}
      </div>

      <div className="relative group">
        <label htmlFor="email" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
          Email Address *
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C5C5B5]/60" />
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            className={`w-full pl-12 pr-4 py-4 bg-[#C5C5B5]/5 border-2 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none transition-all ${
              errors.email ? 'border-red-500/50' : 'border-[#C5C5B5]/20 focus:border-[#C5C5B5]'
            }`}
            placeholder="Enter your email address"
            required
          />
        </div>
        {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
      </div>

      <div className="relative group">
        <label htmlFor="phone" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C5C5B5]/60" />
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all"
            placeholder="Enter your phone number (optional)"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;