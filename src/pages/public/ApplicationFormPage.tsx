import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Calendar, Mail, Phone, User, Home, MessageSquare, Search, ArrowRight, CheckCircle, AlertCircle, Clock, Shuffle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { applicationService, apartmentService, availabilityService, type Apartment } from '../../lib/supabase';

const ApplicationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [apartmentAvailability, setApartmentAvailability] = useState<Record<string, {
    apartment: Apartment;
    isFullyAvailable: boolean;
    availableDays: number;
    unavailablePeriods: Array<{ start: string; end: string; reason: string }>;
    suggestions?: string;
  }>>({});
  const [showFlexibleOptions, setShowFlexibleOptions] = useState(false);
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
    flexible_dates: false,
    apartment_switching: false,
    special_requests: '',
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
      // Reset availability data when dates are cleared
      const defaultAvailability: Record<string, any> = {};
      apartments.forEach(apt => {
        defaultAvailability[apt.id] = {
          apartment: apt,
          isFullyAvailable: true,
          availableDays: 0,
          unavailablePeriods: []
        };
      });
      setApartmentAvailability(defaultAvailability);
    }
  }, [formData.arrival_date, formData.departure_date, apartments]);
  const fetchApartments = async () => {
    try {
      const data = await apartmentService.getAll();
      setApartments(data);
      
      // Initialize availability data
      const defaultAvailability: Record<string, any> = {};
      data.forEach(apt => {
        defaultAvailability[apt.id] = {
          apartment: apt,
          isFullyAvailable: true,
          availableDays: 0,
          unavailablePeriods: []
        };
      });
      setApartmentAvailability(defaultAvailability);
    } catch (error) {
      console.error('Error fetching apartments:', error);
    }
  };

  const checkApartmentAvailability = async () => {
    if (!formData.arrival_date || !formData.departure_date) {
      return;
    }

    setCheckingAvailability(true);
    try {
      const availabilityData: Record<string, any> = {};
      
      await Promise.all(
        apartments.map(async (apartment) => {
          try {
            // Get detailed availability for the requested period
            const availability = await availabilityService.getCalendar(
              apartment.id,
              formData.arrival_date,
              formData.departure_date
            );
            
            // Calculate available and unavailable periods
            const requestedDates = getDateRange(formData.arrival_date, formData.departure_date);
            const unavailableDates = availability.filter(a => a.status !== 'available');
            const availableDays = requestedDates.length - unavailableDates.length;
            const isFullyAvailable = unavailableDates.length === 0;
            
            // Group consecutive unavailable dates into periods
            const unavailablePeriods = groupConsecutiveDates(unavailableDates);
            
            // Generate suggestions for partial availability
            let suggestions = '';
            if (!isFullyAvailable && availableDays > 0) {
              if (availableDays >= 30) {
                suggestions = `Available for ${availableDays} days of your ${requestedDates.length}-day stay. Consider splitting your stay or adjusting dates.`;
              } else if (availableDays >= 14) {
                suggestions = `Available for ${availableDays} days. Perfect for a shorter stay or combine with another apartment.`;
              } else {
                suggestions = `Limited availability (${availableDays} days). Consider alternative dates or apartments.`;
              }
            }
            
            availabilityData[apartment.id] = {
              apartment,
              isFullyAvailable,
              availableDays,
              unavailablePeriods,
              suggestions
            };
          } catch (error) {
            console.error(`Error checking availability for ${apartment.title}:`, error);
            // Default to available if check fails
            availabilityData[apartment.id] = {
              apartment,
              isFullyAvailable: true,
              availableDays: getDateRange(formData.arrival_date, formData.departure_date).length,
              unavailablePeriods: []
            };
          }
        })
      );

      setApartmentAvailability(availabilityData);
      
      // Show flexible options if no apartments are fully available
      const hasFullyAvailable = Object.values(availabilityData).some((data: any) => data.isFullyAvailable);
      const hasPartiallyAvailable = Object.values(availabilityData).some((data: any) => !data.isFullyAvailable && data.availableDays >= 14);
      setShowFlexibleOptions(!hasFullyAvailable && hasPartiallyAvailable);
      
    } catch (error) {
      console.error('Error checking apartment availability:', error);
      // Fallback to all apartments available
      const fallbackAvailability: Record<string, any> = {};
      apartments.forEach(apt => {
        fallbackAvailability[apt.id] = {
          apartment: apt,
          isFullyAvailable: true,
          availableDays: getDateRange(formData.arrival_date, formData.departure_date).length,
          unavailablePeriods: []
        };
      });
      setApartmentAvailability(fallbackAvailability);
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
      
      await applicationService.create(applicationData);
      navigate('/thank-you');
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrors({ general: 'Failed to submit booking. Please try again.' });
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

  const getDateRange = (startDate: string, endDate: string): string[] => {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current < end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const groupConsecutiveDates = (unavailableDates: any[]): Array<{ start: string; end: string; reason: string }> => {
    if (unavailableDates.length === 0) return [];
    
    const sorted = unavailableDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const periods: Array<{ start: string; end: string; reason: string }> = [];
    
    let currentPeriod = {
      start: sorted[0].date,
      end: sorted[0].date,
      reason: sorted[0].notes || `${sorted[0].status} period`
    };
    
    for (let i = 1; i < sorted.length; i++) {
      const currentDate = new Date(sorted[i].date);
      const previousDate = new Date(sorted[i - 1].date);
      const dayDiff = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        // Consecutive date, extend current period
        currentPeriod.end = sorted[i].date;
      } else {
        // Gap found, start new period
        periods.push(currentPeriod);
        currentPeriod = {
          start: sorted[i].date,
          end: sorted[i].date,
          reason: sorted[i].notes || `${sorted[i].status} period`
        };
      }
    }
    
    periods.push(currentPeriod);
    return periods;
  };

  const getAvailableApartments = () => {
    return Object.values(apartmentAvailability)
      .filter((data: any) => data.isFullyAvailable)
      .map((data: any) => data.apartment);
  };

  const getPartiallyAvailableApartments = () => {
    return Object.values(apartmentAvailability)
      .filter((data: any) => !data.isFullyAvailable && data.availableDays >= 14)
      .map((data: any) => data);
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
                        Apartment Preference {checkingAvailability && <span className="text-xs animate-pulse">(Checking live availability...)</span>}
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
                          {getAvailableApartments().map((apartment) => (
                            <option key={apartment.id} value={apartment.title} className="bg-[#1E1F1E] text-green-400">
                              ✓ {apartment.title} - €{apartment.price}/month (Fully Available)
                            </option>
                          ))}
                          {getPartiallyAvailableApartments().map((data: any) => (
                            <option key={data.apartment.id} value={data.apartment.title} className="bg-[#1E1F1E] text-yellow-400">
                              ⚠ {data.apartment.title} - €{data.apartment.price}/month (Partially Available - {data.availableDays} days)
                            </option>
                          )}
                          <option value="flexible" className="bg-[#1E1F1E] text-blue-400">
                            🔄 I'm flexible - help me find the best combination
                          </option>
                        </select>
                      </div>
                      
                      {/* Live Availability Display */}
                      {formData.arrival_date && formData.departure_date && !checkingAvailability && (
                        <div className="mt-4 space-y-3">
                          {Object.values(apartmentAvailability).map((data: any) => {
                            const { apartment, isFullyAvailable, availableDays, unavailablePeriods, suggestions } = data;
                            const totalDays = getDateRange(formData.arrival_date, formData.departure_date).length;
                            
                            return (
                              <div key={apartment.id} className={`p-4 rounded-xl border transition-all ${
                                isFullyAvailable 
                                  ? 'bg-green-500/10 border-green-500/30' 
                                  : availableDays >= 14
                                    ? 'bg-yellow-500/10 border-yellow-500/30'
                                    : 'bg-red-500/10 border-red-500/30'
                              }`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-bold text-[#C5C5B5]">{apartment.title}</h4>
                                      <span className="text-sm text-[#C5C5B5]/60">€{apartment.price}/month</span>
                                    </div>
                                    
                                    {isFullyAvailable ? (
                                      <div className="flex items-center text-green-400 text-sm">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Fully available for your entire stay ({totalDays} days)
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <div className="flex items-center text-yellow-400 text-sm">
                                          <AlertCircle className="w-4 h-4 mr-2" />
                                          Available for {availableDays} of {totalDays} days
                                        </div>
                                        
                                        {unavailablePeriods.length > 0 && (
                                          <div className="text-xs text-[#C5C5B5]/60">
                                            <strong>Unavailable periods:</strong>
                                            {unavailablePeriods.map((period, idx) => (
                                              <div key={idx} className="ml-2">
                                                • {new Date(period.start).toLocaleDateString()} - {new Date(period.end).toLocaleDateString()} ({period.reason})
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        
                                        {suggestions && (
                                          <div className="text-xs text-blue-400 bg-blue-500/10 p-2 rounded">
                                            💡 {suggestions}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Flexible Options */}
                          {showFlexibleOptions && (
                            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                              <div className="flex items-start gap-3">
                                <Shuffle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h4 className="font-bold text-blue-400 mb-2">Flexible Stay Options</h4>
                                  <p className="text-sm text-[#C5C5B5]/80 mb-3">
                                    We can help you create a custom stay by combining apartments or adjusting dates. 
                                    Many guests enjoy experiencing different spaces during their time with us.
                                  </p>
                                  
                                  <div className="space-y-2">
                                    <label className="flex items-center text-sm text-[#C5C5B5]/80">
                                      <input
                                        type="checkbox"
                                        checked={formData.flexible_dates}
                                        onChange={(e) => handleInputChange('flexible_dates', e.target.checked.toString())}
                                        className="mr-2 rounded"
                                      />
                                      I'm flexible with my dates (±1-2 weeks)
                                    </label>
                                    
                                    <label className="flex items-center text-sm text-[#C5C5B5]/80">
                                      <input
                                        type="checkbox"
                                        checked={formData.apartment_switching}
                                        onChange={(e) => handleInputChange('apartment_switching', e.target.checked.toString())}
                                        className="mr-2 rounded"
                                      />
                                      I'm open to switching apartments during my stay
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Summary */}
                          <div className="p-4 bg-[#C5C5B5]/10 border border-[#C5C5B5]/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-[#C5C5B5]" />
                              <span className="font-medium text-[#C5C5B5]">Availability Summary</span>
                            </div>
                            <div className="text-sm text-[#C5C5B5]/80">
                              {(() => {
                                const fullyAvailable = getAvailableApartments().length;
                                const partiallyAvailable = getPartiallyAvailableApartments().length;
                                
                                if (fullyAvailable > 0) {
                                  return `✓ ${fullyAvailable} apartment${fullyAvailable !== 1 ? 's' : ''} fully available for your dates`;
                                } else if (partiallyAvailable > 0) {
                                  return `⚠ ${partiallyAvailable} apartment${partiallyAvailable !== 1 ? 's' : ''} partially available - we can work with you to create a custom stay`;
                                } else {
                                  return `No apartments available for these exact dates, but we may be able to accommodate you with flexible arrangements`;
                                }
                              })()}
                            </div>
                          </div>
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