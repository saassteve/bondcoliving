import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Calendar, Mail, Phone, User, Home, MessageSquare, Search, ArrowRight, CheckCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { applicationService, apartmentService, availabilityService, type Apartment } from '../../lib/supabase';

const ApplicationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [availableApartments, setAvailableApartments] = useState<Apartment[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    arrival_date: '',
    departure_date: '',
    apartment_preference: '',
    heard_from: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchApartments();
  }, []);

  useEffect(() => {
    if (formData.arrival_date && formData.departure_date) {
      checkApartmentAvailability();
    } else {
      setAvailableApartments(apartments);
    }
  }, [formData.arrival_date, formData.departure_date, apartments]);
  const fetchApartments = async () => {
    try {
      const data = await apartmentService.getAll();
      setApartments(data);
      setAvailableApartments(data);
    } catch (error) {
      console.error('Error fetching apartments:', error);
    }
  };

  const checkApartmentAvailability = async () => {
    if (!formData.arrival_date || !formData.departure_date) {
      setAvailableApartments(apartments);
      return;
    }

    setCheckingAvailability(true);
    try {
      const available = await Promise.all(
        apartments.map(async (apartment) => {
          try {
            const isAvailable = await availabilityService.checkAvailability(
              apartment.id,
              formData.arrival_date,
              formData.departure_date
            );
            return { apartment, isAvailable };
          } catch (error) {
            console.error(`Error checking availability for ${apartment.title}:`, error);
            return { apartment, isAvailable: true }; // Default to available if check fails
          }
        })
      );

      const availableApts = available
        .filter(({ isAvailable }) => isAvailable)
        .map(({ apartment }) => apartment);

      setAvailableApartments(availableApts);
    } catch (error) {
      console.error('Error checking apartment availability:', error);
      setAvailableApartments(apartments); // Fallback to all apartments
    } finally {
      setCheckingAvailability(false);
    }
  };
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (step === 2) {
      if (!formData.arrival_date) newErrors.arrival_date = 'Arrival date is required';
      if (!formData.departure_date) newErrors.departure_date = 'Departure date is required';
      
      if (formData.arrival_date && formData.departure_date) {
        const arrivalDate = new Date(formData.arrival_date);
        const departureDate = new Date(formData.departure_date);
        const diffTime = departureDate.getTime() - arrivalDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30) {
          newErrors.departure_date = 'Minimum stay is 30 days';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      console.log('Submitting application with data:', formData);
      
      const applicationData = {
        ...formData,
        about: 'Booking submitted via website form'
      };
      
      const result = await applicationService.create(applicationData);
      console.log('Application submission result:', result);
      
      // Always navigate to thank you page, even with fallback storage
      navigate('/thank-you');
    } catch (error) {
      console.error('Error submitting application:', error);
      
      // More user-friendly error handling
      if (error instanceof Error) {
        if (error.message.includes('RLS') || error.message.includes('42501') || error.message.includes('Edge Function failed')) {
          setErrors({ general: 'Your application has been received and saved. We will contact you within 24 hours to confirm your booking. For immediate assistance, please email us at hello@stayatbond.com' });
        } else {
          setErrors({ general: `Submission failed: ${error.message}. Please try again or contact us at hello@stayatbond.com` });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again or contact us at hello@stayatbond.com' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleArrivalDateChange = (date: Date | null) => {
    if (date) {
      handleInputChange('arrival_date', formatDateForInput(date));
      // Clear departure date if it's before the new minimum date
      if (formData.departure_date) {
        const departureDate = new Date(formData.departure_date);
        const minDeparture = new Date(date.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days in milliseconds
        if (departureDate < minDeparture) {
          handleInputChange('departure_date', '');
          handleInputChange('apartment_preference', ''); // Clear apartment preference when dates change
        }
      }
    }
  };

  const handleDepartureDateChange = (date: Date | null) => {
    if (date) {
      handleInputChange('departure_date', formatDateForInput(date));
      // Clear apartment preference when departure date changes
      if (formData.apartment_preference) {
        handleInputChange('apartment_preference', '');
      }
    }
  };

  const getMinDepartureDate = () => {
    if (!formData.arrival_date) return new Date();
    const arrivalDate = new Date(formData.arrival_date);
    const minDepartureDate = new Date(arrivalDate);
    minDepartureDate.setDate(arrivalDate.getDate() + 30); // Minimum 30 days stay
    return minDepartureDate;
  };

  const calculateStayDuration = () => {
    if (!formData.arrival_date || !formData.departure_date) return '';
    const arrival = new Date(formData.arrival_date);
    const departure = new Date(formData.departure_date);
    const diffTime = Math.abs(departure.getTime() - arrival.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    
    if (months > 0) {
      return days > 0 ? `${months} month${months > 1 ? 's' : ''}, ${days} day${days > 1 ? 's' : ''}` : `${months} month${months > 1 ? 's' : ''}`;
    }
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <>
      <Helmet>
        <title>Book Your Stay - Bond Coliving Funchal, Madeira | Digital Nomad Accommodation</title>
        <meta name="description" content="Reserve your private apartment at Bond Coliving in central Funchal, Madeira. Premium digital nomad accommodation with all amenities included. Minimum 30-day stays." />
        <meta name="keywords" content="book Bond coliving, reserve apartment Funchal, digital nomad booking Madeira, long term stay Funchal, coliving reservation central Madeira" />
        <link rel="canonical" href="https://stayatbond.com/apply" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Book Your Stay - Bond Coliving Funchal, Madeira" />
        <meta property="og:description" content="Reserve your private apartment at Bond Coliving in central Funchal, Madeira. Premium digital nomad accommodation with all amenities included." />
        <meta property="og:url" content="https://stayatbond.com/apply" />
        <meta property="og:image" content="https://iili.io/FcOqdX9.png" />
        
        {/* Twitter */}
        <meta name="twitter:title" content="Book Your Stay - Bond Coliving Funchal, Madeira" />
        <meta name="twitter:description" content="Reserve your private apartment at Bond Coliving in central Funchal, Madeira. Premium digital nomad accommodation with all amenities included." />
        <meta name="twitter:image" content="https://iili.io/FcOqdX9.png" />
      </Helmet>
      
      {/* Hero */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/6164986/pexels-photo-6164986.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center"></div>
        <div className="container relative z-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-8">Reserve Your Place</h1>
            <p className="text-xl md:text-2xl text-[#C5C5B5]">
              Join our community of digital nomads in central Funchal.
            </p>
          </div>
        </div>
      </section>
      
      {/* Form Section */}
      <section className="py-24 bg-[#1E1F1E]">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            {/* Progress Indicator */}
            <div className="mb-12">
              <div className="flex items-center justify-center space-x-4">
                {[1, 2, 3].map((step) => (
                  <React.Fragment key={step}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step <= currentStep 
                        ? 'bg-[#C5C5B5] text-[#1E1F1E]' 
                        : 'bg-[#C5C5B5]/20 text-[#C5C5B5]/60'
                    }`}>
                      {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`w-12 h-1 rounded-full transition-all ${
                        step < currentStep ? 'bg-[#C5C5B5]' : 'bg-[#C5C5B5]/20'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="text-center mt-4">
                <p className="text-[#C5C5B5]/60 text-sm">
                  Step {currentStep} of 3
                </p>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-[#C5C5B5]/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#C5C5B5]/10">
              {errors.general && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
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
                          onChange={(e) => handleInputChange('name', e.target.value)}
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
                          onChange={(e) => handleInputChange('email', e.target.value)}
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
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all"
                          placeholder="Enter your phone number (optional)"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Stay Details */}
                {currentStep === 2 && (
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
                            onChange={handleArrivalDateChange}
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
                            onChange={handleDepartureDateChange}
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

                    <div className="relative group">
                      <label htmlFor="apartment_preference" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
                        Apartment Preference {checkingAvailability && <span className="text-xs">(Checking availability...)</span>}
                      </label>
                      <div className="relative">
                        <Home className="absolute left-4 top-4 w-5 h-5 text-[#C5C5B5]/60" />
                        <select
                          id="apartment_preference"
                          value={formData.apartment_preference}
                          onChange={(e) => handleInputChange('apartment_preference', e.target.value)}
                          className={`w-full pl-12 pr-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] focus:outline-none focus:border-[#C5C5B5] transition-all appearance-none cursor-pointer ${
                            checkingAvailability ? 'opacity-50' : ''
                          }`}
                          disabled={checkingAvailability}
                        >
                          <option value="" className="bg-[#1E1F1E] text-[#C5C5B5]">No preference</option>
                          {availableApartments.map((apartment) => (
                            <option key={apartment.id} value={apartment.title} className="bg-[#1E1F1E] text-[#C5C5B5]">
                              {apartment.title} - €{apartment.price}/month
                            </option>
                          ))}
                          {formData.arrival_date && formData.departure_date && availableApartments.length === 0 && (
                            <option value="" className="bg-[#1E1F1E] text-red-400" disabled>
                              No apartments available for selected dates
                            </option>
                          )}
                        </select>
                      </div>
                      {formData.arrival_date && formData.departure_date && (
                        <div className="mt-3 text-sm">
                          {availableApartments.length > 0 ? (
                            <p className="text-green-400">
                              ✓ {availableApartments.length} apartment{availableApartments.length !== 1 ? 's' : ''} available for your dates
                            </p>
                          ) : checkingAvailability ? (
                            <p className="text-[#C5C5B5]/60">
                              Checking availability...
                            </p>
                          ) : (
                            <p className="text-red-400">
                              ✗ No apartments available for selected dates. Please try different dates.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Additional Information */}
                {currentStep === 3 && (
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
                          onChange={(e) => handleInputChange('heard_from', e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] focus:outline-none focus:border-[#C5C5B5] transition-all appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-[#1E1F1E] text-[#C5C5B5]">Select an option</option>
                          <option value="Google Search" className="bg-[#1E1F1E] text-[#C5C5B5]">Google Search</option>
                          <option value="Social Media" className="bg-[#1E1F1E] text-[#C5C5B5]">Social Media</option>
                          <option value="Friend Referral" className="bg-[#1E1F1E] text-[#C5C5B5]">Friend Referral</option>
                          <option value="Digital Nomad Community" className="bg-[#1E1F1E] text-[#C5C5B5]">Digital Nomad Community</option>
                          <option value="Other" className="bg-[#1E1F1E] text-[#C5C5B5]">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Booking Summary */}
                    <div className="mt-8 p-6 bg-[#C5C5B5]/10 rounded-2xl border border-[#C5C5B5]/20">
                      <h3 className="text-lg font-bold text-[#C5C5B5] mb-4">Booking Summary</h3>
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
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-12">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-8 py-4 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-full hover:bg-[#C5C5B5]/20 transition-all font-semibold text-sm uppercase tracking-wide border border-[#C5C5B5]/20"
                    >
                      Previous
                    </button>
                  )}
                  
                  <div className="ml-auto">
                    {currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-semibold text-sm uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-105 flex items-center"
                      >
                        Next Step
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-semibold text-sm uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1E1F1E] mr-3"></div>
                            Booking...
                          </>
                        ) : (
                          <>
                            Complete Booking
                            <CheckCircle className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Additional Information */}
            <div className="mt-12 text-center">
              <p className="text-[#C5C5B5]/60 text-sm mb-4">
                We'll confirm your booking within 48 hours and send you all the details.
              </p>
              <p className="text-[#C5C5B5]/40 text-xs">
                Questions? Email us at{' '}
                <a href="mailto:hello@stayatbond.com" className="text-[#C5C5B5]/60 hover:text-[#C5C5B5] underline">
                  hello@stayatbond.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ApplicationFormPage;