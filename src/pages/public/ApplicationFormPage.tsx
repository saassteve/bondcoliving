import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { applicationService, apartmentService, availabilityService, type Apartment } from '../../lib/supabase';
import PersonalInfoStep from '../../components/application/PersonalInfoStep';
import StayDetailsStep from '../../components/application/StayDetailsStep';
import FinalStep from '../../components/application/FinalStep';
import ProgressIndicator from '../../components/application/ProgressIndicator';
import FormNavigation from '../../components/application/FormNavigation';

const ApplicationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [apartmentAvailability, setApartmentAvailability] = useState<Record<string, {
    apartment: Apartment;
  }>>({});
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
    about: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchApartments();
  }, []);

  useEffect(() => {
    if (formData.arrival_date && formData.departure_date) {
      // Just load apartments for selection, don't check detailed availability
      loadApartmentsForSelection();
    } else {
      resetApartmentData();
    }
  }, [formData.arrival_date, formData.departure_date, apartments]);
  
  const fetchApartments = async () => {
    try {
      const data = await apartmentService.getAll();
      setApartments(data);
      resetApartmentData(data);
    } catch (error) {
      console.error('Error fetching apartments:', error);
    }
  };

  const resetApartmentData = (apartmentData = apartments) => {
    const apartmentMap: Record<string, any> = {};
    apartmentData.forEach(apt => {
      apartmentMap[apt.id] = {
        apartment: apt
      };
    });
    setApartmentAvailability(apartmentMap);
  };

  const loadApartmentsForSelection = () => {
    // Simply load apartments for selection without complex availability checking
    const apartmentMap: Record<string, any> = {};
    apartments.forEach(apt => {
      apartmentMap[apt.id] = {
        apartment: apt
      };
    });
    setApartmentAvailability(apartmentMap);
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

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const applicationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        arrival_date: formData.arrival_date,
        departure_date: formData.departure_date,
        apartment_preference: formData.apartment_preference || null,
        heard_from: formData.heard_from || null,
        about: formData.about || `Application for stay from ${formData.arrival_date} to ${formData.departure_date}.`
      };
      
      await applicationService.create(applicationData);
      navigate('/thank-you');
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrors({ general: 'Failed to submit application. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleArrivalDateChange = (date: Date | null) => {
    if (date) {
      handleInputChange('arrival_date', formatDateForInput(date));
      if (formData.departure_date) {
        const departureDate = new Date(formData.departure_date);
        const minDeparture = new Date(date.getTime() + (30 * 24 * 60 * 60 * 1000));
        if (departureDate < minDeparture) {
          handleInputChange('departure_date', '');
        }
      }
    }
  };

  const handleDepartureDateChange = (date: Date | null) => {
    if (date) {
      handleInputChange('departure_date', formatDateForInput(date));
    }
  };

  const getMinDepartureDate = () => {
    if (!formData.arrival_date) return new Date();
    const arrivalDate = new Date(formData.arrival_date);
    const minDepartureDate = new Date(arrivalDate);
    minDepartureDate.setDate(arrivalDate.getDate() + 30);
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
        
        <meta property="og:title" content="Book Your Stay - Bond Coliving Funchal, Madeira" />
        <meta property="og:description" content="Reserve your private apartment at Bond Coliving in central Funchal, Madeira. Premium digital nomad accommodation with all amenities included." />
        <meta property="og:url" content="https://stayatbond.com/apply" />
        <meta property="og:image" content="https://iili.io/FcOqdX9.png" />
        
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
            <ProgressIndicator currentStep={currentStep} totalSteps={3} />

            <div className="bg-[#C5C5B5]/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#C5C5B5]/10">
              {errors.general && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm">
                  {errors.general}
                </div>
              )}

              <form onSubmit={(e) => e.preventDefault()}>
                {currentStep === 1 && (
                  <PersonalInfoStep
                    formData={formData}
                    errors={errors}
                    onInputChange={handleInputChange}
                  />
                )}

                {currentStep === 2 && (
                  <StayDetailsStep
                    formData={formData}
                    errors={errors}
                    apartmentAvailability={apartmentAvailability}
                    checkingAvailability={checkingAvailability}
                    onInputChange={handleInputChange}
                    onArrivalDateChange={handleArrivalDateChange}
                    onDepartureDateChange={handleDepartureDateChange}
                    getMinDepartureDate={getMinDepartureDate}
                    calculateStayDuration={calculateStayDuration}
                  />
                )}

                {currentStep === 3 && (
                  <FinalStep
                    formData={formData}
                    onInputChange={handleInputChange}
                    calculateStayDuration={calculateStayDuration}
                  />
                )}

                <FormNavigation
                  currentStep={currentStep}
                  totalSteps={3}
                  isSubmitting={isSubmitting}
                  onPrevious={prevStep}
                  onNext={nextStep}
                  onSubmit={handleSubmit}
                />
              </form>
            </div>

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